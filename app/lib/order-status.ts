import type { OrderStatus } from "./checkout-contracts";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  expired: "Expirado",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-vh-warning/10 border-vh-warning/30 text-vh-warning",
  paid: "bg-vh-lime/10 border-vh-lime/30 text-vh-lime",
  expired: "bg-red-400/10 border-red-400/30 text-red-400",
  cancelled: "bg-red-400/10 border-red-400/30 text-red-400",
  failed: "bg-red-400/10 border-red-400/30 text-red-400",
};
