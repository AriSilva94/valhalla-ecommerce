import test from "node:test";
import assert from "node:assert/strict";
import { VALHALLA_STORE, mapsEmbedUrl } from "./store-map";

const GOOGLE_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4774.274580958311!2d-51.074473399999995!3d0.0168319!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8d61e129be6d5195%3A0x6f97316cb7a05b8f!2sValhalla%20Tecnologia!5e1!3m2!1spt-BR!2sbr!4v1786032841795!5m2!1spt-BR!2sbr";

test("mapsEmbedUrl: reproduz exatamente a URL gerada pelo Google", () => {
  assert.equal(mapsEmbedUrl(VALHALLA_STORE), GOOGLE_URL);
});

test("mapsEmbedUrl: coordenadas entram nos campos 2d (longitude) e 3d (latitude)", () => {
  const url = mapsEmbedUrl({ ...VALHALLA_STORE, latitude: -23.5, longitude: -46.6 });
  assert.match(url, /!2d-46\.6!3d-23\.5!/);
});

test("mapsEmbedUrl: modo roadmap troca o campo 5e", () => {
  assert.match(mapsEmbedUrl(VALHALLA_STORE), /!5e1!/);
  assert.match(mapsEmbedUrl({ ...VALHALLA_STORE, mode: "roadmap" }), /!5e0!/);
});

test("mapsEmbedUrl: place id e nome do lugar são escapados", () => {
  const url = mapsEmbedUrl({ ...VALHALLA_STORE, placeLabel: "Loja & Cia" });
  assert.match(url, /!1s0x8d61e129be6d5195%3A0x6f97316cb7a05b8f!/);
  assert.match(url, /!2sLoja%20%26%20Cia!/);
});

test("mapsEmbedUrl: idioma e região aparecem nos dois blocos de locale", () => {
  const url = mapsEmbedUrl({ ...VALHALLA_STORE, language: "en", region: "us" });
  assert.match(url, /!3m2!1sen!2sus!/);
  assert.match(url, /!5m2!1sen!2sus$/);
});
