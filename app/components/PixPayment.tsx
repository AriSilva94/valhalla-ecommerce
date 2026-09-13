"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
import type { Order } from "../lib/checkout-contracts";

const MAX_SANE_COUNTDOWN_SECONDS = 24 * 60 * 60; // Pix QR codes expire within hours, never days.

function formatCountdown(isoString: string): { label: string; urgent: boolean } | null {
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  if (totalSeconds > MAX_SANE_COUNTDOWN_SECONDS) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { label: `${minutes}:${String(seconds).padStart(2, "0")}`, urgent: totalSeconds < 120 };
}

function StatusResult({
  icon: Icon,
  tone,
  title,
  message,
  action,
}: {
  icon: typeof CheckCircle2;
  tone: "success" | "error";
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const toneClass = tone === "success"
    ? { ring: "border-vh-lime/40", icon: "text-vh-lime" }
    : { ring: "border-red-400/40", icon: "text-red-400" };

  return (
    <div className="text-center py-6 flex flex-col items-center">
      <span className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-vh-deep border ${toneClass.ring}`}>
        <Icon aria-hidden="true" size={26} strokeWidth={1.75} className={toneClass.icon} />
      </span>
      <h2 className="mt-0 mx-0 mb-2 font-bold text-vh-20 font-space-grotesk">{title}</h2>
      <p className="mt-0 mx-0 mb-5 font-medium text-vh-14 font-manrope text-vh-muted max-w-85">{message}</p>
      {action}
    </div>
  );
}

export default function PixPayment({ order, onPaid }: { order: Order; onPaid?: () => void }) {
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
      onPaid?.();
    }
  }, [status, onPaid]);

  if (status === "expired") {
    return (
      <StatusResult
        icon={XCircle}
        tone="error"
        title="Pix expirado"
        message="O tempo para pagamento acabou. Volte ao carrinho para gerar um novo pedido."
        action={
          <a
            href="/lista"
            className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.5 px-6 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink! [transition:background_.15s]"
          >
            Voltar ao carrinho
          </a>
        }
      />
    );
  }

  if (status === "failed") {
    return (
      <StatusResult
        icon={XCircle}
        tone="error"
        title="Não foi possível gerar o Pix"
        message="Tente novamente em instantes. Se o problema persistir, fale com nosso suporte."
      />
    );
  }

  if (status === "paid") {
    return (
      <StatusResult
        icon={CheckCircle2}
        tone="success"
        title="Pagamento confirmado!"
        message="Seu pedido foi recebido e está sendo processado."
      />
    );
  }

  const countdown = order.pixExpiration ? formatCountdown(order.pixExpiration) : null;

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      {order.pixQrCodeImage && (
        <div className="p-3.5 bg-white rounded-2xl border border-vh-border shadow-[0_12px_32px_-8px_rgba(0,0,0,0.4)]">
          <img
            src={`data:image/png;base64,${order.pixQrCodeImage}`}
            alt="QR code Pix"
            className="w-52 h-52 block"
          />
        </div>
      )}

      {order.pixCopyPaste && (
        <button
          type="button"
          className="vh-ghost-violet flex items-center gap-2 bg-transparent border border-vh-violet rounded-vh-10 py-2.75 px-5 font-semibold text-vh-13 font-space-grotesk cursor-pointer text-white [transition:background_.15s]"
          onClick={async () => {
            await navigator.clipboard.writeText(order.pixCopyPaste!);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? (
            <Check aria-hidden="true" size={15} strokeWidth={2.25} className="text-vh-lime" />
          ) : (
            <Copy aria-hidden="true" size={15} strokeWidth={2.25} />
          )}
          {copied ? "Código copiado!" : "Copiar código Pix"}
        </button>
      )}

      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-vh-warning opacity-60 [animation:vh-glow_1.6s_ease-in-out_infinite]" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-vh-warning" />
        </span>
        <p className="m-0 font-medium text-vh-12 font-manrope text-vh-muted">
          Aguardando confirmação do pagamento...
        </p>
      </div>

      {countdown && (
        <span
          className={`flex items-center gap-1.5 rounded-vh-9 border py-1.5 px-3 font-bold text-vh-11-5 font-space-grotesk tabular-nums ${
            countdown.urgent
              ? "border-red-400/40 text-red-400 bg-red-400/10"
              : "border-vh-border text-vh-muted bg-vh-card"
          }`}
        >
          <Clock aria-hidden="true" size={12} strokeWidth={2.25} />
          Expira em {countdown.label}
        </span>
      )}
    </div>
  );
}
