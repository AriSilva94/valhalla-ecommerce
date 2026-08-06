import test from "node:test";
import assert from "node:assert/strict";
import { cn } from "./cn";

test("cn: tamanho e cor de texto do tema convivem", () => {
  assert.equal(cn("text-vh-12 text-vh-muted"), "text-vh-12 text-vh-muted");
  assert.equal(cn("text-vh-lime", "text-vh-11"), "text-vh-lime text-vh-11");
  assert.equal(cn("text-vh-13-5 text-vh-accent"), "text-vh-13-5 text-vh-accent");
});

test("cn: continua resolvendo conflito real de tamanho", () => {
  assert.equal(cn("text-vh-12", "text-vh-20"), "text-vh-20");
});

test("cn: continua resolvendo conflito real de cor", () => {
  assert.equal(cn("text-vh-muted", "text-vh-lime"), "text-vh-lime");
  assert.equal(cn("text-white", "text-vh-soft"), "text-vh-soft");
});

test("cn: conflitos padrão do Tailwind seguem funcionando", () => {
  assert.equal(cn("mb-1.5", "mb-5"), "mb-5");
  assert.equal(cn("px-2", "px-4"), "px-4");
  assert.equal(cn("text-sm", "text-lg"), "text-lg");
});

test("cn: aceita condicionais e valores falsy", () => {
  assert.equal(cn("flex", false, undefined, "gap-2"), "flex gap-2");
});
