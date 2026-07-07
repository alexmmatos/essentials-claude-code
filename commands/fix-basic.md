---
description: Create the missing basic Claude Code scaffolding (CLAUDE.md, settings.json, rules/skills/agents dirs)
argument-hint: "[path]"
---

Run:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js" $ARGUMENTS --fix-basic
```

This only creates missing scaffolding and never overwrites existing files.
Report which files/directories were created versus already present.
