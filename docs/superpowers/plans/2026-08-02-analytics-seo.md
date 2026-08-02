# Analytics e SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar analytics via `@next/third-parties`, metadata global, robots, sitemap, manifest e documentação sem IDs reais e sem alterar layout/regra visual.

**Architecture:** Analytics fica centralizado em módulos pequenos: um módulo server-safe decide qual provedor renderizar no root layout, e um módulo client-safe expõe `trackEvent`. SEO/crawler usa rotas nativas do App Router e um helper único para URL canônica.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@next/third-parties/google`, Metadata API, MetadataRoute.

---

### Task 1: Dependência oficial

- [ ] Instalar `@next/third-parties` com npm.
- [ ] Confirmar `package.json` e `package-lock.json`.

### Task 2: Helpers testáveis

- [ ] Criar helper central de URL do site.
- [ ] Criar configuração tipada de analytics.
- [ ] Criar testes de comportamento para URL e analytics.
- [ ] Rodar testes vendo falha antes da implementação final.

### Task 3: Integração no App Router

- [ ] Renderizar GTM ou GA no `app/layout.tsx`, nunca ambos.
- [ ] Melhorar metadata global com valores existentes do Strapi e fallback seguro.
- [ ] Evitar page views manuais.

### Task 4: Crawler e manifesto

- [ ] Criar `app/robots.ts`.
- [ ] Criar `app/sitemap.ts` com rotas estáticas e dinâmicas confiáveis do Strapi.
- [ ] Criar `app/manifest.ts` usando nome/descrição/cores existentes e favicon válido.

### Task 5: Env e README

- [ ] Atualizar `.env.example` sem credenciais reais.
- [ ] Adicionar seção Analytics e SEO ao README.

### Task 6: Validação

- [ ] Rodar TypeScript.
- [ ] Rodar lint.
- [ ] Rodar build de produção.
- [ ] Verificar ausência de IDs reais e comportamento de analytics/robots/sitemap/manifest.
