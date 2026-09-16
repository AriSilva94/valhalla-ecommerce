"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
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
