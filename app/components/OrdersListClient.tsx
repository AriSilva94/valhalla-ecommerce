"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import PixIcon from "./PixIcon";
import { fmt } from "../lib/wa";
import type { Order, OrderStatus } from "../lib/checkout-contracts";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../lib/order-status";
import Breadcrumb from "./Breadcrumb";

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-vh-9 border py-1 px-2.5 font-bold text-vh-11-5 font-space-grotesk whitespace-nowrap ${ORDER_STATUS_TONE[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse h-19 bg-vh-card border border-vh-border rounded-vh-14" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-17.5 px-6 bg-vh-card border border-dashed border-vh-border rounded-2xl">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-vh-deep border border-vh-border mb-3.5">
        <Receipt aria-hidden="true" size={22} strokeWidth={1.75} className="text-vh-muted" />
      </span>
      <h3 className="mt-0 mx-0 mb-2 font-bold text-vh-20 font-space-grotesk">Você ainda não fez nenhum pedido</h3>
      <p className="mt-0 mx-0 mb-5 font-medium text-vh-14 font-manrope text-vh-muted">Explore o catálogo e finalize sua primeira compra com Pix.</p>
      <Link className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 py-3.5 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!" href="/">
        Explorar produtos
      </Link>
    </div>
  );
}

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

      {orders === null && <ListSkeleton />}
      {orders?.length === 0 && <EmptyState />}

      {orders && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.reference}
              href={`/pedidos/${order.reference}`}
              className="vh-cardprod flex items-center gap-4 bg-vh-card border border-vh-border rounded-vh-14 p-4.5 [transition:transform_.15s,border-color_.15s,box-shadow_.15s]"
            >
              <span
                title="Pix"
                className="hidden sm:flex h-10.5 w-10.5 flex-none items-center justify-center rounded-full bg-vh-deep border border-vh-border"
              >
                <PixIcon size={17} className="text-vh-accent" />
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="font-bold text-vh-14-5 font-space-grotesk">Pedido #{order.reference}</span>
                <span className="flex items-center gap-1.5 font-medium text-vh-12 font-manrope text-vh-muted">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  <span aria-hidden="true" className="sm:hidden">· Pix</span>
                </span>
              </div>
              <StatusBadge status={order.status} />
              <span className="font-bold text-vh-16 font-space-grotesk text-vh-lime whitespace-nowrap">{fmt(order.totalAmount)}</span>
              <ChevronRight aria-hidden="true" size={18} strokeWidth={2} className="hidden sm:block text-vh-muted shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
