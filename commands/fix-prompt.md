---
description: Generate real content for the project's missing CLAUDE.md, skills, and subagents, ordered by score gap
argument-hint: "[path]"
---

Run:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js" $ARGUMENTS --fix-prompt
```

This prints a prompt listing what's missing, ordered by score gap. Read that
prompt and carry out the recommended fixes directly in this project: write
the actual CLAUDE.md content, real skills, and real subagents (not just
scaffolding).
