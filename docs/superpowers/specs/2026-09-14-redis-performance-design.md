# Redis e desempenho — desenho técnico

## Objetivo

Reduzir leituras repetidas ao Strapi/PostgreSQL, tornar o rate limit efetivo entre réplicas e impedir duplicação acidental de pedidos e webhooks. O escopo é exclusivamente o ambiente local de desenvolvimento; nenhuma configuração ou serviço de produção será criado ou alterado.

## Referência adotada

O cliente e a operação do Redis seguem o padrão já usado no projeto Fluent Too: `ioredis`, cliente singleton, `lazyConnect`, `maxRetriesPerRequest: 1`, `retryStrategy: () => null` e falha explícita sem loop de reconexão. O rate limit é `INCR` + `EXPIRE` + `TTL`, retornando `Retry-After` e liberando a requisição se Redis estiver indisponível.

## Topologia local

O compose local do backend terá `redis:7-alpine`, healthcheck `redis-cli ping` e porta publicada apenas em `127.0.0.1`. O frontend executado pelo host usará `REDIS_URL=redis://localhost:6379`; quando executado no compose, usará `redis://redis:6379`. `REDIS_URL` será documentada nos exemplos de ambiente e não será obrigatória: a ausência dela mantém a aplicação funcional, com fallback seguro em memória onde aplicável.

## Componentes e fluxos

### Conteúdo público

O frontend terá um adaptador de cache Redis independente do cliente Strapi. `getHomepage`, `getSiteSettings`, categorias, FAQ, políticas, catálogo, produto por slug e produtos por categoria usarão cache-aside serializado em JSON. Em cache miss, a consulta existente ao Strapi permanece a fonte de verdade; em sucesso, o resultado é armazenado com TTL. Se Redis falhar, o comportamento de fallback atual em memória permanece.

Chaves são prefixadas por domínio: `catalog:products`, `catalog:product:{slug}`, `catalog:category:{slug}`, `catalog:category-products:{slug}`, `content:homepage`, `content:site-settings`, `content:faqs` e `content:policies`. TTLs são curtos para catálogo (cinco a dez minutos) e maiores para conteúdo institucional (quinze minutos a seis horas). Esta entrega não incluirá invalidação por lifecycle do Strapi; TTLs e o cache local existente preservam consistência simples no desenvolvimento. Uma futura entrega poderá adicionar invalidação explícita por webhooks/lifecycles.

### CEP e rate limit

`GET /api/cep/[cep]` armazena somente respostas válidas do ViaCEP por sete dias; `NOT_FOUND` não é persistido. Os endpoints de autenticação e checkout passam a chamar um rate limiter Redis assíncrono. O fallback em memória permanece para desenvolvimento sem Redis, de modo que as proteções atuais não somem. Com Redis configurado, o contador é compartilhado por processos e a resposta 429 inclui `Retry-After`.

### Checkout e pagamentos

O cliente gera uma chave UUID ao iniciar uma tentativa de checkout e a repete em retries. O BFF a valida e a encaminha como `Idempotency-Key`. O backend usa Redis para reservar `checkout:lock:{userId}:{key}` por sessenta segundos e reter a resposta final em `checkout:result:{userId}:{key}` por 24 horas. Chamadas simultâneas recebem conflito enquanto a primeira está em curso; retries posteriores recebem a resposta persistida. Redis não é a única garantia: a chave também será gravada como campo único no pedido no PostgreSQL, tornando a proteção durável caso Redis seja reiniciado.

O webhook do Asaas usa `webhook:asaas:{paymentId}` por 72 horas para cortar redeliveries concorrentes, mas o update do pedido continua no PostgreSQL. Um evento repetido não pode depender apenas do Redis para correção; o update de status deve ser idempotente.

## Banco e redução de payload

O pedido ganhará a chave de idempotência única e índices para consultas operacionais: `(user_id, created_at DESC)`, `asaasCheckoutId` e `asaasPaymentId`. A lista de pedidos será paginada. O contrato de catálogo terá uma projeção enxuta para header/listas e uma projeção completa para a página do produto, evitando transferir galerias, SEO e especificações a cada render global. A busca será paginada no backend em uma etapa posterior; não será escondida por cache Redis nesta entrega.

## Segurança e falhas

Dados privados — sessão, refresh token, perfil, pedidos e preço final — nunca serão cacheados como resposta Redis. Preço e disponibilidade serão recalculados no backend. Falha de Redis não bloqueia leitura pública nem autenticação, mas operações de pagamento exigem a proteção persistida no PostgreSQL e não podem gerar um novo pedido a partir de uma chave já gravada.

## Testes e aceite

Os módulos Redis serão testados com clientes falsos determinísticos para cache, TTL, rate limit, lock, resultado idempotente e falhas. Testes de rotas confirmarão `Retry-After`, cache de CEP, encaminhamento da chave de idempotência e retry sem criação duplicada. Testes Vitest do backend cobrirão índices/contratos do pedido e deduplicação do webhook. O aceite local requer Redis saudável no Docker Desktop, frontend e backend com todas as suítes verdes e uma validação manual de cache hit, rate limit e retry de checkout.
