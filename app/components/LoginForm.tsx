"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, UserPlus, MailWarning } from "lucide-react";
import { safeRedirect } from "@/app/lib/auth-redirect";
import AuthTextField from "./AuthTextField";
import PasswordField from "./PasswordField";
import AuthAlert from "./AuthAlert";
import GoogleGIcon from "./GoogleGIcon";

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
      className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2.5">
        <AuthTextField
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Seu e-mail"
          required
        />
        <PasswordField
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          required
        />
      </div>

      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink!"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Entrando..." : "Entrar"}
      </button>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      {errorCode === "EMAIL_NOT_CONFIRMED" && (
        <AuthAlert variant="info" icon={MailWarning}>
          {resendState === "sent" ? (
            <>Se {identifier} estiver cadastrado, um novo e-mail de confirmação foi enviado.</>
          ) : (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendState === "sending"}
              className="font-semibold underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0 text-inherit"
            >
              {resendState === "sending" ? "Enviando..." : "Reenviar e-mail de confirmação"}
            </button>
          )}
        </AuthAlert>
      )}

      <div className="flex items-center gap-3" role="presentation">
        <span className="h-px flex-1 bg-vh-border" />
        <span className="font-semibold text-vh-11 font-manrope text-vh-muted uppercase tracking-vh-003">
          ou
        </span>
        <span className="h-px flex-1 bg-vh-border" />
      </div>

      <a
        href={googleHref}
        className="flex items-center justify-center gap-2.5 border border-vh-border rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk text-white no-underline hover:border-vh-violet [transition:border-color_.15s]"
      >
        <GoogleGIcon />
        Entrar com Google
      </a>

      <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-vh-border">
        <a
          href="/esqueci-senha"
          className="flex items-center gap-1.5 font-semibold text-vh-12-5 font-manrope text-vh-accent no-underline"
        >
          <KeyRound aria-hidden="true" size={14} strokeWidth={2} />
          Esqueci minha senha
        </a>
        <a
          href="/cadastro"
          className="flex items-center gap-1.5 font-semibold text-vh-12-5 font-manrope text-vh-accent no-underline"
        >
          <UserPlus aria-hidden="true" size={14} strokeWidth={2} />
          Criar conta
        </a>
      </div>
    </form>
  );
}
