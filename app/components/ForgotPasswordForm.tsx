"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MailCheck, LogIn } from "lucide-react";
import AuthTextField from "./AuthTextField";
import AuthResultHeading from "./AuthResultHeading";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <AuthResultHeading icon={MailCheck} tone="success">
          Verifique seu e-mail
        </AuthResultHeading>
        <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
          Se {email} estiver cadastrado, você receberá um link para redefinir sua senha.
        </span>
      </div>
    );
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
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
      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink!"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Enviando..." : "Enviar link"}
      </button>

      <div className="flex items-center justify-center gap-1.5 pt-3.5 border-t border-vh-border">
        <Link
          href="/entrar"
          className="vh-lime flex items-center gap-1.5 font-semibold text-vh-12-5 font-manrope text-vh-accent no-underline [transition:color_.15s]"
        >
          <LogIn aria-hidden="true" size={14} strokeWidth={2} />
          Voltar para o login
        </Link>
      </div>
    </form>
  );
}
