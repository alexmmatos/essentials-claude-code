---
description: Generate a few subagents matched to this project's detected language(s)
argument-hint: "[path]"
---

Run:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js" $ARGUMENTS --generate-essential-agents
```

Report which agent files were created in `.claude/agents/` versus already
present.
