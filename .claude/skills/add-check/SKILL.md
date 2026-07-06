---
description: Scaffolds a new scoring category under src/checks/, adjusts the weights in src/score.js, and reminds you to write the corresponding test
argument-hint: <category-name>
---

Add a new check category called "$ARGUMENTS" to arthur-inspector:

1. Create `src/checks/$ARGUMENTS.js` following the pattern of the existing
   modules: export `check(root)` and return the result via `buildResult({...})`
   from `../score`.
2. Add the new category's `id` to `WEIGHTS` (`src/score.js`), redistributing
   the existing weights so the sum stays 100.
3. Register the module in `CHECKS` (`src/index.js`).
4. Write a test in `test/inspector.test.js` (or a dedicated fixture in
   `test/fixtures/`) covering the "missing configuration" and "present" cases.
5. Update the category table in `README.md`.
