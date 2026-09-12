import { handleConfirmEmail } from "../../lib/auth-handlers";
import * as strapiClient from "../../lib/auth-strapi-client";

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

  let confirmed = false;
  if (confirmation) {
    const result = await handleConfirmEmail(confirmation, strapiClient);
    confirmed = result.ok;
  }

  return (
    <section className="max-w-125 my-0 mx-auto py-12 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-34 font-space-grotesk">
        {confirmed ? "E-mail confirmado" : "Não foi possível confirmar"}
      </h1>
      <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3">
        {confirmed ? (
          <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
            Sua conta foi confirmada. Você já pode{" "}
            <a href="/entrar" className="text-vh-accent">
              entrar
            </a>
            .
          </span>
        ) : (
          <span className="font-semibold text-vh-13-5 font-manrope text-red-400">
            O link de confirmação é inválido ou expirou. Solicite um novo e-mail de confirmação.
          </span>
        )}
      </div>
    </section>
  );
}
