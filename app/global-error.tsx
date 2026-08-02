"use client";

import "./globals.css";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <section className="max-w-155 my-0 mx-auto py-22.5 px-6 w-full text-center">
          <h1 className="mt-3.5 mx-0 mb-2.5 font-bold text-vh-26 font-space-grotesk">O site está temporariamente indisponível</h1>
          <p className="mt-0 mx-0 mb-6.5 font-medium text-vh-14/vh-17 font-manrope text-vh-muted">
            Estamos com um problema técnico. Tente novamente em instantes.
          </p>
          <button
            onClick={() => unstable_retry()}
            className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.75 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
          >
            Tentar novamente
          </button>
        </section>
      </body>
    </html>
  );
}
