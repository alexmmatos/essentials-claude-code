---
description: Adds a new subagent template to the catalog used by --generate-all-agents and --generate-essential-agents
argument-hint: <category>/<template-name>
---

Add a new subagent template called "$ARGUMENTS" to essentials-claude-code's
template catalog:

1. Create the template file under
   `template-agents/awesome-claude-code-subagents-main/categories/<category>/<template-name>.md`,
   following the frontmatter shape of existing templates in that directory
   (`name`, `description`, `tools`).
2. Register it in `src/agentTemplateCatalog.json`: add an entry
   `{ "name": "<template-name>", "path": "template-agents/.../<template-name>.md" }`
   to the matching `categories[].agents` array (create the category block if
   it doesn't exist yet), and bump `totalAgents`.
3. Add relevance terms for it in `src/agentTermTemplateRelevance.json`: pick
   file names, manifest keys, or keywords that signal this template is a good
   fit for a project, and add `{ "template": "<template-name>", "relevance": N }`
   entries under each term (see existing entries for the expected relevance
   scale).
4. If the template should also be an "essential" pick for a specific
   language, wire it into `LANGUAGE_AGENT_TEMPLATES` or
   `UNIVERSAL_AGENT_TEMPLATES` in `src/agentTemplates.js`.
5. Run `node src/rankAgentRelevance.js` or `node bin/cli.js --generate-all-agents /tmp/some-fixture`
   against a throwaway fixture to confirm the new template surfaces with a
   positive score for the terms you added.
