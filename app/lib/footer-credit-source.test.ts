import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("footer includes the AriSilva.tech developer credit", () => {
  const source = readFileSync("app/components/Footer.tsx", "utf8");

  assert.match(source, /Code2/);
  assert.match(source, /https:\/\/arisilva\.tech\/pt-br/);
  assert.match(source, /Desenvolvido por/);
  assert.match(source, /AriSilva\.tech/);
  assert.match(source, /rel="noopener noreferrer"/);
});
