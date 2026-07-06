const path = require("node:path");
const { exists, walkFiles } = require("./fsutil");

/**
 * Manifest-based language/toolchain profiles. `manifestCheck` is authoritative
 * ("this project declares itself as X"); `commandSignal` is what a CLAUDE.md
 * should mention if that language is in play.
 */
const PROFILES = [
  {
    id: "node",
    label: "JavaScript/TypeScript",
    manifestCheck: (root) => exists(path.join(root, "package.json")),
    commandSignal: /\b(npm (run|test|ci)|pnpm |yarn |jest|vitest|eslint|tsc)\b/i,
    exampleTools: "npm test, npm run build, eslint",
  },
  {
    id: "python",
    label: "Python",
    manifestCheck: (root) =>
      exists(path.join(root, "requirements.txt")) ||
      exists(path.join(root, "pyproject.toml")) ||
      exists(path.join(root, "Pipfile")) ||
      exists(path.join(root, "setup.py")),
    commandSignal: /\b(pytest|poetry |pip install|python -m|tox|ruff|black|flake8)\b/i,
    exampleTools: "pytest, poetry run, ruff",
  },
  {
    id: "go",
    label: "Go",
    manifestCheck: (root) => exists(path.join(root, "go.mod")),
    commandSignal: /\b(go test|go build|go run|golangci-lint)\b/i,
    exampleTools: "go test, go build",
  },
  {
    id: "rust",
    label: "Rust",
    manifestCheck: (root) => exists(path.join(root, "Cargo.toml")),
    commandSignal: /\bcargo (test|build|run|clippy)\b/i,
    exampleTools: "cargo test, cargo clippy",
  },
  {
    id: "ruby",
    label: "Ruby",
    manifestCheck: (root) => exists(path.join(root, "Gemfile")),
    commandSignal: /\b(bundle exec|rspec|rake )\b/i,
    exampleTools: "bundle exec rspec, rake",
  },
  {
    id: "java",
    label: "Java/Kotlin",
    manifestCheck: (root) =>
      exists(path.join(root, "pom.xml")) ||
      exists(path.join(root, "build.gradle")) ||
      exists(path.join(root, "build.gradle.kts")),
    commandSignal: /\b(mvn |gradle |gradlew|junit)\b/i,
    exampleTools: "mvn test, ./gradlew test",
  },
  {
    id: "php",
    label: "PHP",
    manifestCheck: (root) => exists(path.join(root, "composer.json")),
    commandSignal: /\b(composer |phpunit)\b/i,
    exampleTools: "composer install, phpunit",
  },
  {
    id: "dotnet",
    label: "C#/.NET",
    manifestCheck: (root) =>
      walkFiles(root, (rel) => /\.(csproj|sln)$/i.test(rel)).length > 0,
    commandSignal: /\bdotnet (test|build|run)\b/i,
    exampleTools: "dotnet test, dotnet build",
  },
  {
    id: "elixir",
    label: "Elixir",
    manifestCheck: (root) => exists(path.join(root, "mix.exs")),
    commandSignal: /\b(mix test|mix compile)\b/i,
    exampleTools: "mix test, mix compile",
  },
];

/** File extension -> language label, used for the descriptive breakdown and as a fallback when no manifest matches. */
const LANGUAGE_EXTENSIONS = {
  ".js": "JavaScript/TypeScript",
  ".jsx": "JavaScript/TypeScript",
  ".mjs": "JavaScript/TypeScript",
  ".cjs": "JavaScript/TypeScript",
  ".ts": "JavaScript/TypeScript",
  ".tsx": "JavaScript/TypeScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".rb": "Ruby",
  ".java": "Java/Kotlin",
  ".kt": "Java/Kotlin",
  ".kts": "Java/Kotlin",
  ".php": "PHP",
  ".cs": "C#/.NET",
  ".ex": "Elixir",
  ".exs": "Elixir",
  ".swift": "Swift",
  ".c": "C/C++",
  ".cpp": "C/C++",
  ".cc": "C/C++",
  ".h": "C/C++",
  ".hpp": "C/C++",
};

/**
 * Detects the language(s)/toolchain in use: manifest files first (authoritative),
 * file-extension counts as the descriptive breakdown and as a fallback when no
 * manifest is present. Returns `primary: null` when nothing recognizable is found.
 */
function detect(root) {
  const matches = PROFILES.filter((p) => p.manifestCheck(root));

  const extCounts = {};
  for (const file of walkFiles(root, () => true)) {
    const lang = LANGUAGE_EXTENSIONS[path.extname(file).toLowerCase()];
    if (lang) extCounts[lang] = (extCounts[lang] || 0) + 1;
  }
  const total = Object.values(extCounts).reduce((a, b) => a + b, 0);
  const breakdown = Object.entries(extCounts)
    .map(([language, count]) => ({ language, count, percent: total ? Math.round((100 * count) / total) : 0 }))
    .sort((a, b) => b.count - a.count);

  let primary = null;
  if (matches.length === 1) {
    primary = matches[0];
  } else if (matches.length > 1) {
    primary = matches.reduce((best, p) => {
      const count = extCounts[p.label] || 0;
      const bestCount = best ? extCounts[best.label] || 0 : -1;
      return count > bestCount ? p : best;
    }, null);
  } else if (breakdown.length > 0) {
    primary = PROFILES.find((p) => p.label === breakdown[0].language) || null;
  }

  return { matches: matches.map((m) => m.id), breakdown, primary };
}

module.exports = { detect, PROFILES, LANGUAGE_EXTENSIONS };
