"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeRedirect } from "@/app/lib/auth-redirect";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  EMAIL_NOT_CONFIRMED:
    "Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada ou solicite um novo link abaixo.",
  INVALID_ORIGIN: "Não foi possível processar o login. Recarregue a página.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  VALIDATION_ERROR: "Preencha e-mail e senha corretamente.",
  UPSTREAM_ERROR: "Não foi possível entrar agora. Tente novamente em instantes.",
  UNAUTHENTICATED: "Sessão expirada. Entre novamente.",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeRedirect(searchParams.get("returnTo"), "/");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setResendState("idle");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(ERROR_MESSAGES[body.error] ?? ERROR_MESSAGES.UPSTREAM_ERROR);
        setErrorCode(body.error ?? null);
        return;
      }
      router.push(returnTo);
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.UPSTREAM_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  // Minimal resend-confirmation action, adapted from ForgotPasswordForm's
  // pattern: no separate screen, just an inline call to the existing
  // /api/auth/resend-confirmation route (neutral response either way) that
  // becomes available once EMAIL_NOT_CONFIRMED is the current error.
  async function handleResendConfirmation() {
    setResendState("sending");
    try {
      await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });
    } finally {
      setResendState("sent");
    }
  }

  const googleHref = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3"
    >
      <input
        className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 px-3.75 text-white font-medium text-vh-13-5 font-manrope outline-none"
        type="email"
        name="email"
        autoComplete="email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Seu e-mail"
        required
      />
      <input
        className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 px-3.75 text-white font-medium text-vh-13-5 font-manrope outline-none"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Sua senha"
        required
      />
      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Entrando..." : "Entrar"}
      </button>
      {error && (
        <span className="font-semibold text-vh-12-5 font-manrope text-red-400">{error}</span>
      )}
      {errorCode === "EMAIL_NOT_CONFIRMED" &&
        (resendState === "sent" ? (
          <span className="font-medium text-vh-12-5 font-manrope text-vh-muted">
            Se {identifier} estiver cadastrado, um novo e-mail de confirmação foi enviado.
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendState === "sending"}
            className="font-semibold text-vh-12-5 font-manrope text-vh-accent bg-transparent border-0 p-0 cursor-pointer text-left underline"
          >
            {resendState === "sending" ? "Enviando..." : "Reenviar e-mail de confirmação"}
          </button>
        ))}
      <a
        href={googleHref}
        className="flex items-center justify-center gap-2 border border-vh-border rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk text-white no-underline"
      >
        Entrar com Google
      </a>
      <div className="flex items-center justify-between gap-3">
        <a href="/esqueci-senha" className="font-semibold text-vh-12-5 font-manrope text-vh-accent no-underline">
          Esqueci minha senha
        </a>
        <a href="/cadastro" className="font-semibold text-vh-12-5 font-manrope text-vh-accent no-underline">
          Criar conta
        </a>
      </div>
    </form>
  );
}
