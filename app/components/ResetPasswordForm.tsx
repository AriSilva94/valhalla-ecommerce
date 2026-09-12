"use client";

import { useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_ORIGIN: "Não foi possível processar o pedido. Recarregue a página.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  VALIDATION_ERROR: "Verifique a nova senha (mínimo 8 caracteres e confirmação igual).",
  UPSTREAM_ERROR: "Não foi possível redefinir a senha. O link pode ter expirado.",
};

export default function ResetPasswordForm({ code }: { code: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password, passwordConfirmation: confirmation }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(ERROR_MESSAGES[body.error] ?? ERROR_MESSAGES.UPSTREAM_ERROR);
        return;
      }
      setSuccess(true);
    } catch {
      setError(ERROR_MESSAGES.UPSTREAM_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3">
        <span className="font-bold text-vh-15 font-space-grotesk">Senha redefinida</span>
        <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
          Sua senha foi alterada. <a href="/entrar" className="text-vh-accent">Entrar agora</a>.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3"
    >
      <input
        className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 px-3.75 text-white font-medium text-vh-13-5 font-manrope outline-none"
        type="password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nova senha"
        required
      />
      <input
        className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 px-3.75 text-white font-medium text-vh-13-5 font-manrope outline-none"
        type="password"
        name="passwordConfirmation"
        autoComplete="new-password"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder="Confirme a nova senha"
        required
      />
      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Salvando..." : "Redefinir senha"}
      </button>
      {error && (
        <span className="font-semibold text-vh-12-5 font-manrope text-red-400">{error}</span>
      )}
    </form>
  );
}
