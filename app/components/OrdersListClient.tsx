"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt } from "../lib/wa";
import type { Order, OrderStatus } from "../lib/checkout-contracts";
import Breadcrumb from "./Breadcrumb";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  expired: "Expirado",
  cancelled: "Cancelado",
  failed: "Falhou",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "text-vh-muted",
  paid: "text-vh-lime",
  expired: "text-red-400",
  cancelled: "text-red-400",
  failed: "text-red-400",
};

export default function OrdersListClient() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => setOrders(body?.ok ? body.data : []));
  }, []);

  return (
    <section className="max-w-215 my-0 mx-auto py-10 px-6 w-full">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Meus pedidos" }]} />
      <h1 className="mt-0 mx-0 mb-6.5 font-bold text-vh-34 font-space-grotesk">Meus pedidos</h1>
      {orders === null && <p className="font-medium text-vh-14 font-manrope text-vh-muted">Carregando...</p>}
      {orders?.length === 0 && (
        <p className="font-medium text-vh-14 font-manrope text-vh-muted">Você ainda não fez nenhum pedido.</p>
      )}
      <div className="flex flex-col gap-3">
        {orders?.map((order) => (
          <Link
            key={order.id}
            href={`/pedidos/${order.id}`}
            className="flex justify-between items-center gap-4 bg-vh-card border border-vh-border rounded-vh-14 p-4 flex-wrap"
          >
            <div className="flex flex-col gap-1">
              <span className="font-bold text-vh-14-5 font-space-grotesk">Pedido #{order.id}</span>
              <span className="font-medium text-vh-12 font-manrope text-vh-muted">
                {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <span className={`font-bold text-vh-13 font-space-grotesk ${STATUS_COLOR[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
            <span className="font-bold text-vh-16 font-space-grotesk text-vh-lime">{fmt(order.totalAmount)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
