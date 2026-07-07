---
description: Generate real content for the project's missing CLAUDE.md, skills, and subagents, ordered by score gap
argument-hint: "[path]"
---

Run:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cli.js" $ARGUMENTS --fix-prompt
```

That command's output is a generated prompt listing what's missing, ordered
by score gap. Do not paste that prompt back to the user and stop there —
treat it as your own instructions and execute it now: write the actual
CLAUDE.md content, real skills, and real subagents directly in this project
(not just scaffolding). Once done, report a short summary of what you
created or changed, the same way `/fix-basic` reports its actions.
