#!/usr/bin/env node
const { inspect } = require("../src/index");
const { renderTerminal, renderJson } = require("../src/report");
const { generateEssentialAgents } = require("../src/agentTemplates");

const STATUS_ICON = { created: "✔", "skipped-exists": "→", "template-missing": "✘" };
const STATUS_LABEL = {
  created: "created .claude/agents/",
  "skipped-exists": "skipped (already exists): .claude/agents/",
  "template-missing": "template not found for: .claude/agents/",
};

function printGenerationSummary(results, languages) {
  const languageNote = languages && languages.primary ? languages.primary.label : "no specific language";
  console.log(`Generating essential agents for ${languageNote}...`);
  for (const r of results) {
    console.log(`  ${STATUS_ICON[r.status]} ${STATUS_LABEL[r.status]}${r.filename}`);
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
  };
  const positional = [];

  for (const arg of argv) {
    if (arg === "--json") opts.json = true;
    else if (arg === "--verbose" || arg === "-v") opts.verbose = true;
    else if (arg === "--no-color") opts.color = false;
    else if (arg === "--explain") opts.explain = true;
    else if (arg === "--generate-essential-agents") opts.generateEssentialAgents = true;
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
