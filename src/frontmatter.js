/** Minimal YAML-frontmatter reader: enough for `key: value` and `key:` + `- item` lists. */
function parseFrontmatter(content) {
  if (!content || !content.startsWith("---")) return { data: {}, body: content || "" };
  const end = content.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: content };

  const raw = content.slice(3, end).trim();
  const body = content.slice(end + 4).replace(/^\r?\n/, "");
  const data = {};
  let currentKey = null;

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim()) continue;

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(stripQuotes(listItem[1].trim()));
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const value = kv[2].trim();
      currentKey = key;
      data[key] = value === "" ? undefined : stripQuotes(value);
    }
  }

  return { data, body };
}

function stripQuotes(s) {
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    return s.slice(1, -1);
  }
  return s;
}

module.exports = { parseFrontmatter };
