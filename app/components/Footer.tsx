import Link from "next/link";
import { waUrl } from "../lib/wa";
import type { Category, SiteSettings } from "../lib/strapi";

export default function Footer({ categories, settings }: { categories: Category[]; settings: SiteSettings }) {
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");
  const navCats = categories.filter((c) => c.productCount > 0);

  return (
    <footer className="bg-vh-ink border-t border-t-vh-panel mt-18">
      <div className="max-w-310 my-0 mx-auto pt-12 px-6 pb-6 grid vh-grid-footer gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col leading-none">
            <span className="font-bold text-vh-20 font-space-grotesk tracking-vh-004 -skew-x-4">VALHALLA</span>
            <span className="font-bold text-vh-8-5 font-space-grotesk tracking-vh-042 text-vh-lime mt-0.75">TECNOLOGIA</span>
          </div>
          <p className="m-0 font-medium text-vh-12-5/vh-165 font-manrope text-vh-muted">{settings.footerTagline}</p>
          <a className="vh-wa self-start inline-flex items-center gap-2 bg-vh-wa rounded-vh-9 py-2.5 px-4 font-bold text-vh-12-5 font-space-grotesk text-vh-wa-dark!" href={waDirectUrl} target="_blank"><span className="w-2 h-2 bg-vh-wa-dark rounded-full"></span>+55 96 8423-5663</a>
        </div>
        <div className="flex flex-col gap-2.25">
          <span className="font-bold text-vh-12 font-space-grotesk tracking-vh-014 uppercase text-vh-accent mb-1">Categorias</span>
          {navCats.map((c, i) => (<Link key={i} href={'/categoria/' + c.slug} className="vh-lime font-medium text-vh-13 font-manrope text-vh-muted cursor-pointer">{c.name}</Link>))}
        </div>
        <div className="flex flex-col gap-2.25">
          <span className="font-bold text-vh-12 font-space-grotesk tracking-vh-014 uppercase text-vh-accent mb-1">Institucional</span>
          {settings.footerLinkColumns[0].links.map((l, i) => <Link key={i} href={l.url} className="vh-lime font-medium text-vh-13 font-manrope text-vh-muted cursor-pointer">{l.label}</Link>)}
        </div>
        <div className="flex flex-col gap-2.25">
          <span className="font-bold text-vh-12 font-space-grotesk tracking-vh-014 uppercase text-vh-accent mb-1">Como funciona</span>
          <p className="m-0 font-medium text-vh-12-5/vh-165 font-manrope text-vh-muted">Este site é um catálogo: você monta sua lista de interesse e a compra é concluída com um atendente pelo WhatsApp. Nenhum pagamento é processado aqui.</p>
        </div>
      </div>
      <div className="border-t border-t-vh-panel">
        <p className="max-w-310 my-0 mx-auto py-4 px-6 font-medium text-vh-11-5 font-manrope text-vh-footer-muted">{settings.footerLegalText}</p>
      </div>
    </footer>
  );
}
