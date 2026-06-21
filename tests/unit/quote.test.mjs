// Unit tests for quote.js pure helpers (ESM).
import { test } from "node:test";
import assert from "node:assert/strict";
import { isInServiceArea, escapeHtml } from "../../functions/api/quote.js";

test("isInServiceArea — Sydney postcodes", () => {
  assert.equal(isInServiceArea("2026"), true);
  assert.equal(isInServiceArea("2000"), true);
  assert.equal(isInServiceArea("3000"), false);
  assert.equal(isInServiceArea(""), false);
  assert.equal(isInServiceArea("abc"), false);
});

test("escapeHtml", () => {
  assert.equal(escapeHtml(`a&b<c>"d'`), "a&amp;b&lt;c&gt;&quot;d&#039;");
});
