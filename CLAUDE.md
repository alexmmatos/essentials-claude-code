# arthur-inspector

CLI that evaluates how well a project takes advantage of Claude Code's
extensions (CLAUDE.md, settings.json, skills, subagents, rules, MCP) and
produces a 0-100 score with recommendations.

## Commands
- Tests: `npm test` (runs `node --test`, auto-discovers `test/*.test.js`)
- Run the CLI locally: `node bin/cli.js [path] [--json|--verbose|--min-score=N]`

## Stack
- Plain Node.js (CommonJS, `require`), **no runtime dependencies**
- Tests with `node:test` + `node:assert/strict`; fixtures in `test/fixtures/`

## Architecture
- `bin/cli.js`: argument parsing and CLI entrypoint
- `src/index.js`: orchestrates the checks (`CHECKS`) and aggregates the result
- `src/checks/*.js`: one module per scoring category (`claudeMd`, `settings`,
  `skills`, `agents`, `rules`, `mcp`, `hygiene`, `extras`, `principles`); each
  exports `check(root, context)` and returns its result via `buildResult()`
- `src/score.js`: weights (`WEIGHTS`, always summing to 100) and aggregation (`aggregate`)
- `src/report.js`: terminal (colored) and JSON rendering
- `src/languages.js`: detects the project's language(s) via manifest files and
  file-extension counts; consumed by `claudeMd.js` to require language-specific commands

## Rules
- Every check in `src/checks/` must return via `buildResult` from `src/score.js`,
  never hand-build the result object
- New category = new `id` in `WEIGHTS` (redistribute weights so the sum stays 100),
  registered in `CHECKS` (`src/index.js`), with at least one test covering it
- Don't add runtime dependencies — the package must run on plain Node only
- Test fixtures (`test/fixtures/`) use original content, never copied
  verbatim from Claude Code's official documentation
