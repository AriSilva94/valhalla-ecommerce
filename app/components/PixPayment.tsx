"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "../lib/checkout-contracts";
import { useCart } from "./CartProvider";

export default function PixPayment({ order }: { order: Order }) {
  const router = useRouter();
  const { clear } = useCart();
  const [status, setStatus] = useState(order.status);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      if (body?.ok) setStatus(body.data.status);
    }, 5000);
    return () => clearInterval(interval);
  }, [status, order.id]);

  useEffect(() => {
    if (status === "paid") {
      clear();
      router.push(`/pedidos/${order.id}`);
    }
  }, [status, clear, router, order.id]);

  if (status === "expired") {
    return (
      <div className="text-center py-10">
        <h2 className="font-bold text-vh-20 font-space-grotesk mb-2">Pix expirado</h2>
        <p className="font-medium text-vh-14 font-manrope text-vh-muted mb-5">
          O tempo para pagamento acabou. Volte ao carrinho para gerar um novo pedido.
        </p>
        <a href="/lista" className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.5 px-6 font-bold text-vh-14 font-space-grotesk text-vh-ink!">
          Voltar ao carrinho
        </a>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="text-center py-10">
        <h2 className="font-bold text-vh-20 font-space-grotesk mb-2">Não foi possível gerar o Pix</h2>
        <p className="font-medium text-vh-14 font-manrope text-vh-muted">Tente novamente em instantes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {order.pixQrCodeImage && (
        <img
          src={`data:image/png;base64,${order.pixQrCodeImage}`}
          alt="QR code Pix"
          className="w-56 h-56 rounded-xl border border-vh-border"
        />
      )}
      {order.pixCopyPaste && (
        <button
          type="button"
          className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 py-3 px-5 font-bold text-vh-13 font-space-grotesk text-vh-ink!"
          onClick={async () => {
            await navigator.clipboard.writeText(order.pixCopyPaste!);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copiado!" : "Copiar código Pix"}
        </button>
      )}
      <p className="font-medium text-vh-12 font-manrope text-vh-muted text-center">
        Aguardando confirmação do pagamento...
      </p>
    </div>
  );
}
