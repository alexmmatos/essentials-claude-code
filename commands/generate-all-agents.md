---
description: Scan the project and generate every subagent template with a positive relevance score
argument-hint: "[path]"
---

Run:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js" $ARGUMENTS --generate-all-agents
```

This scans the project once against the full term dictionary (uses ripgrep
if installed, falls back to a slower built-in scanner otherwise) and copies
every subagent template with a positive relevance score into
`.claude/agents/`. Report which agent files were created versus already
present, and their relevance scores.
