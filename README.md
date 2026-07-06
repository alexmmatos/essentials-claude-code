# arthur-inspector

> **Disclaimer:** This is an independent, unofficial project. It is not
> affiliated with, endorsed by, or otherwise officially associated with
> Anthropic or the official Claude Code product.

Evaluates how well a project takes advantage of
[Claude Code](https://code.claude.com/docs/en/features-overview) extensions —
`CLAUDE.md`, `.claude/settings.json`, skills, subagents, rules, and MCP —
plus whether the project documents SOLID principles and GoF design patterns —
and produces a 0-to-100 score with concrete recommendations on what to add or
improve.

## Usage

```bash
npx arthur-inspector [path]
```

With no argument, it analyzes the current directory.

```bash
$ npx arthur-inspector

Arthur Inspector — Claude Code Adoption Score

Overall score: 91/100 (91%)

Detected languages: JavaScript/TypeScript (100%)

████████████████████ CLAUDE.md        20/20
████████████████████ settings.json    15/15
█████████████████░░░ Skills           13/15
█████████████████░░░ Subagents        13/15
████████████████████ Rules            10/10
████████████████████ MCP              5/5
████████████████████ Git hygiene      5/5
░░░░░░░░░░░░░░░░░░░░ Extras           0/5
████████████████████ SOLID & GoF      10/10

Top recommendations
  → [Extras] Optional: create .claude/output-styles/ if the team shares a specific response mode.
  → [Skills] Consider capturing more repeated workflows as skills (target: 3+).
```

### Options

| Flag | Effect |
|---|---|
| `--json` | Prints the result as JSON (for CI or scripts) |
| `--verbose`, `-v` | Shows the details of each check per category |
| `--explain` | Shows why each remaining recommendation matters, category by category |
| `--generate-essential-agents` | Generates a few subagents in `.claude/agents/` matched to the project's detected language (see [Generating essential agents](#generating-essential-agents) below) |
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
| `Extras` | 5 | `output-styles/`, `workflows/`, `agent-memory/`, `.worktreeinclude` |

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
npx arthur-inspector --generate-essential-agents
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

## Running locally (without publishing)

```bash
node bin/cli.js [path] [options]
```

## Tests

```bash
npm test
```

## Credits

Agent (subagent) templates used as a reference for this project are sourced
from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents),
licensed under the MIT License.

## License

MIT
