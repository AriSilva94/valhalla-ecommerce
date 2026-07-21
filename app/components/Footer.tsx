import Link from "next/link";
import { css } from "../lib/css";
import { waUrl } from "../lib/wa";
import type { Category, SiteSettings } from "../lib/strapi";

export default function Footer({ categories, settings }: { categories: Category[]; settings: SiteSettings }) {
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");
  const navCats = categories.filter((c) => c.productCount > 0);

  return (
    <footer style={css("background:#09050D;border-top:1px solid #22003D;margin-top:72px")}>
      <div style={css("max-width:1240px;margin:0 auto;padding:48px 24px 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px")}>
        <div style={css("display:flex;flex-direction:column;gap:12px")}>
          <div style={css("display:flex;flex-direction:column;line-height:1")}>
            <span style={css("font:700 20px 'Space Grotesk',sans-serif;letter-spacing:.04em;transform:skewX(-4deg)")}>VALHALLA</span>
            <span style={css("font:700 8.5px 'Space Grotesk',sans-serif;letter-spacing:.42em;color:#8CFF00;margin-top:3px")}>TECNOLOGIA</span>
          </div>
          <p style={css("margin:0;font:500 12.5px/1.65 'Manrope',sans-serif;color:#9690A3")}>{settings.footerTagline}</p>
          <a className="vh-wa" href={waDirectUrl} target="_blank" style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#062e17;border-radius:9px;padding:10px 16px;font:700 12.5px 'Space Grotesk',sans-serif")}><span style={css("width:8px;height:8px;background:#062e17;border-radius:50%")}></span>+55 96 8423-5663</a>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:9px")}>
          <span style={css("font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF;margin-bottom:4px")}>Categorias</span>
          {navCats.map((c, i) => (<Link key={i} href={'/categoria/' + c.slug} className="vh-lime" style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3;cursor:pointer")}>{c.name}</Link>))}
        </div>
        <div style={css("display:flex;flex-direction:column;gap:9px")}>
          <span style={css("font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF;margin-bottom:4px")}>Institucional</span>
          {settings.footerLinkColumns[0].links.map((l, i) => <Link key={i} href={l.url} className="vh-lime" style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3;cursor:pointer")}>{l.label}</Link>)}
        </div>
        <div style={css("display:flex;flex-direction:column;gap:9px")}>
          <span style={css("font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF;margin-bottom:4px")}>Como funciona</span>
          <p style={css("margin:0;font:500 12.5px/1.65 'Manrope',sans-serif;color:#9690A3")}>Este site é um catálogo: você monta sua lista de interesse e a compra é concluída com um atendente pelo WhatsApp. Nenhum pagamento é processado aqui.</p>
        </div>
      </div>
      <div style={css("border-top:1px solid #22003D")}>
        <p style={css("max-width:1240px;margin:0 auto;padding:16px 24px;font:500 11.5px 'Manrope',sans-serif;color:#4d4160")}>{settings.footerLegalText}</p>
      </div>
    </footer>
  );
}
