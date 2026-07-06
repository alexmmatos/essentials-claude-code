#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { walkFiles } = require("./fsutil");

const DEFAULT_TOP_TERMS = 8;

function printHelp() {
  console.log(`node src/rankAgentRelevance.js <terms-json> <project-root> [options]

Ranks agent templates by literal term relevance using one ripgrep scan.

Input JSON format:
  Term map:
  {
    "api": [
      { "template": "api-designer", "relevance": 4 },
      { "template": "api-documenter", "relevance": 3 }
    ]
  }

  Agent-centric:
  {
    "agent-name": {
      "term": weight,
      "multi word term": weight
    }
  }

  Term-centric:
  [
    {
      "term": "api",
      "templates": [
        { "template": "api-designer", "relevance": 4 },
        { "template": "api-documenter", "relevance": 3 }
      ]
    }
  ]

Options:
  --top-terms=N       Include the N highest-contributing terms per agent (default: ${DEFAULT_TOP_TERMS})
  --format=json       Print JSON (default)
  --format=table      Print a compact table
  --help, -h          Show this help

Example:
  node src/rankAgentRelevance.js src/exampleAgentTermsByAgent.json . --format=table
  node src/rankAgentRelevance.js src/exampleAgentTerms.json . --format=table
`);
}

function parseArgs(argv) {
  const opts = { termsPath: null, root: null, topTerms: DEFAULT_TOP_TERMS, format: "json", help: false };
  const positional = [];

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg.startsWith("--top-terms=")) opts.topTerms = Number(arg.slice("--top-terms=".length));
    else if (arg.startsWith("--format=")) opts.format = arg.slice("--format=".length);
    else positional.push(arg);
  }

  opts.termsPath = positional[0] || null;
  opts.root = positional[1] || null;
  return opts;
}

function escapeRegex(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function normalizeTerm(value) {
  return String(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function loadAgentTerms(termsPath) {
  const fullPath = path.resolve(termsPath);
  const raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  // This is the in-memory index used by the scorer. The project is scanned once,
  // then each matched term is looked up here to update every related agent.
  const termToAgents = new Map();
  const agentNames = new Set();

  function addTermRef(term, ref, sourceLabel) {
    const normalized = normalizeTerm(term);
    if (!normalized) return;

    const agent = ref.template || ref.agent;
    const weight = Number(ref.relevance ?? ref.weight);
    if (!agent || typeof agent !== "string") {
      throw new Error(`Invalid template reference for "${sourceLabel}": expected "template" string.`);
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error(`Invalid relevance for "${sourceLabel}" -> "${agent}": expected a positive number.`);
    }

    agentNames.add(agent);
    if (!termToAgents.has(normalized)) termToAgents.set(normalized, []);
    termToAgents.get(normalized).push({ agent, weight });
  }

  if (Array.isArray(raw)) {
    // Term-centric shape:
    // [{ term: "api", templates: [{ template: "api-designer", relevance: 4 }] }]
    for (const entry of raw) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error("Each term entry must be an object.");
      }
      const refs = entry.templates || entry.agents || (entry.template ? [entry] : null);
      if (!entry.term || !Array.isArray(refs)) {
        throw new Error('Each term entry must have "term" and "templates" fields.');
      }
      for (const ref of refs) addTermRef(entry.term, ref, entry.term);
    }
  } else if (Object.values(raw).every((value) => Array.isArray(value))) {
    // Compact term map:
    // { "api": [{ template: "api-designer", relevance: 4 }] }
    for (const [term, refs] of Object.entries(raw)) {
      for (const ref of refs) addTermRef(term, ref, term);
    }
  } else {
    // Agent-centric shape:
    // { "agent-name": { "term": weight } }
    for (const [agent, terms] of Object.entries(raw)) {
      if (!terms || typeof terms !== "object" || Array.isArray(terms)) {
        throw new Error(`Agent "${agent}" must map to an object of { term: weight }.`);
      }
      for (const [term, weight] of Object.entries(terms)) {
        addTermRef(term, { template: agent, relevance: weight }, term);
      }
    }
  }

  return { agentNames: [...agentNames].sort(), termToAgents };
}

function buildRipgrepPattern(terms) {
  // Longest alternatives first makes phrases like "type safety" win before "type".
  const alternatives = [...terms].sort((a, b) => b.length - a.length).map(escapeRegex);
  return `\\b(${alternatives.join("|")})\\b`;
}

function runRipgrep(root, pattern) {
  // One rg process, one project scan. rg already skips binary files and honors .gitignore.
  const args = [
    "--json",
    "--only-matching",
    "--ignore-case",
    "--line-number",
    "--column",
    "--regexp",
    pattern,
    "--glob",
    "!node_modules/**",
    "--glob",
    "!.git/**",
    "--glob",
    "!dist/**",
    "--glob",
    "!build/**",
    root,
  ];
  const result = spawnSync("rg", args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 200 });

  if (result.error && result.error.code === "ENOENT") {
    throw new Error("ripgrep (rg) was not found in PATH.");
  }
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`rg failed with exit code ${result.status}:\n${result.stderr}`);
  }

  return result.stdout;
}

/**
 * Fallback used when ripgrep isn't installed: same combined-pattern, single-pass
 * idea, just walking the tree and matching in pure Node instead of shelling out.
 * Slower than rg on large trees (no parallelism, no binary-file fast-skip), but
 * keeps --generate-all-agents working everywhere.
 */
