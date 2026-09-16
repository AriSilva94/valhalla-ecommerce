# Progresso da integração de pagamentos

Atualizado em 2026-09-16. Trabalho na branch `feature/payment-gateway-decoupling`, nos worktrees `.worktrees/payment-gateway` dos dois repositórios. As alterações de implementação ainda não foram integradas à develop.

## Entregas

- [ ] 1. Idempotência persistente — em correção após revisão independente.
- [ ] 2. PaymentGateway e PaymentService.
- [ ] 3. Persistência neutra.
- [ ] 4. Webhooks normalizados e idempotentes.
- [ ] 5. Frontend e contratos neutros.
- [ ] 6. Adapter Deflow e validação da troca.

## Retomada da entrega 1

Os commits backend `9765a63` e `634d0a7` foram reprovados por dependência de Map local, sucesso com checkout incompleto e reexecução insegura após reinício. A correção remove a coordenação local: somente o vencedor da reserva única persistida executa o checkout. Concorrentes recebem 409; somente um resultado completo pode retornar sucesso.

O fingerprint compara o conteúdo canônico da solicitação original antes de consultar o catálogo. O preço da primeira operação permanece no snapshot. UUIDs são normalizados e a chave tem escopo por usuário.

Timeout externo não comprova falha da cobrança. Não reenviar automaticamente uma operação incerta. A referência interna permite investigação e reconciliação. A documentação Asaas consultada não confirma garantia de idempotência do POST /checkouts por header; não depender desse mecanismo.

## Decisão pendente para Deflow

A referência consultada descreve cobrança avulsa com QR Pix e liquidação em DePix na Liquid. Isso difere do checkout hospedado previsto inicialmente. Confirmar experiência com QR no site e momento de confirmação do pedido antes de implementar essa mudança. A abstração e a idempotência podem avançar independentemente.

## Documentos

- Design: `../specs/2026-09-15-payment-gateway-abstraction-design.md`.
- Plano: `2026-09-15-payment-gateway-abstraction.md`.
- Referência Deflow: repositório da API, `docs/integracoes/deflow-api.md` (resumo, não cópia integral).
- Asaas: https://docs.asaas.com/docs/introduction-1

## Revisões

Após a correção: revisão de conformidade, depois revisão de qualidade. Contagens de testes anteriores são históricas; cada entrega registra a execução feita no respectivo worktree. Não confundir os testes das outras worktrees com a suíte da branch em revisão.
