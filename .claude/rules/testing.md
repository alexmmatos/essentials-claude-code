---
paths:
  - "test/**/*.test.js"
---

# Testing conventions

- Use `node:test` and `node:assert/strict` — no external test dependencies
- Fixtures live under `test/fixtures/<name>/`; content is always hand-written,
  never copied verbatim from Claude Code's official documentation examples
- Every new module under `src/checks/` needs at least one test confirming
  that `raw` goes up when the corresponding configuration is present and
  drops when it's absent
