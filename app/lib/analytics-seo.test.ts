import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getAnalyticsConfig } from "./analytics-config";
import { getCanonicalPath, getSiteUrl, isProductionIndexable } from "./site-url";

test("getSiteUrl normaliza NEXT_PUBLIC_SITE_URL removendo barra final", () => {
  assert.equal(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://valhalla.example.com/" }), "https://valhalla.example.com");
});

test("getSiteUrl usa fallback seguro quando a URL não existe ou é inválida", () => {
  assert.equal(getSiteUrl({}), "https://example.com");
  assert.equal(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "localhost:3000" }), "https://example.com");
});

test("getCanonicalPath compõe URLs absolutas a partir da URL central", () => {
  const env = { NEXT_PUBLIC_SITE_URL: "https://valhalla.example.com/" };

  assert.equal(getCanonicalPath("/", env), "https://valhalla.example.com");
  assert.equal(getCanonicalPath("/produto/notebook", env), "https://valhalla.example.com/produto/notebook");
});

test("isProductionIndexable permite indexação apenas em produção", () => {
  assert.equal(isProductionIndexable({ NODE_ENV: "production" }), true);
  assert.equal(isProductionIndexable({ NODE_ENV: "development" }), false);
  assert.equal(isProductionIndexable({ NODE_ENV: "production", VERCEL_ENV: "preview" }), false);
  assert.equal(isProductionIndexable({ NODE_ENV: "production", NEXT_PUBLIC_APP_ENV: "staging" }), false);
});

test("getAnalyticsConfig mantém analytics desligado sem flag explícita", () => {
  assert.deepEqual(getAnalyticsConfig({ NODE_ENV: "production", NEXT_PUBLIC_ANALYTICS_MODE: "gtm", NEXT_PUBLIC_GTM_ID: "GTM-ABC1234" }), {
    enabled: false,
    mode: "off",
  });
});

test("getAnalyticsConfig seleciona GTM quando habilitado e com ID válido", () => {
  assert.deepEqual(
    getAnalyticsConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
      NEXT_PUBLIC_ANALYTICS_MODE: "gtm",
      NEXT_PUBLIC_GTM_ID: "GTM-ABC1234",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC1234567",
    }),
    {
      enabled: true,
      mode: "gtm",
      gtmId: "GTM-ABC1234",
    }
  );
});

test("getAnalyticsConfig seleciona GA direto somente quando modo GA estiver ativo", () => {
  assert.deepEqual(
    getAnalyticsConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "true",
      NEXT_PUBLIC_ANALYTICS_MODE: "ga",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC1234567",
      NEXT_PUBLIC_GTM_ID: "GTM-ABC1234",
    }),
    {
      enabled: true,
      mode: "ga",
      gaMeasurementId: "G-ABC1234567",
    }
  );
});

test("getAnalyticsConfig vira no-op quando modo ou IDs são inválidos", () => {
  assert.deepEqual(getAnalyticsConfig({ NODE_ENV: "production", NEXT_PUBLIC_ANALYTICS_ENABLED: "true", NEXT_PUBLIC_ANALYTICS_MODE: "invalid" }), {
    enabled: false,
    mode: "off",
  });
  assert.deepEqual(getAnalyticsConfig({ NODE_ENV: "production", NEXT_PUBLIC_ANALYTICS_ENABLED: "true", NEXT_PUBLIC_ANALYTICS_MODE: "gtm" }), {
    enabled: false,
    mode: "off",
  });
});

test("arquivos de ambiente usam o measurement ID atual do GA4", () => {
  const expectedGaId = "G-WE9DC7GWST";
  const envFiles = [".env.local", ".env.dokploy.dev", ".env.dokploy.prod"];

  for (const envFile of envFiles) {
    const contents = readFileSync(join(process.cwd(), envFile), "utf8");

    assert.match(contents, new RegExp(`^NEXT_PUBLIC_GA_MEASUREMENT_ID=${expectedGaId}$`, "m"), envFile);
  }
});
