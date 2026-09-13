import { CheckCircle2, XCircle, MailQuestion } from "lucide-react";
import Link from "next/link";
import { handleConfirmEmail } from "../../lib/auth-handlers";
import * as strapiClient from "../../lib/auth-strapi-client";
import AuthPageHeader from "../../components/AuthPageHeader";
import AuthShell from "../../components/AuthShell";

export const metadata = {
  title: "E-mail confirmado",
};

// This exact path (`/auth/email-confirmed`) matches the backend's
// buildAdvancedSettings/buildEmailTemplates `email_confirmation_redirection`
// and email action URL (src/auth/config.ts) — not a free choice.
//
// Per especificacao.md flow #2 ("o link chega ao frontend; o BFF encaminha
// a confirmação ao Strapi sem expor o token"), this page does the
// confirmation itself: it reads the `confirmation` token from the query
// string, forwards it to Strapi server-side (never to the browser), and
// renders success/error based on that result.
export default async function EmailConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const { confirmation } = await searchParams;

  // Three distinct states: no `confirmation` param at all (someone hit
  // this URL directly, not via the confirmation email — a different
  // situation from a bad/expired code and worth a distinct message),
  // present-and-valid, and present-and-invalid.
  let state: "missing" | "confirmed" | "invalid" = "missing";
  if (confirmation) {
    const result = await handleConfirmEmail(confirmation, strapiClient);
    state = result.ok ? "confirmed" : "invalid";
  }

  const header =
    state === "confirmed"
      ? { icon: CheckCircle2, title: "E-mail confirmado", tone: "success" as const }
      : state === "invalid"
        ? { icon: XCircle, title: "Não foi possível confirmar", tone: "error" as const }
        : { icon: MailQuestion, title: "Nenhum código de confirmação informado", tone: "neutral" as const };

  return (
    <AuthShell>
      <AuthPageHeader icon={header.icon} title={header.title} tone={header.tone} />
      <div className="flex flex-col gap-3">
        {state === "confirmed" && (
          <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
            Sua conta foi confirmada. Você já pode{" "}
            <Link href="/entrar" className="vh-lime text-vh-accent [transition:color_.15s]">
              entrar
            </Link>
            .
          </span>
        )}
        {state === "invalid" && (
          <>
            <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
              O link de confirmação é inválido ou expirou. Solicite um novo e-mail de confirmação
              tentando entrar novamente.
            </span>
            <Link
              href="/entrar"
              className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink! text-center no-underline"
            >
              Ir para o login
            </Link>
          </>
        )}
        {state === "missing" && (
          <>
            <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
              Esta página só funciona a partir do link enviado por e-mail. Se você ainda não
              recebeu um, solicite um novo e-mail de confirmação tentando entrar.
            </span>
            <Link
              href="/entrar"
              className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink! text-center no-underline"
            >
              Ir para o login
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
