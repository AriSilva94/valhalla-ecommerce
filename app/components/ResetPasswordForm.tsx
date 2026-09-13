"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import PasswordField from "./PasswordField";
import AuthAlert from "./AuthAlert";
import AuthResultHeading from "./AuthResultHeading";

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
      <div className="flex flex-col gap-3">
        <AuthResultHeading icon={CheckCircle2} tone="success">
          Senha redefinida
        </AuthResultHeading>
        <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
          Sua senha foi alterada.{" "}
          <a href="/entrar" className="text-vh-accent">
            Entrar agora
          </a>
          .
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2.5">
        <PasswordField
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nova senha"
          required
        />
        <PasswordField
          name="passwordConfirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Confirme a nova senha"
          required
        />
      </div>

      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink!"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Salvando..." : "Redefinir senha"}
      </button>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}
    </form>
  );
}
