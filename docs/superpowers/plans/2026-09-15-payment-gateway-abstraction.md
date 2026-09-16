# Abstração de Gateway de Pagamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover o acoplamento estrutural ao Asaas e permitir a implementação do Deflow atrás de um contrato interno de pagamentos, sem mudanças no frontend público.

**Architecture:** O Strapi terá um `PaymentGateway` selecionado por configuração e um `PaymentService` para orquestração. Adapters traduzirão clientes, checkout, erros e webhooks externos para tipos internos. O PostgreSQL será a fonte de verdade para idempotência, tentativas e eventos processados.

**Tech Stack:** Strapi 5, TypeScript, PostgreSQL via query engine do Strapi, Next.js 16, Node test runner, Vitest.

---

## Mapa de arquivos

- Backend:
  - Criar `src/payment/payment-gateway.ts` para os tipos e a porta interna.
  - Criar `src/payment/payment-service.ts` para orquestração e transições.
  - Mover a implementação do Asaas para `src/services/external/asaas.gateway.ts`.
  - Criar `src/payment/webhook-events.ts` para o evento interno.
  - Alterar `src/api/order/controllers/order.ts`, schemas e serialização.
  - Alterar rotas/policies de webhook e adicionar testes de concorrência, retry e eventos duplicados.
- Frontend:
  - Manter `app/lib/checkout-contracts.ts` neutro.
  - Alterar textos em `CheckoutClient.tsx`, `OrderDetailClient.tsx` e política de privacidade.
  - Manter o BFF sem URLs ou headers específicos de gateway.

### Entrega 1: idempotência persistente

**Arquivos:** `src/api/order/controllers/order.ts`, schema do pedido, testes do controller e novo módulo de idempotência.

- [ ] Escrever teste que envia a mesma chave para duas criações e espera o mesmo pedido sem segunda chamada ao gateway.
- [ ] Executar o teste isolado e confirmar falha porque o controller ignora `Idempotency-Key`.
- [ ] Validar UUID v4 e persistir `checkoutIdempotencyScope` único (`userId:uuid` normalizado), mantendo a chave original em campo separado.
- [ ] Fazer o lookup por usuário e chave antes de criar o pedido.
- [ ] Tratar corrida de unicidade retornando resultado completo ou conflito 409 enquanto estiver em processamento, nunca sucesso incompleto.
- [ ] Executar os testes do controller e confirmar sucesso.
- [ ] Adicionar teste de falha do gateway seguida de retry com a mesma chave.
- [ ] Confirmar que a regra não usa Redis como fonte de verdade.
- [ ] Comparar fingerprint SHA-256 do corpo canônico antes de consultar preços atuais; rejeitar a mesma chave com conteúdo diferente.
- [ ] Bloquear reexecução de checkout incerto após timeout ou reinício; exigir reconciliação, sem assumir idempotência externa não documentada.
- [ ] Commitar como `feat: enforce checkout idempotency in backend`.

### Entrega 2: porta e service de pagamento

**Arquivos:** `src/payment/payment-gateway.ts`, `src/payment/payment-service.ts`, adapter Asaas, controller de pedidos e testes.

- [ ] Escrever testes do `PaymentService` com um gateway falso para criar checkout, falhar e retornar erro normalizado.
- [ ] Executar os testes e confirmar falha pela ausência da porta/service.
- [ ] Definir interfaces neutras para customer, checkout, confirmação sandbox e erros.
- [ ] Implementar `PaymentService.createCheckoutForOrder` usando somente a porta.
- [ ] Adaptar o Asaas para implementar a porta sem expor tipos Asaas ao controller.
- [ ] Alterar o controller para chamar o service e remover imports Asaas.
- [ ] Executar testes unitários e do controller.
- [ ] Commitar como `refactor: isolate payment gateway behind service`.

### Entrega 3: persistência neutra

**Arquivos:** `src/api/order/content-types/order/schema.json`, perfil do cliente, `serialize-order.ts`, controller e testes.

- [ ] Escrever testes que validam a serialização usando apenas campos genéricos.
- [ ] Executar os testes e confirmar falha com o schema atual específico do Asaas.
- [ ] Substituir campos Asaas por `paymentProvider`, `providerCustomerId`, `providerCheckoutId`, `providerPaymentId` e `paymentUrl`.
- [ ] Remover `asaasCustomerId`, `asaasCheckoutId`, `asaasPaymentId` e `asaasInvoiceUrl`.
- [ ] Atualizar o adapter Asaas para gravar os campos genéricos.
- [ ] Atualizar fixtures e testes.
- [ ] Commitar como `refactor: make payment persistence provider-neutral`.

### Entrega 4: webhooks normalizados e idempotentes

**Arquivos:** `src/payment/webhook-events.ts`, controllers/routes/policies de webhook, schema de eventos e adapter Asaas.

- [ ] Escrever testes para evento válido, evento desconhecido, payload inválido e redelivery.
- [ ] Executar os testes e confirmar falha porque o processamento atual aceita apenas o mapeamento Asaas.
- [ ] Criar parser do Asaas que retorna evento interno ou `null`.
- [ ] Criar persistência única por `provider + externalEventId` antes de alterar o pedido.
- [ ] Aplicar apenas transições válidas e tornar redelivery inofensivo.
- [ ] Manter autenticação específica do Asaas no adapter/policy.
- [ ] Alterar o proxy local do frontend para uma rota neutra ou explicitamente configurável.
- [ ] Executar testes dos dois repositórios.
- [ ] Commitar como `feat: normalize and deduplicate payment webhooks`.

### Entrega 5: frontend e contratos neutros

**Arquivos:** `app/components/CheckoutClient.tsx`, `app/components/OrderDetailClient.tsx`, `app/politica-privacidade/page.tsx`, contratos e testes.

- [ ] Escrever teste ou verificação textual que não permita referências operacionais ao Asaas no frontend público.
- [ ] Executar a verificação antes da alteração e registrar as ocorrências atuais.
- [ ] Substituir textos por mensagens neutras de pagamento seguro.
- [ ] Remover códigos de erro de provedor dos contratos públicos e mapear falhas para códigos internos.
- [ ] Tornar o endpoint de sandbox dependente do gateway ativo, sem nomear Asaas na UI.
- [ ] Executar testes, typecheck e lint com artefatos `.next` e worktrees excluídos.
- [ ] Commitar como `refactor: remove provider details from checkout frontend`.

### Entrega 6: adapter Deflow

**Arquivos:** novo `src/services/external/deflow.gateway.ts`, configuração, testes e documentação operacional.

- [ ] Escrever testes do contrato compartilhado que o adapter Deflow deverá cumprir.
- [ ] Executar os testes e confirmar falha porque o adapter ainda não existe.
- [ ] Implementar configuração por `PAYMENT_PROVIDER` e credenciais server-side.
- [ ] Implementar criação/recuperação de cliente e checkout conforme contrato da Deflow.
- [ ] Implementar parser e autenticação do webhook Deflow.
- [ ] Selecionar Asaas ou Deflow sem alterar controller, service ou frontend.
- [ ] Executar suíte completa dos dois repositórios.
- [ ] Documentar variáveis, rollout e remoção da configuração Asaas.
- [ ] Commitar como `feat: add Deflow payment gateway adapter`.

## Verificação por entrega

Em cada entrega, executar no backend:

```powershell
npm test
npx tsc --noEmit
```

No frontend, executar:

```powershell
npm test
npx tsc --noEmit
npm run lint
```

O lint deverá ignorar `.next/**`, `.worktrees/**`, `node_modules/**` e outros artefatos gerados antes de ser usado como critério de aceite.
