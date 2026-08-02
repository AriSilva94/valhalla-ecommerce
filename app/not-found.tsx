import Link from "next/link";
import { getSiteSettings } from "./lib/strapi";
import { waUrl } from "./lib/wa";

export default async function NotFound() {
  const settings = await getSiteSettings();
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section className="max-w-155 my-0 mx-auto py-22.5 px-6 w-full text-center">
      <span
        className="font-bold text-[clamp(80px,14vw,120px)]/[1] font-space-grotesk bg-[linear-gradient(120deg,#8B2CF5,#B056FF)] bg-clip-text text-transparent"
      >
        404
      </span>
      <h1 className="mt-3.5 mx-0 mb-2.5 font-bold text-vh-26 font-space-grotesk">Essa página se perdeu no Valhalla</h1>
      <p className="mt-0 mx-0 mb-6.5 font-medium text-vh-14/vh-17 font-manrope text-vh-muted">
        O endereço não existe ou o produto saiu do catálogo. Bora voltar para as ofertas?
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href="/"
          className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.75 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer no-underline inline-block text-vh-ink!"
        >
          Voltar ao início
        </Link>
        <a
          className="vh-wa-outline inline-flex items-center bg-transparent border border-vh-wa rounded-vh-11 py-3.5 px-6.5 font-bold text-vh-14 font-space-grotesk text-vh-wa!"
          href={waDirectUrl}
          target="_blank"
        >
          Falar com atendente
        </a>
      </div>
    </section>
  );
}
