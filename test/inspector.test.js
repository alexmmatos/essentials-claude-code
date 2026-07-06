const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { inspect } = require("../src/index");

const EMPTY = path.join(__dirname, "fixtures", "fixture-empty");
const GOOD = path.join(__dirname, "fixtures", "fixture-good");

test("empty project scores low", () => {
  const result = inspect(EMPTY);
  assert.ok(result.total < 20, `expected low score, got ${result.total}`);
});

test("well-configured project scores substantially higher", () => {
  const result = inspect(GOOD);
  assert.ok(result.total > 60, `expected high score, got ${result.total}`);
});

test("claude_md category is found and scored for the good fixture", () => {
  const result = inspect(GOOD);
  const claudeMd = result.categories.find((c) => c.id === "claude_md");
  assert.ok(claudeMd);
  assert.ok(claudeMd.points > 0);
});

test("categories sum to maxTotal of 100", () => {
  const result = inspect(GOOD);
  assert.equal(result.maxTotal, 100);
});

test("recommendations are sorted by biggest gap first", () => {
  const result = inspect(EMPTY);
  const gaps = result.recommendations.map((r) => r.gap);
  const sorted = [...gaps].sort((a, b) => b - a);
  assert.deepEqual(gaps, sorted);
});

test("principles category detects SOLID and GoF docs in the good fixture", () => {
  const result = inspect(GOOD);
  const principles = result.categories.find((c) => c.id === "principles");
  assert.ok(principles);
  assert.equal(principles.points, principles.weight);
});

test("principles category scores zero when no .md mentions SOLID or GoF", () => {
  const result = inspect(EMPTY);
  const principles = result.categories.find((c) => c.id === "principles");
  assert.ok(principles);
  assert.equal(principles.points, 0);
});
