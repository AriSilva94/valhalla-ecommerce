"use client";

import Link from "next/link";

export default function ProductError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section className="max-w-155 my-0 mx-auto py-22.5 px-6 w-full text-center">
      <h1 className="mt-3.5 mx-0 mb-2.5 font-bold text-vh-26 font-space-grotesk">Não conseguimos carregar este produto</h1>
      <p className="mt-0 mx-0 mb-6.5 font-medium text-vh-14/vh-17 font-manrope text-vh-muted">
        Tivemos um problema temporário para buscar essas informações. Tente novamente em instantes.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => unstable_retry()}
          className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.75 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="vh-wa-outline inline-flex items-center bg-transparent border border-vh-wa rounded-vh-11 py-3.5 px-6.5 font-bold text-vh-14 font-space-grotesk text-vh-wa!"
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
