const path = require("node:path");
const { walkFiles, readFileSafe } = require("../fsutil");
const { buildResult } = require("../score");

const SOLID_PRINCIPLE_NAMES = [
  /single responsibility|responsabilidade única/i,
  /open[\/\- ]closed|aberto[\/\- ]fechado/i,
  /liskov substitution|substituição de liskov/i,
  /interface segregation|segregação de interface/i,
  /dependency inversion|inversão de dependência/i,
];

const GOF_PATTERN_NAMES = [
  /singleton/i,
  /factory method|método f[aá]brica/i,
  /abstract factory|f[aá]brica abstrata/i,
  /builder pattern|padrão builder|construtor \(pattern\)/i,
  /prototype pattern|protótipo \(pattern\)/i,
  /adapter pattern|adaptador \(pattern\)/i,
  /decorator pattern|decorador \(pattern\)/i,
  /facade pattern|fachada \(pattern\)/i,
  /proxy pattern|procurador \(pattern\)/i,
  /composite pattern|composto \(pattern\)/i,
  /observer pattern|observador \(pattern\)/i,
  /strategy pattern|estratégia \(pattern\)/i,
  /command pattern|comando \(pattern\)/i,
  /template method|método modelo/i,
  /iterator pattern|iterador \(pattern\)/i,
  /visitor pattern|visitante \(pattern\)/i,
  /state pattern|estado \(pattern\)/i,
  /chain of responsibility|cadeia de responsabilidade/i,
  /mediator pattern|mediador \(pattern\)/i,
  /memento pattern/i,
];

/** Case-sensitive on the bare acronym (avoids matching the common word "solid"). */
function mentionsSolid(text) {
  if (/\bSOLID\b/.test(text)) return true;
  return SOLID_PRINCIPLE_NAMES.filter((re) => re.test(text)).length >= 2;
}

function mentionsGof(text) {
  if (/\bgof\b/i.test(text)) return true;
  if (/gang of four/i.test(text)) return true;
  if (/design patterns?/i.test(text)) return true;
  return GOF_PATTERN_NAMES.filter((re) => re.test(text)).length >= 2;
}

function check(root) {
  const findings = [];
  const recommendations = [];
  const mdFiles = walkFiles(root, (rel) => rel.toLowerCase().endsWith(".md"));

  if (mdFiles.length === 0) {
    findings.push({ type: "missing", message: "No .md file found in the project." });
    recommendations.push(
      "Document, in some .md file, the SOLID principles and GoF design patterns used in the code."
    );
    return buildResult({ id: "principles", label: "SOLID & GoF", raw: 0, findings, recommendations });
  }

  let solidFile = null;
  let gofFile = null;
  for (const file of mdFiles) {
    const content = readFileSafe(file) || "";
    if (!solidFile && mentionsSolid(content)) solidFile = file;
    if (!gofFile && mentionsGof(content)) gofFile = file;
    if (solidFile && gofFile) break;
  }

  let raw = 0;
  if (solidFile) {
    raw += 50;
    findings.push({ type: "ok", message: `Found a mention of SOLID principles in ${path.relative(root, solidFile)}.` });
  } else {
    findings.push({ type: "missing", message: "No .md mentions the SOLID principles." });
    recommendations.push("Document the SOLID principles applied in the project in some .md (e.g., docs/architecture.md).");
  }

  if (gofFile) {
    raw += 50;
    findings.push({ type: "ok", message: `Found a mention of GoF design patterns in ${path.relative(root, gofFile)}.` });
  } else {
    findings.push({ type: "missing", message: "No .md mentions GoF design patterns." });
    recommendations.push("Document the GoF design patterns used in the project in some .md.");
  }

  return buildResult({ id: "principles", label: "SOLID & GoF", raw, findings, recommendations });
}

module.exports = { check, mentionsSolid, mentionsGof };
