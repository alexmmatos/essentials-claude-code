---
title: "The .claude directory: every file and folder"
description: "Full summary of the 'Explore the .claude directory' page from Claude Code's official documentation — every file/folder, its scope, whether it's committed, and what it's for."
---

# The `.claude` directory: every file and folder

Source: [code.claude.com/docs/en/claude-directory](https://code.claude.com/docs/en/claude-directory)

Claude Code reads instructions, settings, skills, subagents, and memory from
**two roots**:

- `<your-project>/` — specific to this repository, committed to git (with a
  few gitignored exceptions) so the team can share it.
- `~/.claude/` — personal, applies across all projects, never committed.

> On Windows, `~/.claude` becomes `%USERPROFILE%\.claude`. If `CLAUDE_CONFIG_DIR`
> is set, every `~/.claude` path on this page lives there instead.

**In practice, most users only edit `CLAUDE.md` and `settings.json`.**
Everything else is optional — add rules, skills, or subagents as the need
comes up (see the triggers in
[claude-code-estrutura-essencial.md](./claude-code-estrutura-essencial.md)).

## Project level (repository root)

```
your-project/
├── CLAUDE.md            # committed — instructions loaded every session
├── CLAUDE.local.md       # gitignored — private preferences for this project (you create it; see "What's not shown")
├── .mcp.json            # committed — MCP servers shared by the team
├── .worktreeinclude     # committed — gitignored files to copy into new worktrees
└── .claude/
    ├── settings.json          # committed — permissions, hooks, model, env, statusLine
    ├── settings.local.json    # gitignored — your personal overrides for this project
    ├── rules/                 # committed — topic-scoped instructions, optionally path-gated
    │   ├── testing.md
    │   └── api-design.md
    ├── skills/                # committed — reusable prompts, invoked via /name
    │   └── security-review/
    │       ├── SKILL.md
    │       └── checklist.md
    ├── commands/              # committed — single-file prompts (legacy mechanism; prefer skills/)
    │   └── fix-issue.md
    ├── output-styles/         # committed — output styles shared by the team
    ├── agents/                # committed — subagents with their own prompt and tools
    │   └── code-reviewer.md
    ├── workflows/              # committed — .js scripts orchestrating multiple subagents
    └── agent-memory/          # committed — persistent subagent memory (memory: project)
        └── <agent-name>/
            └── MEMORY.md
```

### Detail of each item

| File/folder | Commit? | When it loads | What it's for |
|---|---|---|---|
| `CLAUDE.md` | Yes | Start of every session | Project conventions, commands, and architectural context. Also works at `.claude/CLAUDE.md` if you prefer to keep the root clean. Target: <200 lines. |
| `CLAUDE.local.md` | **No** (manually gitignored) | Alongside `CLAUDE.md` | Private preferences only you need for this project. You create it manually and add it to `.gitignore`. |
| `.mcp.json` | Yes | Connects at session start; tool schemas load on demand | **Team-shared** MCP servers. Use `${VAR}` for secrets. Servers only you need: `claude mcp add --scope user` (goes to `~/.claude.json`). |
| `.worktreeinclude` | Yes | When a worktree is created (`--worktree`, the `EnterWorktree` tool, or a subagent with `isolation: worktree`) | List (`.gitignore` syntax) of gitignored files (e.g., `.env`) to copy into every new worktree. Git-only. |
| `.claude/settings.json` | Yes | Overrides `~/.claude/settings.json`; is overridden by `settings.local.json`, CLI flags, and managed settings | `permissions` (allow/deny/prompt), `hooks`, `statusLine`, the project's default `model`, `env`, `outputStyle`. Actually enforced — unlike `CLAUDE.md`, which is just guidance. |
| `.claude/settings.local.json` | **No** (auto-gitignored) | The most specific of the user-editable settings files | Your personal overrides (e.g., extra permissions) on top of the team's `settings.json`. |
| `.claude/rules/*.md` | Yes | Without `paths:` → session start; with `paths:` → only when a matching file enters context | Splits `CLAUDE.md` into topic files, optionally scoped by path glob (e.g., only `**/*.test.ts`). Subfolders work (`rules/frontend/react.md`). |
| `.claude/skills/<name>/SKILL.md` | Yes | Description at session start; full content when invoked (`/name`) or when Claude decides to use it | A folder with `SKILL.md` + supporting files. `disable-model-invocation: true` = only you invoke it; `user-invocable: false` = only Claude invokes it. Accepts `$ARGUMENTS`, `$0`, `$1`... |
| `.claude/commands/*.md` | Yes | When you type `/command-name` | Legacy mechanism, single file (no folder). If a skill and a command share a name, the skill wins. **New workflows should use skills/.** |
| `.claude/output-styles/*.md` | Yes | Selected via `outputStyle` at session start | Output styles **shared by the team**. Personal styles usually go in `~/.claude/output-styles/`. |
| `.claude/agents/*.md` | Yes | On demand, when you or Claude invokes it | A subagent with its own system prompt, tools (`tools:` in the frontmatter), and optionally its own model, in an isolated context. Invoke by typing `@` and picking it from autocomplete. |
| `.claude/workflows/*.js` | Yes | Loaded at startup; each file becomes a `/<name>` command | A script that orchestrates multiple subagents (dynamic workflow). Written by Claude and saved via `/workflows`, not hand-authored. A project workflow takes precedence over a personal one with the same name. |
| `.claude/agent-memory/<name>/MEMORY.md` | Yes | First 200 lines (25KB cap) loaded into the subagent's prompt at startup | Persistent memory for a subagent with `memory: project` in its frontmatter. The subagent itself writes and maintains it — different from the main session's auto memory. To keep it out of version control: `memory: local` (`.claude/agent-memory-local/`). For cross-project memory: `memory: user` (`~/.claude/agent-memory/`). |

## Global level (`~/`)

```
~/
├── .claude.json         # local — app state, OAuth, personal MCP servers, UI toggles
└── .claude/
    ├── CLAUDE.md              # local — personal preferences across every project
    ├── settings.json          # local — defaults for all projects
    ├── keybindings.json       # local — custom keyboard shortcuts
    ├── themes/                # local — custom color themes
    ├── rules/                 # local — user rules that apply across every project
    ├── skills/                # local — personal skills across every project
    ├── commands/              # local — personal commands across every project
    ├── output-styles/         # local — personal output styles
    ├── agents/                # local — personal subagents across every project
    ├── workflows/             # local — personal dynamic workflows
    ├── agent-memory/          # generated by Claude — memory for subagents with memory: user
    └── projects/              # generated by Claude — auto memory + transcripts, per project
        └── <project>/
            ├── memory/
            │   ├── MEMORY.md          # index, written by Claude
            │   └── debugging.md       # topic files, written by Claude
            ├── <session>.jsonl        # full session transcript
            └── ...
```

### Detail of each item

| File/folder | When it loads | What it's for |
|---|---|---|
| `~/.claude.json` | Session start; Claude Code rewrites it when you use `/config` or accept trust prompts | State that isn't a "setting": theme, OAuth session, per-project trust decisions, your personal MCP servers, UI toggles (`autoConnectIde`, `externalEditorContext`). |
| `~/.claude/CLAUDE.md` | Every session, in every project, alongside the project's own `CLAUDE.md` | Preferences that apply everywhere: response style, commit format, personal conventions. When it conflicts with the project's `CLAUDE.md`, the project one tends to win. |
| `~/.claude/settings.json` | Your defaults; the project's `settings.json`/`settings.local.json` override matching keys | Same keys as project settings (permissions, hooks, model, env). E.g., permissions you always allow, a preferred model, a global notification hook. |
| `~/.claude/keybindings.json` | Session start + hot-reload on edit | Rebinding shortcuts. Create/open with `/keybindings`. Ctrl+C, Ctrl+D, Ctrl+M, and Caps Lock are reserved. |
| `~/.claude/themes/*.json` | Session start + hot-reload; shows up in `/theme` | A custom color theme: a `base` preset + an `overrides` map. Can be created interactively with `/theme`. |
| `~/.claude/projects/<project>/memory/` | `MEMORY.md` at session start; topic files on demand | **Auto memory**: notes Claude itself accumulates across sessions (build commands, architecture, debugging), without you writing anything. On by default; toggle with `/memory` or `autoMemoryEnabled`. Plain markdown — you can edit or delete it. |
| `~/.claude/rules/`, `skills/`, `commands/`, `output-styles/`, `agents/`, `workflows/` | Same logic as the project versions | Personal equivalents, valid across every project. A project version with the same name takes precedence (skills, subagents, workflows). |
| `~/.claude/agent-memory/` | At subagent startup | Persistent memory for subagents with `memory: user` in their frontmatter — spans projects. |

## What's not shown above

| File | Location | Purpose |
|---|---|---|
| `managed-settings.json` | System level, varies by OS | Settings **enforced by the organization**, which you can't override. See server-managed settings. |
| `CLAUDE.local.md` | Project root | Private preferences for this project, loaded alongside `CLAUDE.md`. You create it manually and add it to `.gitignore`. |
| Installed plugins | `~/.claude/plugins` | Cloned marketplaces, installed plugin versions, per-plugin data — managed by the `claude plugin` commands. |

## Which file to edit for each goal

| You want to | Edit | Scope |
|---|---|---|
| Give Claude project context/conventions | `CLAUDE.md` | Project or global |
| Allow/block specific tool calls | `settings.json` → `permissions` or `hooks` | Project or global |
| Run a script before/after tool calls | `settings.json` → `hooks` | Project or global |
| Set session environment variables | `settings.json` → `env` | Project or global |
| Keep personal overrides out of git | `settings.local.json` | Project only |
| Add a prompt/capability invoked with `/name` | `skills/<name>/SKILL.md` | Project or global |
| Define a specialized subagent with its own tools | `agents/*.md` | Project or global |
| Orchestrate multiple subagents via a script | `workflows/*.js` | Project or global |
| Connect external tools via MCP | `.mcp.json` | Project only |
| Change how Claude formats responses | `output-styles/*.md` | Project or global |

## Precedence order

From what overrides most to what overrides least:

1. **Managed settings** (enforced by the organization) — always wins.
2. **CLI flags** (e.g., `--permission-mode`, `--settings`) — only for that session.
3. Some **environment variables** — varies case by case (see the env vars reference).
4. `settings.local.json` (project) > `settings.json` (project) > `settings.json` (global).
5. **Skills and subagents**: same name at multiple levels → managed > user > project (skills); managed > CLI flag > project > user > plugin (subagents).
6. **MCP servers**: local > project > user.
7. **`CLAUDE.md`**: doesn't override, it's **additive** — all levels enter the context together; more specific instructions tend to prevail when they conflict.
8. **Hooks**: merge — every registered hook fires for its events, regardless of origin.

## Application data (what Claude Code writes on its own)

Beyond the configuration you write, `~/.claude` stores data generated during sessions — all in plain text, unencrypted (protection is just OS file permissions).

**Cleaned up automatically** (after `cleanupPeriodDays`, default 30 days): transcripts (`projects/<project>/<session>.jsonl`), subagent transcripts, large tool-results, pre-edit file snapshots (`file-history/`), `plans/`, `debug/`, paste/image caches, `shell-snapshots/`, `~/.claude.json` `backups/`, and others.

**Kept until you delete them**: `history.jsonl` (prompt history, used for up-arrow recall), `stats-cache.json` (aggregated costs from `/usage`), `remote-settings.json` (cached managed settings).

**Never delete**: `~/.claude.json`, `~/.claude/settings.json`, `~/.claude/plugins/` — they hold authentication, preferences, and installed plugins.

To wipe the state for a specific project (transcripts, auto memory, tasks, its entry in `~/.claude.json`):

```bash
claude project purge ~/path/to/project --dry-run   # just shows the plan
claude project purge ~/path/to/project             # deletes with one confirmation
```

## Recommendation for this project

1. Start with just `CLAUDE.md` (root) and, if needed, `.claude/settings.json`
   for permissions/hooks.
2. Add `.claude/rules/` once `CLAUDE.md` passes ~200 lines or needs rules
   scoped to a single folder/file type.
3. `.claude/skills/`, `.claude/agents/`, and `.mcp.json` come in as the
   practical triggers described in
   [claude-code-estrutura-essencial.md](./claude-code-estrutura-essencial.md)
   show up.
4. Don't commit `.claude/settings.local.json`, `CLAUDE.local.md`, or anything
   under `~/.claude/` — they're personal by definition.

## Related resources

- [Explore the .claude directory (original source)](https://code.claude.com/docs/en/claude-directory)
- [claude-code-estrutura-essencial.md](./claude-code-estrutura-essencial.md) — overview of when to use each extension
- [Memory](https://code.claude.com/docs/en/memory)
- [Settings](https://code.claude.com/docs/en/settings)
- [Skills](https://code.claude.com/docs/en/skills)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [MCP](https://code.claude.com/docs/en/mcp)
