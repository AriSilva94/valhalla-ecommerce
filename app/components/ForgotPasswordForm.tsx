"use client";

import { useState } from "react";

// The /api/auth/forgot-password route always returns { ok: true } to avoid
// revealing whether an email exists. The form mirrors that neutrality:
// once the request completes (success or network error), it shows the same
// generic message — it never branches on the response body's content.
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
      <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3">
        <span className="font-bold text-vh-15 font-space-grotesk">Verifique seu e-mail</span>
        <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
          Se {email} estiver cadastrado, você receberá um link para redefinir sua senha.
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
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
        required
      />
      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Enviando..." : "Enviar link"}
      </button>
    </form>
  );
}
