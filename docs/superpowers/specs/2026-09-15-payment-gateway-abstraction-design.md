# Abstração de Gateway de Pagamento — Design

## Objetivo

Preparar o checkout para trocar o Asaas pelo Deflow sem alterar as regras de pedido, os endpoints públicos do frontend ou os componentes da experiência de compra.

Como a integração ainda não chegou à produção, a evolução poderá substituir o schema atual específico do Asaas e reiniciar os dados de pagamento sem necessidade de compatibilidade com pedidos históricos.

## Arquitetura

O pedido continuará sendo responsabilidade do domínio de pedidos. O pagamento será uma dependência atrás de uma porta `PaymentGateway`, implementada inicialmente por `AsaasGateway` e futuramente por `DeflowGateway`.

```text
Frontend
   ↓ contratos neutros
Next.js BFF
   ↓ API interna
Strapi OrderController
   ↓ regras e orquestração
PaymentService → PaymentGateway
                       ├── AsaasGateway
                       └── DeflowGateway
```

O controller não conhecerá payloads, headers, eventos, IDs ou códigos de erro específicos de um provedor. O adapter será responsável por traduzir entre o contrato interno e a API externa.

## Contrato interno do pagamento

O contrato deverá representar apenas capacidades necessárias ao negócio:

- criação ou recuperação de cliente;
- criação de checkout hospedado;
- URL de checkout;
- identificação externa do cliente, checkout e pagamento;
- conversão de webhook externo para evento interno;
- simulação de confirmação somente em ambiente de sandbox.

Os eventos internos deverão usar estados do pedido (`paid`, `expired`, `cancelled`) e não nomes de eventos do provedor.

## Persistência

O schema do pedido usará nomes neutros, como `paymentProvider`, `providerCustomerId`, `providerCheckoutId`, `providerPaymentId` e `paymentUrl`. O perfil do cliente usará `paymentProviderCustomerId` somente se a arquitetura confirmar que o vínculo persistido no perfil é necessário.

Como não há produção, os campos Asaas atuais poderão ser removidos em uma migration limpa. A referência pública do pedido continuará opaca e única.

## Idempotência

O backend deverá ler a chave `Idempotency-Key` recebida pelo BFF, validar seu formato e persistir a associação entre usuário e tentativa de checkout no PostgreSQL.

Uma mesma chave deverá retornar o resultado já criado. Solicitações concorrentes para a mesma chave deverão receber conflito ou aguardar o resultado, sem criar pedido ou checkout duplicado. Redis poderá acelerar locks e resultados, mas nunca será a única garantia.

O adapter também deverá encaminhar a chave ao provedor quando a API suportar idempotência.

## Webhooks

Cada provedor poderá ter uma rota de entrada própria para autenticação e parsing, mas o processamento deverá chamar um serviço interno comum:

```text
/webhooks/asaas → AsaasGateway.parseWebhook → PaymentService.applyEvent
/webhooks/deflow → DeflowGateway.parseWebhook → PaymentService.applyEvent
```

O evento deverá ser autenticado, validado, deduplicado e aplicado de forma idempotente. Eventos desconhecidos ou inválidos não poderão alterar pedidos.

## Frontend

O BFF continuará expondo `checkoutUrl` e status neutros. Textos, mensagens de erro e política de privacidade não deverão mencionar o provedor ativo. A UI continuará exibindo o método de pagamento escolhido, como Pix, sem depender da marca do gateway.

## Entregas

1. Persistir idempotência no backend e impedir pedidos duplicados.
2. Criar `PaymentGateway` e mover a orquestração para `PaymentService`.
3. Substituir campos Asaas por campos genéricos no schema e na serialização.
4. Normalizar webhooks e adicionar deduplicação persistente.
5. Remover referências do Asaas da UI, contratos e documentação pública.
6. Implementar `DeflowGateway` e validar a troca por configuração/testes.

## Critérios de aceite

- Nenhum controller de pedido importa funções específicas de Asaas ou Deflow.
- A troca do adapter não exige mudanças no frontend.
- Uma repetição ou concorrência com a mesma chave não cria duplicidade.
- Webhooks repetidos não reprocessam incorretamente o pedido.
- Campos persistidos e erros públicos não carregam nomes de provedores.
- Os testes unitários e de integração cobrem os fluxos de sucesso, falha, retry, concorrência e webhook.
