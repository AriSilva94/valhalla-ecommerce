"use client";

import { useEffect, useState } from "react";
import { fmt } from "../lib/wa";
import type { Order } from "../lib/checkout-contracts";
import Breadcrumb from "./Breadcrumb";
import PixPayment from "./PixPayment";

export default function OrderDetailClient({ id }: { id: number }) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/orders/${id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => setOrder(body?.ok ? body.data : null));
  }, [id]);

  if (order === undefined) return null;
  if (order === null) {
    return (
      <section className="max-w-155 my-0 mx-auto py-10 px-6 w-full text-center">
        <p className="font-medium text-vh-14 font-manrope text-vh-muted">Pedido não encontrado.</p>
      </section>
    );
  }

  return (
    <section className="max-w-155 my-0 mx-auto py-10 px-6 w-full">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Meus pedidos", href: "/pedidos" }, { label: `#${order.id}` }]} />
      <h1 className="mt-0 mx-0 mb-6 font-bold text-vh-24 font-space-grotesk">Pedido #{order.id}</h1>
      <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3 mb-5">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between gap-3">
            <span className="font-semibold text-vh-13 font-manrope">{it.qty}× {it.productName}</span>
            <span className="font-bold text-vh-14 font-space-grotesk text-vh-lime">{fmt(it.unitPrice * it.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 border-t border-t-vh-panel">
          <span className="font-bold text-vh-14 font-space-grotesk">Total</span>
          <span className="font-bold text-vh-20 font-space-grotesk text-vh-lime">{fmt(order.totalAmount)}</span>
        </div>
      </div>
      {order.status === "pending" && <PixPayment order={order} />}
    </section>
  );
}
