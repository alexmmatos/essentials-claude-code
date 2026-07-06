#!/usr/bin/env node
const readline = require("node:readline");
const { inspect } = require("../src/index");
const { renderTerminal, renderJson, renderFixPrompt } = require("../src/report");
const { generateEssentialAgents } = require("../src/agentTemplates");
const { generateAllAgents } = require("../src/generateAllAgents");
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

function printAllAgentsSummary(gen) {
  if (gen.scanMethod === "node-fallback") {
    console.log(
      "Note: ripgrep (rg) was not found in PATH — falling back to a slower, built-in Node scanner."
    );
    console.log(
      "      Install ripgrep for faster scans: https://github.com/BurntSushi/ripgrep#installation"
    );
    console.log("");
  }
  console.log(`Scanning project terms (${gen.uniqueTerms} unique, ${gen.matchedTerms} matched)...`);
  if (gen.results.length === 0) {
    console.log("  No agent template matched a term from the dictionary in this project.");
  }
  for (const r of gen.results) {
    const label = `${AGENT_STATUS_LABEL[r.status]}${r.filename} (relevance score: ${r.score})`;
    console.log(`  ${AGENT_STATUS_ICON[r.status]} ${label}`);
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

function parseFixChoice(answer) {
  const normalized = String(answer).trim().toLowerCase();
  if (["1", "basic", "fix-basic", "--fix-basic"].includes(normalized)) return "basic";
  if (["2", "prompt", "fix-prompt", "--fix-prompt"].includes(normalized)) return "prompt";
  return null;
}

/**
 * Explains both fix modes and asks which one to run. Resolves to "basic", "prompt",
 * or null (unrecognized answer, or stdin closed without one — e.g. non-interactive
 * use with nothing piped in). Never hangs: `close` resolves null if no answer came.
 */
function promptFixChoice() {
  console.log("Two ways to act on the recommendations:");
  console.log("");
  console.log("  1) --fix-basic   Mechanically creates the missing scaffolding (CLAUDE.md,");
  console.log("                   .claude/settings.json, .claude/{rules,skills,agents}/).");
  console.log("                   No content generation, and it never overwrites anything.");
  console.log("  2) --fix-prompt  Prints a ready-to-paste prompt for Claude Code, ordered by");
  console.log("                   score gap, so Claude writes the real content instead —");
  console.log("                   an actual CLAUDE.md, real skills, real subagents.");
  console.log("");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    let answered = false;
    rl.question("Choose 1 (basic) or 2 (prompt): ", (answer) => {
      answered = true;
      rl.close();
      resolve(parseFixChoice(answer));
    });
    rl.on("close", () => {
      if (!answered) resolve(null);
    });
  });
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
    generateAllAgents: false,
    fix: false,
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
    else if (arg === "--generate-all-agents") opts.generateAllAgents = true;
    else if (arg === "--fix") opts.fix = true;
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
  console.log(`essentials-claude-code [path] [options]

Evaluates how well a project takes advantage of Claude Code's extensions
(CLAUDE.md, settings.json, skills, subagents, rules, MCP) and produces
a score from 0 to 100 with recommendations.

Arguments:
  path                           Directory to analyze (default: current directory)

Options:
  --json                        Print the result as JSON (for CI/scripts)
  --verbose, -v                 Show the details of each category
  --explain                     Show why each missing recommendation matters
  --generate-essential-agents   Generate a few subagents in .claude/agents/ matched
                                 to the project's detected language, from
                                 github.com/VoltAgent/awesome-claude-code-subagents (MIT)
  --generate-all-agents         Scan the project once against the full term dictionary
                                 and generate every subagent with a positive relevance
                                 score (uses ripgrep if installed; falls back to a
                                 slower built-in scanner otherwise)
  --fix                         Ask interactively whether to run --fix-basic or
                                 --fix-prompt, explaining what each one does
  --fix-prompt                  Print a ready-to-paste prompt for Claude Code listing
                                 what's missing, ordered by score gap
  --fix-basic                   Create the missing basic scaffolding (CLAUDE.md,
                                 .claude/settings.json, .claude/{rules,skills,agents}/)
  --min-score=N                 Exit with code 1 if the total score is lower than N
  --no-color                    Disable terminal colors
  --help, -h                    Show this help

Examples:
  essentials-claude-code                        Analyze the current directory
  essentials-claude-code ../other-project       Analyze a different directory
  essentials-claude-code --verbose --explain    Show details and the reasoning behind them
  essentials-claude-code --json > report.json   Save the result as JSON
  essentials-claude-code --min-score=70         Exit with code 1 in CI if the score is below 70
`);
}

async function main() {
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

  if (opts.generateAllAgents) {
    const gen = generateAllAgents(result.root);
    printAllAgentsSummary(gen);
    result = inspect(opts.path);
  }

  if (opts.fix) {
    const choice = await promptFixChoice();
    console.log("");
    if (choice === "basic") opts.fixBasic = true;
    else if (choice === "prompt") opts.fixPrompt = true;
    else {
      console.log("No valid choice made — run again with --fix-basic or --fix-prompt directly.");
      return;
    }
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

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
