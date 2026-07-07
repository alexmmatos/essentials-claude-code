# Essentials Claude Code

> **Disclaimer:** This is an independent, unofficial project. It is not
> affiliated with, endorsed by, or otherwise officially associated with
> Anthropic or the official Claude Code product.

Evaluates how well a project takes advantage of
[Claude Code](https://code.claude.com/docs/en/features-overview) extensions —
`CLAUDE.md`, `.claude/settings.json`, skills, subagents, rules, and MCP —
plus whether the project documents SOLID principles and GoF design patterns —
and produces a 0-to-100 score with concrete recommendations on what to add or
improve.

## Claude Code documentation

The `docs/claude-code-docs/` folder contains the Claude Code documentation
used as a local reference for this project.

## Install as a Claude Code plugin

This project is also a Claude Code plugin (see `.claude-plugin/plugin.json`
and `.claude-plugin/marketplace.json`) — no `npx` or Node install required
on your side, just add the marketplace and install it from inside Claude
Code:

```
/plugin marketplace add https://github.com/alexmmatos/essentials-claude-code
/plugin install essentials-claude-code@essentials-claude-code-marketplace
```

Once installed, it exposes these slash commands, each a thin wrapper around
the CLI flags described below:

| Command | Equivalent to |
|---|---|
| `/essentials-claude-code:audit [path] [--min-score=N]` | `npx essentials-claude-code --verbose --explain` |
| `/essentials-claude-code:fix [path]` | `npx essentials-claude-code --fix`, with Claude executing the generated prompt directly instead of you pasting it back in |
| `/essentials-claude-code:generate-agents [path]` | `npx essentials-claude-code --generate-essential-agents` |

## Usage

```bash
npx essentials-claude-code [path]
```

With no argument, it analyzes the current directory.

```bash
$ npx essentials-claude-code

Essentials Claude Code — Adoption Score

Overall score: 91/100 (91%)

Detected languages: JavaScript/TypeScript (100%)

████████████████████ CLAUDE.md                   20/20
████████████████████ settings.json               15/15
█████████████████░░░ Skills                      13/15
█████████████████░░░ Subagents                   13/15
████████████████████ Rules                       10/10
████████████████████ MCP                         5/5
████████████████████ Git hygiene                 5/5
░░░░░░░░░░░░░░░░░░░░ Output Styles (Optional)    0/1
░░░░░░░░░░░░░░░░░░░░ Workflows (Optional)        0/1
░░░░░░░░░░░░░░░░░░░░ Agent Memory (Optional)     0/2
░░░░░░░░░░░░░░░░░░░░ Worktree Include (Optional) 0/1
████████████████████ SOLID & GoF                 10/10

Top recommendations
  → [MCP] If the team depends on external data (database, Slack, APIs), configure MCP servers in .mcp.json.
    Why it matters: MCP is what connects Claude to systems it can't otherwise reach — a database, an internal API, Slack. Without it, Claude either can't act on that data at all or falls back on ad hoc shell commands, which is slower and less reliable. Hardcoding secrets in .mcp.json instead of referencing environment variables also risks leaking them into a file people commit.
  → [settings.json] Configure permissions.allow/deny to make the commands Claude runs predictable.
  → [settings.json] Consider configuring statusLine in settings.json to continuously track context usage.
    Why it matters: Unlike CLAUDE.md, which Claude reads as guidance, settings.json's permissions and hooks are enforced by Claude Code itself. A hook always fires on its event and a permission rule always blocks or allows a command — it's the only way to guarantee behavior (lint after every edit, never run rm -rf) instead of hoping Claude follows an instruction. statusLine also helps you notice a filling context window before it degrades output quality.
  → [Agent Memory (Optional)] Enable memory: project on subagents that benefit from memory across runs.
    Why it matters: Subagent memory lets a subagent build up institutional knowledge (patterns, past mistakes, architectural decisions) across sessions instead of rediscovering it every run. It compounds in value the more a subagent is reused, so it's worth more than the other Extras here.
  → [Output Styles (Optional)] Create .claude/output-styles/ if the team shares a specific response mode.
    Why it matters: A custom output style changes Claude's default tone and response shape for everyone on the team, instead of each person repeating the same preferences in every prompt. It's a nice-to-have — skip it until the team actually agrees on a shared response mode.
  → [Workflows (Optional)] Use /workflows to save multi-subagent orchestrations in .claude/workflows/.
    Why it matters: Saved workflows turn a multi-subagent orchestration you'd otherwise re-assemble by hand into a single reusable command. Worth adding once you have an orchestration you actually repeat, not before.
  → [Worktree Include (Optional)] If you use git worktrees, create .worktreeinclude to copy .env and similar files.
    Why it matters: .worktreeinclude copies files like .env into new git worktrees automatically. It only matters if the team actually uses worktrees — otherwise there's nothing for it to do.
  → [Subagents] Define description (so Claude knows when to delegate) and tools (to restrict access) on every subagent.
    Why it matters: Subagents isolate work in their own context window and return only a summary, so tasks that read many files or explore broadly don't fill up your main conversation. Without them, large exploratory or parallel tasks compete with your actual work for the same limited context.

Useful next steps
  → --json — machine-readable output, for CI or scripts
  → --fix-basic — create the missing scaffolding automatically (CLAUDE.md, settings.json, folders) — never overwrites anything
  → --fix — get a ready-to-paste prompt for Claude Code to write the real content instead
```

### Options

| Flag | Effect |
|---|---|
| `--json` | Prints the result as JSON (for CI or scripts) |
| `--verbose`, `-v` | Shows the details of each check per category |
| `--explain` | Shows why each remaining recommendation matters, category by category (on by default) |
| `--no-explain` | Hides the "why this matters" reasoning |
| `--generate-essential-agents` | Generates a few subagents in `.claude/agents/` matched to the project's detected language (see [Generating essential agents](#generating-essential-agents) below) |
| `--fix` | Prints a ready-to-paste prompt for Claude Code listing what's missing, ordered by score gap (see [Fixing the gaps](#fixing-the-gaps) below) |
| `--fix-basic` | Creates the missing basic scaffolding directly: `CLAUDE.md`, `.claude/settings.json`, `.claude/{rules,skills,agents}/` (see [Fixing the gaps](#fixing-the-gaps) below) |
| `--min-score=N` | Exits with code 1 if the total score is lower than `N` (useful in CI) |
| `--no-color` | Disables terminal colors |
| `--help`, `-h` | Shows help |

## What is evaluated

The score (0–100) is split across weighted categories:

| Category | Weight | What it checks |
|---|---|---|
| `CLAUDE.md` | 20 | Exists (root or `.claude/`), has substantial content, stays within the recommended ~200 lines, and cites the project's real build/test/lint commands — specific to the detected language (`pytest` for Python, `go test` for Go, etc.) when one can be detected; generic otherwise |
| `settings.json` | 15 | `.claude/settings.json` exists, is valid JSON, and has `permissions`, `hooks`, and `statusLine` configured |
| `Skills` | 15 | `.claude/skills/<name>/SKILL.md` exists, each skill has a `description`, there is more than one skill, and skills with side effects (deploy/commit/publish/...) use `disable-model-invocation: true`. If only `.claude/commands/` (legacy mechanism) exists, gives partial credit and recommends migrating |
| `Subagents` | 15 | `.claude/agents/*.md` exists, each one defines `description` and `tools`, and there is more than one subagent |
| `Rules` | 10 | `.claude/rules/*.md` exists and uses `paths:` to scope by file/directory |
| `SOLID & GoF` | 10 | Some `.md` file in the project (outside `node_modules`/`.git`) mentions SOLID principles, and some mentions GoF design patterns |
| `MCP` | 5 | `.mcp.json` exists, is valid JSON, has at least one server in `mcpServers`, and no `env` value that looks like a hardcoded secret (uses `${VAR}` instead of a literal value) |
| `Git hygiene` | 5 | Personal files (`.claude/settings.local.json`, `CLAUDE.local.md`), when present, are in `.gitignore` |
| `Output Styles (Optional)` | 1 | `.claude/output-styles/` has at least one `.md` file |
| `Workflows (Optional)` | 1 | `.claude/workflows/` has at least one `.js` file |
| `Agent Memory (Optional)` | 2 | `.claude/agent-memory/` has at least one file |
| `Worktree Include (Optional)` | 1 | `.worktreeinclude` exists |

## Language detection

The CLI identifies the language(s) of the analyzed project — via manifest
file (`package.json`, `requirements.txt`/`pyproject.toml`, `go.mod`,
`Cargo.toml`, `Gemfile`, `pom.xml`/`build.gradle`, `composer.json`, `*.csproj`/
`*.sln`, `mix.exs`), with file-extension counts used as a tiebreaker (when
more than one manifest is present) or as a fallback (when there is no
manifest at all). This is purely informational in the report (`languages` in
the JSON output), except for the `CLAUDE.md` category, which requires the
detected language's real commands instead of accepting any generic text with
"test" or "build".

This rubric reflects Claude Code's own official documentation on
[the `.claude` directory](https://code.claude.com/docs/en/claude-directory)
and ["extend Claude Code"](https://code.claude.com/docs/en/features-overview):
the recommendation to keep `CLAUDE.md` under 200 lines, move reference
content into skills/rules, and add each extension only when its trigger
actually comes up.

## Generating essential agents

```bash
npx essentials-claude-code --generate-essential-agents
```

This copies a small, curated set of subagent templates into `.claude/agents/`:
one language-specialist agent matched to the project's detected language
(e.g., `python-pro.md` for Python, `golang-pro.md` for Go, `typescript-pro.md`
instead of `javascript-pro.md` when a `tsconfig.json` is present), plus
`code-reviewer.md`, which is generated regardless of language. It never
overwrites a file that already exists in `.claude/agents/`, and always writes
a `THIRD_PARTY_NOTICES.md` alongside the generated files crediting the
source. The score re-runs automatically afterward so you see the updated
`Subagents` category right away.

The templates themselves are bundled from
[VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
(MIT License) — see [Credits](#credits).

## Generating all relevant agents

```bash
npx essentials-claude-code --generate-all-agents
```

While `--generate-essential-agents` only picks one flagship agent per detected
language, this scans the whole project **once** against
`src/agentTermTemplateRelevance.json` — a dictionary mapping literal terms
(dependency names, filenames, phrases) to the agent templates they're
relevant to, with a weight per term. Every template whose matched terms add
up to a positive relevance score gets generated into `.claude/agents/`, not
just one per language — so a project touching Docker, Kubernetes, and
GraphQL can end up with all three matching specialists, on top of whatever
the detected language contributes.

The single-pass scan uses [ripgrep](https://github.com/BurntSushi/ripgrep)
(`rg`) when it's installed, for speed. If `rg` isn't found in `PATH`, it
transparently falls back to a slower, built-in pure-Node scanner — the
command prints a one-line note about which one ran, but it always works
either way; `rg` is optional, not a hard dependency (see
[ripgrep's installation instructions](https://github.com/BurntSushi/ripgrep#installation)
if you want the faster path on large projects). Same never-overwrite
behavior and `THIRD_PARTY_NOTICES.md` as `--generate-essential-agents`.

## Fixing the gaps

Two ways to act on the recommendations, from most to least automated:

```bash
npx essentials-claude-code --fix-basic
```

Creates only the missing basic scaffolding, mechanically, with no content
generation: `CLAUDE.md` (a minimal template, with build/test command hints
from the detected language), `.claude/settings.json` (empty `permissions`/
`hooks` skeleton), and the `.claude/rules/`, `.claude/skills/`, and
`.claude/agents/` folders. It also adds `.claude/settings.local.json`/
`CLAUDE.local.md` to `.gitignore` if either exists and isn't already ignored.
Nothing that already exists is ever overwritten, and the score re-runs
afterward.

```bash
npx essentials-claude-code --fix
```

Prints a single, ready-to-paste prompt — ordered by score gap, each item
paired with the same "why it matters" reasoning from `--explain` — for cases
where scaffolding alone isn't enough and you want Claude Code to actually
write the content (a real `CLAUDE.md`, real skills, real subagents). The
output ends with a highlighted reminder to paste it into a Claude Code
session. (Running this through the Claude Code plugin's `/fix` command
instead of `npx` skips the copy-paste step — Claude executes the generated
prompt directly.)

## Running locally (without publishing)

```bash
node bin/cli.js [path] [options]
```

## Scripts

| Command | What it does |
|---|---|
| `npm test` | Runs `node --test`, which auto-discovers every `test/*.test.js` file (`node:test` + `node:assert/strict`, no external test framework) and reports pass/fail per test |

## Credits

Agent (subagent) templates used as a reference for this project are sourced
from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents),
licensed under the MIT License.

## License

MIT
