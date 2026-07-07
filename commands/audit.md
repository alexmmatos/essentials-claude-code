---
description: Audit a project's Claude Code adoption and show the score with recommendations
argument-hint: "[path] [--min-score=N]"
---

Run the essentials-claude-code CLI:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js" $ARGUMENTS --verbose --explain
```

If $ARGUMENTS is empty, this analyzes the current directory. `--verbose` and
`--explain` are forced here so the plugin audit always shows full per-category
detail and reasoning — outside the plugin (plain `node bin/cli.js` / `npx`),
`--verbose` stays off unless requested, so only `--explain` is on by default.
Show the full output to the user, then summarize the total score and the top
2-3 recommendations in your own words.
