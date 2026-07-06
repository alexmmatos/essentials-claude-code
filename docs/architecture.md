# arthur-inspector architecture

This project is a small CLI in plain Node.js (no classes, no framework). The
SOLID principles and GoF design patterns below show up in their idiomatic
function-and-module form for JavaScript — not as class hierarchies — but the
roles are the same.

## SOLID principles applied

### Single responsibility
Every module has exactly one reason to change:
- `src/fsutil.js` only handles file access (exists, is a directory, reads JSON, walks the tree).
- `src/frontmatter.js` only parses the `---` block at the top of a `.md` file.
- `src/score.js` only knows about weights and score aggregation.
- `src/report.js` only knows how to render a result (terminal or JSON).
- Each `src/checks/*.js` only knows how to evaluate **one** category (`CLAUDE.md`, `skills`, etc.).

### Open/closed
`src/index.js` iterates over the `CHECKS` array without knowing anything
about what each check does internally. That's exactly how the `SOLID & GoF`
category (`src/checks/principles.js`) entered the project: a new file, a new
`id` in `WEIGHTS`, a new line in `CHECKS` — no existing code had to change
for the system to "make room" for it.

### Liskov substitution
Every module in `src/checks/` exposes the same contract: `check(root) ->
result of buildResult()`. Any check can be swapped, removed, or reordered in
the `CHECKS` array without `src/index.js`, `src/score.js`, or `src/report.js`
needing to know which specific check is running.

### Interface segregation
Each check imports only what it uses: `mcp.js` only needs `readJsonSafe`;
`skills.js` and `agents.js` need `walkFiles` + `parseFrontmatter`;
`hygiene.js` is the only one that needs `execFileSync` from
`node:child_process`. There's no single do-everything interface that every
check is forced to implement.

### Dependency inversion
`inspect()` (`src/index.js`) depends on the abstraction "a list of modules
with `check(root)`," not on concrete checks. `buildResult()` depends on the
abstraction "an `id` that exists in `WEIGHTS`," not on which category is
calling it. This is what lets each check be tested in isolation (see
`test/principles.test.js`, which tests `mentionsSolid`/`mentionsGof` without
running the whole CLI).

## GoF design patterns applied

- **Strategy**: every file in `src/checks/` is an interchangeable scoring
  strategy. `CHECKS` (`src/index.js`) is the list of active strategies;
  reordering it or adding/removing an entry changes behavior without
  touching the aggregation algorithm.
- **Facade**: `inspect()` in `src/index.js` is a simple facade over a
  subsystem with several parts (eight check modules, score aggregation,
  rendering) — the caller only sees `inspect(path) -> result`.
- **Factory (function)**: `buildResult()` in `src/score.js` centralizes the
  construction of the category result object (`id`, `label`, `weight`,
  `raw`, `points`, `findings`, `recommendations`), guaranteeing every check
  produces exactly the same shape, even without a base class.
- **Template (by convention)**: every check module follows the same steps —
  compute `raw`, accumulate `findings`/`recommendations`, call `buildResult`
  at the end — with no abstract class enforcing it, but consistently enough
  to serve as a template when adding a new check (see the
  [`add-check`](../.claude/skills/add-check/SKILL.md) skill).

## Why this matters for arthur-inspector itself

The `SOLID & GoF` category (weight 10 in `src/score.js`) exists to encourage
other projects to document these decisions the same way this file does here
— not just naming the words in passing, but explaining where and why.