function runPureNodeScan(root, pattern) {
  const regex = new RegExp(pattern, "gi");
  const termCounts = new Map();
  const termFiles = new Map();

  for (const file of walkFiles(root, () => true)) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue; // unreadable file (permissions, broken symlink, etc.)
    }
    if (content.indexOf("\u0000") !== -1) continue; // looks binary, skip like rg would

    for (const match of content.matchAll(regex)) {
      const term = normalizeTerm(match[0]);
      termCounts.set(term, (termCounts.get(term) || 0) + 1);

      if (!termFiles.has(term)) termFiles.set(term, new Map());
      const files = termFiles.get(term);
      files.set(file, (files.get(file) || 0) + 1);
    }
  }

  return { termCounts, termFiles };
}

/** Tries ripgrep first; transparently falls back to the pure-Node scan if `rg` isn't installed. */
function scanProject(root, pattern) {
  try {
    const rgOutput = runRipgrep(root, pattern);
    return { ...countMatches(rgOutput), scanMethod: "ripgrep" };
  } catch (err) {
    if (!err.message.includes("ripgrep (rg) was not found in PATH")) throw err;
    return { ...runPureNodeScan(root, pattern), scanMethod: "node-fallback" };
  }
}

function countMatches(rgJsonOutput) {
  const termCounts = new Map();
  const termFiles = new Map();

  // rg emits one JSON event per matching line. With --only-matching, each
  // submatch is a literal term occurrence captured by the single combined regex.
  for (const line of rgJsonOutput.split("\n")) {
    if (!line) continue;

    const event = JSON.parse(line);
    if (event.type !== "match") continue;

    const file = event.data.path.text;
    for (const submatch of event.data.submatches || []) {
      const term = normalizeTerm(submatch.match.text);
      termCounts.set(term, (termCounts.get(term) || 0) + 1);

      if (!termFiles.has(term)) termFiles.set(term, new Map());
      const files = termFiles.get(term);
      files.set(file, (files.get(file) || 0) + 1);
    }
  }

  return { termCounts, termFiles };
}

function scoreAgents(agentNames, termToAgents, termCounts, termFiles, topTerms) {
  const agents = new Map();
  for (const agent of agentNames) agents.set(agent, { agent, score: 0, terms: new Map() });

  // All scoring happens in memory after rg finishes. No extra filesystem scan
  // happens here: matched term counts are multiplied by per-agent weights.
  for (const [term, occurrences] of termCounts.entries()) {
    const refs = termToAgents.get(term);
    if (!refs) continue;

    for (const { agent, weight } of refs) {
      const contribution = occurrences * weight;
      const row = agents.get(agent);
      row.score += contribution;
      row.terms.set(term, {
        term,
        weight,
        occurrences,
        contribution,
        files: [...(termFiles.get(term) || new Map()).entries()]
          .map(([file, count]) => ({ file, count }))
          .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file))
          .slice(0, 10),
      });
    }
  }

  return [...agents.values()]
    .filter((agent) => agent.score > 0)
    .map((agent) => ({
      agent: agent.agent,
      score: agent.score,
      topTerms: [...agent.terms.values()]
        .sort((a, b) => b.contribution - a.contribution || a.term.localeCompare(b.term))
        .slice(0, topTerms),
    }))
    .sort((a, b) => b.score - a.score || a.agent.localeCompare(b.agent));
}

function rankAgentRelevance({ termsPath, root, topTerms = DEFAULT_TOP_TERMS }) {
  const projectRoot = path.resolve(root);
  const { agentNames, termToAgents } = loadAgentTerms(termsPath);
  const uniqueTerms = [...termToAgents.keys()];
  if (uniqueTerms.length === 0) {
    return { root: projectRoot, uniqueTerms: 0, agents: [] };
  }

  const pattern = buildRipgrepPattern(uniqueTerms);
  const { termCounts, termFiles, scanMethod } = scanProject(projectRoot, pattern);
  const agents = scoreAgents(agentNames, termToAgents, termCounts, termFiles, topTerms);

  return {
    root: projectRoot,
    uniqueTerms: uniqueTerms.length,
    matchedTerms: termCounts.size,
    scanMethod,
    agents,
  };
}

function printTable(result) {
  console.log("Agent relevance ranking");
  console.log(`Root: ${result.root}`);
  console.log(`Terms: ${result.uniqueTerms} unique, ${result.matchedTerms || 0} matched`);
  if (result.scanMethod === "node-fallback") {
    console.log("Note: ripgrep (rg) was not found — used the slower built-in Node scanner instead.");
  }
  console.log("");
  console.log("score  agent                 top terms");
  console.log("-----  --------------------  ------------------------------");

  for (const row of result.agents) {
    const terms = row.topTerms.map((t) => `${t.term}=${t.contribution}`).join(", ");
    console.log(`${String(row.score).padEnd(5)}  ${row.agent.padEnd(20)}  ${terms}`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }
  if (!opts.termsPath || !opts.root) {
    printHelp();
    process.exitCode = 1;
    return;
  }
  if (!Number.isInteger(opts.topTerms) || opts.topTerms < 0) {
    throw new Error("--top-terms must be a non-negative integer.");
  }
  if (!["json", "table"].includes(opts.format)) {
    throw new Error("--format must be json or table.");
  }

  const result = rankAgentRelevance(opts);
  if (opts.format === "table") printTable(result);
  else console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) main();

module.exports = {
  rankAgentRelevance,
  buildRipgrepPattern,
  countMatches,
  scoreAgents,
  runPureNodeScan,
  scanProject,
};
