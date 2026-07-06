const test = require("node:test");
const assert = require("node:assert/strict");
const { mentionsSolid, mentionsGof } = require("../src/checks/principles");

test("mentionsSolid: matches the bare acronym", () => {
  assert.ok(mentionsSolid("Este módulo segue os princípios SOLID."));
});

test("mentionsSolid: does not match the common word 'solid' alone", () => {
  assert.ok(!mentionsSolid("Este é um argumento sólido e bem fundamentado."));
});

test("mentionsSolid: matches when at least two principle names are spelled out", () => {
  assert.ok(mentionsSolid("Aplicamos responsabilidade única e inversão de dependência aqui."));
});

test("mentionsSolid: one lone principle name is not enough", () => {
  assert.ok(!mentionsSolid("Aplicamos responsabilidade única aqui."));
});

test("mentionsGof: matches 'design patterns'", () => {
  assert.ok(mentionsGof("Usamos alguns design patterns clássicos neste módulo."));
});

test("mentionsGof: matches 'Gang of Four'", () => {
  assert.ok(mentionsGof("Os padrões descritos pela Gang of Four ainda são úteis."));
});

test("mentionsGof: matches when at least two pattern names are spelled out", () => {
  assert.ok(mentionsGof("Usamos o Observer pattern e o Strategy pattern nesta camada."));
});

test("mentionsGof: text unrelated to design patterns does not match", () => {
  assert.ok(!mentionsGof("Este arquivo só configura variáveis de ambiente."));
});
