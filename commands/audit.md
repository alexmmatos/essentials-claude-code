---
description: Audit a project's Claude Code adoption and show the score with recommendations
argument-hint: "[path] [--verbose] [--explain] [--min-score=N]"
---

Run the essentials-claude-code CLI:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js" $ARGUMENTS
```

If $ARGUMENTS is empty, this analyzes the current directory. Show the full
output to the user, then summarize the total score and the top 2-3
recommendations in your own words.
