"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Mail, CheckCircle2, LogIn } from "lucide-react";
import AuthTextField from "./AuthTextField";
import PasswordField from "./PasswordField";
import AuthAlert from "./AuthAlert";
import AuthResultHeading from "./AuthResultHeading";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Não foi possível criar sua conta.",
  INVALID_ORIGIN: "Não foi possível processar o cadastro. Recarregue a página.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  VALIDATION_ERROR: "Verifique usuário, e-mail e senha (mínimo 8 caracteres).",
  UPSTREAM_ERROR: "Não foi possível criar a conta agora. Tente novamente em instantes.",
};

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(ERROR_MESSAGES[body.error] ?? ERROR_MESSAGES.UPSTREAM_ERROR);
        return;
      }
      // Registration succeeds but confirmation is required before login —
      // no auto-login here per spec.
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
          Verifique seu e-mail
        </AuthResultHeading>
        <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
          Enviamos um link de confirmação para {email}. Confirme seu e-mail para poder entrar.
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
        <AuthTextField
          icon={User}
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Seu usuário"
          required
        />
        <AuthTextField
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          required
        />
        <PasswordField
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha (mínimo 8 caracteres)"
          required
        />
        <PasswordField
          name="passwordConfirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Confirme a senha"
          required
        />
      </div>

      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink!"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Criando conta..." : "Criar conta"}
      </button>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <div className="flex items-center justify-center gap-1.5 pt-3.5 border-t border-vh-border">
        <span className="font-medium text-vh-12-5 font-manrope text-vh-muted">Já tem conta?</span>
        <Link
          href="/entrar"
          className="flex items-center gap-1.5 font-semibold text-vh-12-5 font-manrope text-vh-accent no-underline hover:text-vh-lime [transition:color_.15s]"
        >
          <LogIn aria-hidden="true" size={14} strokeWidth={2} />
          Entrar
        </Link>
      </div>
    </form>
  );
}
