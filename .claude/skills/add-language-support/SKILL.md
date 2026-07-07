---
description: Adds detection support for a new language/toolchain and wires up its essential agent template
argument-hint: <language-id>
---

Add support for detecting the "$ARGUMENTS" language/toolchain in
essentials-claude-code:

1. Add a new profile to `PROFILES` in `src/languages.js`: pick a stable `id`,
   a human-readable `label`, a `manifestCheck(root)` that looks for the
   language's manifest file(s) (e.g. `Cargo.toml`, `go.mod`), a
   `commandSignal` regex matching the toolchain's common commands, and an
   `exampleTools` string for CLAUDE.md guidance.
2. If a flagship subagent template exists for this language under
   `template-agents/awesome-claude-code-subagents-main/categories/02-language-specialists/`,
   map the new `id` to it in `LANGUAGE_AGENT_TEMPLATES`
   (`src/agentTemplates.js`). If no matching template exists yet, use
   [[add-agent-template]] first.
3. Add a fixture under `test/fixtures/` with a minimal manifest file for the
   language, and a test in `test/inspector.test.js` (or the languages-specific
   test file) confirming `detectLanguages` picks it up and that
   `--generate-essential-agents` copies the right template for it.
4. Update the language list in `README.md` if one is documented there.
