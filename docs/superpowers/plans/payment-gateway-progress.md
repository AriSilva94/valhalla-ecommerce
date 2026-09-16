# Progresso da integração de pagamentos

Atualizado em 2026-09-16. Trabalho na branch `feature/payment-gateway-decoupling`, nos worktrees `.worktrees/payment-gateway` dos dois repositórios. As alterações de implementação ainda não foram integradas à develop.

## Entregas

- [x] 1. Idempotência persistente — implementada e revisada; reconciliação manual documentada.
- [x] 2. PaymentGateway e PaymentService — contrato interno, service, factory e adapter Asaas implementados e testados.
- [ ] 3. Persistência neutra.
- [ ] 4. Webhooks normalizados e idempotentes.
- [ ] 5. Frontend e contratos neutros.
- [ ] 6. Adapter Deflow e validação da troca.

## Retomada da entrega 1

Os commits backend `9765a63` e `634d0a7` foram reprovados por dependência de Map local, sucesso com checkout incompleto e reexecução insegura após reinício. A correção remove a coordenação local: somente o vencedor da reserva única persistida executa o checkout. Concorrentes recebem 409; somente um resultado completo pode retornar sucesso.

O fingerprint compara o conteúdo canônico da solicitação original antes de consultar o catálogo. O preço da primeira operação permanece no snapshot. UUIDs são normalizados e a chave tem escopo por usuário.

Timeout externo não comprova falha da cobrança. Não reenviar automaticamente uma operação incerta. A referência interna permite investigação e reconciliação. A documentação Asaas consultada não confirma garantia de idempotência do POST /checkouts por header; não depender desse mecanismo.

## Decisão aprovada para Deflow

Em 2026-09-16, o usuário aprovou QR Pix e copia e cola no site, recebimento em DePix na Liquid e confirmação do pedido somente após a liquidação em DePix. O contrato neutro deverá representar checkout por URL ou QR Pix. Confirmação inicial de recebimento do Pix não basta para liberar o pedido.

## Documentos

- Design: `../specs/2026-09-15-payment-gateway-abstraction-design.md`.
- Plano: `2026-09-15-payment-gateway-abstraction.md`.
- Referência Deflow: repositório da API, `docs/integracoes/deflow-api.md` (resumo, não cópia integral).
- Asaas: https://docs.asaas.com/docs/introduction-1

## Revisões

Achado confirmado para a entrega 4: o webhook Asaas atual pode transformar `paid` em `expired` ou `cancelled` ao receber eventos posteriores. Corrigir com transições condicionais atômicas e testes de eventos fora de ordem. A proteção de reconciliação da entrega 1 não resolve esse fluxo separado.

Operação da idempotência: `docs/integracoes/checkout-idempotency.md` no repositório da API descreve respostas e limitações de reconciliação manual.

Após a correção: revisão de conformidade, depois revisão de qualidade. Contagens de testes anteriores são históricas; cada entrega registra a execução feita no respectivo worktree. Não confundir os testes das outras worktrees com a suíte da branch em revisão.
