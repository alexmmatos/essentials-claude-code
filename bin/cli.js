#!/usr/bin/env node
const { inspect } = require("../src/index");
const { renderTerminal, renderJson, renderFixPrompt } = require("../src/report");
const { generateEssentialAgents } = require("../src/agentTemplates");
const { buildFixPrompt } = require("../src/fixPrompt");
const { fixBasic } = require("../src/fixBasic");

const AGENT_STATUS_ICON = { created: "✔", "skipped-exists": "→", "template-missing": "✘" };
const AGENT_STATUS_LABEL = {
  created: "created .claude/agents/",
  "skipped-exists": "skipped (already exists): .claude/agents/",
  "template-missing": "template not found for: .claude/agents/",
};

function printGenerationSummary(results, languages) {
  const languageNote = languages && languages.primary ? languages.primary.label : "no specific language";
  console.log(`Generating essential agents for ${languageNote}...`);
  for (const r of results) {
    console.log(`  ${AGENT_STATUS_ICON[r.status]} ${AGENT_STATUS_LABEL[r.status]}${r.filename}`);
  }
  console.log("");
}

const FIX_STATUS_ICON = { created: "✔", "skipped-exists": "→" };

function printFixBasicSummary(actions) {
  console.log("Creating missing scaffolding...");
  for (const a of actions) {
    const label = a.status === "created" ? `created ${a.target}` : `skipped (already exists): ${a.target}`;
    console.log(`  ${FIX_STATUS_ICON[a.status]} ${label}`);
  }
  console.log("");
}

function parseArgs(argv) {
  const opts = {
    path: ".",
    json: false,
    verbose: false,
    color: true,
    minScore: null,
    help: false,
    explain: false,
    generateEssentialAgents: false,
    fixPrompt: false,
    fixBasic: false,
  };
  const positional = [];

  for (const arg of argv) {
    if (arg === "--json") opts.json = true;
    else if (arg === "--verbose" || arg === "-v") opts.verbose = true;
    else if (arg === "--no-color") opts.color = false;
    else if (arg === "--explain") opts.explain = true;
    else if (arg === "--generate-essential-agents") opts.generateEssentialAgents = true;
    else if (arg === "--fix-prompt") opts.fixPrompt = true;
    else if (arg === "--fix-basic") opts.fixBasic = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg.startsWith("--min-score=")) opts.minScore = Number(arg.split("=")[1]);
    else positional.push(arg);
  }

  if (positional.length > 0) opts.path = positional[0];
  return opts;
}

function printHelp() {
  console.log(`arthur-inspector [path] [options]

Evaluates how well a project takes advantage of Claude Code's extensions
(CLAUDE.md, settings.json, skills, subagents, rules, MCP) and produces
a score from 0 to 100 with recommendations.

Options:
  --json                        Print the result as JSON (for CI/scripts)
  --verbose, -v                 Show the details of each category
  --explain                     Show why each missing recommendation matters
  --generate-essential-agents   Generate a few subagents in .claude/agents/ matched
                                 to the project's detected language, from
                                 github.com/VoltAgent/awesome-claude-code-subagents (MIT)
  --fix-prompt                  Print a ready-to-paste prompt for Claude Code listing
                                 what's missing, ordered by score gap
  --fix-basic                   Create the missing basic scaffolding (CLAUDE.md,
                                 .claude/settings.json, .claude/{rules,skills,agents}/)
  --min-score=N                 Exit with code 1 if the total score is lower than N
  --no-color                    Disable terminal colors
  --help, -h                    Show this help
`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  let result = inspect(opts.path);

  if (opts.generateEssentialAgents) {
    const genResults = generateEssentialAgents(result.root, result.languages);
    printGenerationSummary(genResults, result.languages);
    result = inspect(opts.path);
  }

  if (opts.fixBasic) {
    const actions = fixBasic(result.root);
    printFixBasicSummary(actions);
    result = inspect(opts.path);
  }

  if (opts.fixPrompt) {
    console.log(renderFixPrompt(buildFixPrompt(result), { color: opts.color }));
    return;
  }

  if (opts.json) {
    console.log(renderJson(result));
  } else {
    console.log(renderTerminal(result, { verbose: opts.verbose, color: opts.color, explain: opts.explain }));
  }

  if (opts.minScore !== null && result.total < opts.minScore) {
    process.exitCode = 1;
  }
}

main();
