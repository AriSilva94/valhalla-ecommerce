"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FlaskConical, Loader2, PackageSearch } from "lucide-react";
import PixIcon from "./PixIcon";
import { fmt, formatVariantMeta } from "../lib/wa";
import type { Order } from "../lib/checkout-contracts";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "../lib/order-status";
import Breadcrumb from "./Breadcrumb";

const IS_DEV_OR_SANDBOX = process.env.NEXT_PUBLIC_APP_ENV !== "production";

function DetailSkeleton() {
  return (
    <section className="max-w-215 my-0 mx-auto py-10 px-6 w-full">
      <div className="animate-pulse flex flex-col gap-3">
        <div className="h-4 w-40 rounded bg-vh-deep mb-2" />
        <div className="h-8 w-56 rounded bg-vh-deep mb-6" />
        <div className="max-w-155 h-44 rounded-2xl bg-vh-card border border-vh-border" />
      </div>
    </section>
  );
}

export default function OrderDetailClient({ reference }: { reference: string }) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [simulating, setSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${reference}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => setOrder(body?.ok ? body.data : null));
  }, [reference]);

  useEffect(() => {
    if (order?.status !== "pending") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${reference}`, { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.ok) setOrder(body.data);
    }, 4000);
    return () => clearInterval(interval);
  }, [order?.status, reference]);

  async function simulatePayment() {
    setSimulating(true);
    setSimulateError("");
    const res = await fetch(`/api/orders/${reference}/simulate-payment`, { method: "POST" });
    const body = await res.json();
    setSimulating(false);
    if (!body.ok) {
      setSimulateError("Não foi possível simular o pagamento. Talvez a cobrança Pix ainda não tenha sido gerada.");
    }
  }

  if (order === undefined) return <DetailSkeleton />;

  if (order === null) {
    return (
      <section className="max-w-215 my-0 mx-auto py-16 px-6 w-full text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-vh-deep border border-vh-border mb-3.5">
          <PackageSearch aria-hidden="true" size={22} strokeWidth={1.75} className="text-vh-muted" />
        </span>
        <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-20 font-space-grotesk">Pedido não encontrado</h1>
        <p className="mt-0 mx-0 font-medium text-vh-14 font-manrope text-vh-muted">Confira o link ou volte para a lista de pedidos.</p>
      </section>
    );
  }

  return (
    <section className="max-w-215 my-0 mx-auto py-10 px-6 w-full">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Meus pedidos", href: "/pedidos" }, { label: `#${order.reference}` }]} />

      <div className="flex items-center gap-3 flex-wrap mb-1.5">
        <h1 className="m-0 font-bold text-vh-24 font-space-grotesk">Pedido #{order.reference}</h1>
        <span className={`inline-flex items-center rounded-vh-9 border py-1.25 px-3 font-bold text-vh-12 font-space-grotesk whitespace-nowrap ${ORDER_STATUS_TONE[order.status]}`}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>
      <p className="mt-0 mx-0 mb-6 flex items-center gap-1.5 font-medium text-vh-12 font-manrope text-vh-muted">
        Realizado em {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        <span aria-hidden="true">·</span>
        <PixIcon size={12} className="shrink-0" />
        Pix
      </p>

      <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3 mb-5">
        {order.items.map((it, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-12.5 h-12.5 flex-none relative overflow-hidden bg-[repeating-linear-gradient(45deg,#2A0A45_0_8px,#24063C_8px_16px)] border border-vh-border rounded-vh-9">
              {it.productImageUrl && (
                <Image src={it.productImageUrl} alt={it.productName} fill sizes="50px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="font-semibold text-vh-13 font-manrope truncate">{it.qty}× {it.productName}</span>
              <span className="font-medium text-vh-11-5 font-manrope text-vh-muted truncate">{formatVariantMeta(it.configLabel, it.colorName)}</span>
            </div>
            <span className="font-bold text-vh-14 font-space-grotesk text-vh-lime whitespace-nowrap">{fmt(it.unitPrice * it.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 border-t border-t-vh-panel">
          <span className="font-bold text-vh-14 font-space-grotesk">Total</span>
          <span className="font-bold text-vh-20 font-space-grotesk text-vh-lime">{fmt(order.totalAmount)}</span>
        </div>
      </div>

      {order.status === "pending" && order.checkoutUrl && (
        <div className="bg-vh-bg border border-vh-border rounded-2xl p-5 flex flex-col items-center gap-3">
          <p className="m-0 font-medium text-vh-13 font-manrope text-vh-muted text-center">
            Pagamento ainda não concluído.
          </p>
          <a
            href={order.checkoutUrl}
            className="vh-btn-lime flex items-center gap-2 bg-vh-lime border-0 rounded-vh-11 py-3 px-6 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink! [transition:background_.15s]"
          >
            Continuar pagamento
            <PixIcon size={16} />
          </a>

          {IS_DEV_OR_SANDBOX && (
            <div className="flex flex-col items-center gap-2 mt-1 pt-5 border-t border-dashed border-vh-border w-full">
              <button
                type="button"
                disabled={simulating}
                className="flex items-center gap-2 bg-transparent border border-dashed border-vh-warning/50 rounded-vh-10 py-2.25 px-4 font-semibold text-vh-12 font-space-grotesk cursor-pointer text-vh-warning disabled:opacity-60 [transition:background_.15s]"
                onClick={simulatePayment}
              >
                {simulating ? (
                  <Loader2 aria-hidden="true" size={14} className="animate-spin" />
                ) : (
                  <FlaskConical aria-hidden="true" size={14} strokeWidth={2} />
                )}
                {simulating ? "Simulando..." : "Simular pagamento (sandbox)"}
              </button>
              {simulateError && (
                <p className="m-0 font-medium text-vh-11-5 font-manrope text-red-400">{simulateError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
