---
title: "Claude Code's essential files and folders"
description: "Summary of the official documentation (features-overview) on the file and folder structure that gets the best results from Claude Code in this project."
---

# Claude Code's essential files and folders

Source: [code.claude.com/docs/en/features-overview](https://code.claude.com/docs/en/features-overview)

Claude Code is extensible through a handful of conventional files and
folders. Each one plugs into a different point of the agent loop
(always-loaded context, on-demand capability, or background automation).
This document summarizes what each one is, what it's for, and when to add it.

## Overview

| File/folder | What it does | When to use it |
|---|---|---|
| `CLAUDE.md` | Persistent context, loaded every session | Project conventions, "always do X" rules |
| `.claude/skills/` | Reusable knowledge and workflows, invocable via `/name` | Reference content, repeatable tasks |
| `.claude/agents/` (subagents) | Isolated context that runs separately and returns a summary | Tasks that read many files, parallel work |
| `.claude/rules/` | Rules loaded always, or only when specific files are opened | Keeping `CLAUDE.md` lean, language/folder-specific rules |
| `.mcp.json` / MCP config | Connects Claude to external services | Database, Slack, browser, APIs |
| `.claude/settings.json` (hooks) | Script, HTTP request, prompt, or subagent triggered by lifecycle events | Automation that must always run (lint, blocking commands, notifications) |
| Plugins / marketplaces | Package skills, hooks, subagents, and MCP into one installable unit | Reusing the same setup across repositories, or distributing it to others |

## Details of each one

### `CLAUDE.md`

- Loads **every session**, automatically, from the working directory up to
  the root.
- Ideal for: code conventions, build/test commands, project architecture,
  "never do X" rules.
- **Official recommendation: keep it under 200 lines.** If it keeps growing,
  move reference content into skills or split it into files under
  `.claude/rules/`.
- Supports importing other files with `@path`.

### `.claude/skills/`

- A skill is a Markdown file holding knowledge, a workflow, or instructions.
- Can be invoked manually (`/skill-name`) or loaded automatically by Claude
  when relevant.
- Two kinds of use:
  - **Reference**: knowledge Claude uses throughout the session (e.g., an API
    style guide).
  - **Action**: instructs Claude to do something specific (e.g., `/deploy`
    that runs the deploy checklist).
- By default, the skill's **description** loads at the start of every session
  (low cost); the **full content** only loads when the skill is used.
- For skills that should only ever be triggered manually (zero context cost
  until invoked), use `disable-model-invocation: true` in the frontmatter.

### `.claude/agents/` (subagents)

- Isolated workers with their own context; only the summary returns to the
  main conversation.
- Good for: tasks that read many files, parallel work, specialized workers.
- Can preload specific skills via the `skills:` field.
- At startup, a subagent loads: its own system prompt (not the full Claude
  Code system prompt), the full content of the skills listed in `skills:`,
  and `CLAUDE.md` + git status (except the built-in `Explore` and `Plan`
  agents, which omit both).

### `.claude/rules/`

- Similar to `CLAUDE.md`, but can be **path-scoped** via the `paths`
  frontmatter, loading only when matching files are opened.
- Keeps `CLAUDE.md` focused on core rules by moving language/directory-specific
  guidelines here instead.

### MCP (Model Context Protocol)

- Connects Claude to external services (database, Slack, browser, internal
  APIs).
- At session start, only the tool **names** load; the full schema only loads
  when a tool is actually used (low context cost until then).
- Precedence on name conflicts: local > project > user.
- Use `/mcp` to see connection status and token cost per server.

### Hooks (in `.claude/settings.json`)

- Fire on lifecycle events (e.g., `PostToolUse`, `SessionStart`).
- Can run a script, HTTP request, prompt, or subagent.
- Always fire deterministically on their configured event — unlike a skill,
  whose use depends on Claude interpreting the instruction.
- Zero context cost, unless the hook returns output that becomes a message in
  the conversation.
- Use hooks for **real guardrails** (e.g., blocking edits to `.env`), since an
  instruction in `CLAUDE.md` is a request, not a guarantee.

### Plugins and marketplaces

- A plugin packages skills, hooks, subagents, and MCP servers into one
  installable unit.
- Plugin skills are namespaced (`/my-plugin:review`) to avoid conflicts
  between plugins.
- Use this when you want to reuse the same setup across multiple
  repositories, or distribute it via a marketplace.

## When to add each one (practical triggers)

| Trigger | Add |
|---|---|
| Claude gets the same convention/command wrong twice | An entry in `CLAUDE.md` |
| You type the same prompt repeatedly to start a task | A user-invocable skill |
| You paste the same playbook/procedure into the conversation for the third time | Capture it as a skill |
| You keep copying data from a browser tab Claude can't see | Connect it as an MCP server |
| Claude reads many files to find where a symbol is defined/used | A code-intelligence (LSP) plugin for the language |
| A side task fills the conversation with output you won't reuse | Route it through a subagent |
| You want something to always happen without having to ask | Write a hook |
| A second repository needs the same setup | Package it as a plugin |

## How the layers combine

- **`CLAUDE.md`**: additive — all levels (managed, user, project, subfolders)
  contribute to the context simultaneously.
- **Skills and subagents**: when the same name exists at multiple levels, one
  wins by priority (managed > user > project for skills; managed > CLI flag >
  project > user > plugin for subagents).
- **MCP servers**: win by name in the order local > project > user.
- **Hooks**: merge — every registered hook fires for its events, regardless
  of origin.

## Context cost per feature

| Feature | When it loads | What it loads | Cost |
|---|---|---|---|
| `CLAUDE.md` | Session start | Full content | Every request |
| Skills | Session start + when used | Descriptions at start, full content when used | Low (descriptions only, unless used) |
| MCP | Session start | Tool names; full schema on demand | Low until the tool is used |
| Subagents | When created | Fresh, isolated context | Isolated from the main session |
| Hooks | On trigger | Nothing (runs externally) | Zero, unless it returns output |

## Recommendation for getting started on this project

1. Create a `CLAUDE.md` at the root with conventions, build/test commands,
   and basic architecture.
2. Add skills as workflows start repeating (e.g., deploy, review).
3. Only create subagents/hooks/MCP when the matching trigger from the table
   above comes up — don't configure everything at once.

## Related resources

- [Extend Claude Code (original source)](https://code.claude.com/docs/en/features-overview)
- [CLAUDE.md / Memory](https://code.claude.com/docs/en/memory)
- [Skills](https://code.claude.com/docs/en/skills)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Hooks](https://code.claude.com/docs/en/hooks-guide)
- [MCP](https://code.claude.com/docs/en/mcp)
- [Plugins](https://code.claude.com/docs/en/plugins)
