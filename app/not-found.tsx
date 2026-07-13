import Link from "next/link";
import { css } from "./lib/css";
import { getSiteSettings } from "./lib/strapi";
import { waUrl } from "./lib/wa";

export default async function NotFound() {
  const settings = await getSiteSettings();
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section style={css("max-width:620px;margin:0 auto;padding:90px 24px;width:100%;text-align:center")}>
      <span
        style={css(
          "font:700 clamp(80px,14vw,120px)/1 'Space Grotesk',sans-serif;background:linear-gradient(120deg,#8B2CF5,#B056FF);-webkit-background-clip:text;background-clip:text;color:transparent"
        )}
      >
        404
      </span>
      <h1 style={css("margin:14px 0 10px;font:700 26px 'Space Grotesk',sans-serif")}>Essa página se perdeu no Valhalla</h1>
      <p style={css("margin:0 0 26px;font:500 14px/1.7 'Manrope',sans-serif;color:#9690A3")}>
        O endereço não existe ou o produto saiu do catálogo. Bora voltar para as ofertas?
      </p>
      <div style={css("display:flex;gap:12px;justify-content:center;flex-wrap:wrap")}>
        <Link
          href="/"
          className="vh-btn-lime"
          style={css("background:#8CFF00;color:#09050D;border:none;border-radius:11px;padding:15px 26px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer;text-decoration:none;display:inline-block")}
        >
          Voltar ao início
        </Link>
        <a
          className="vh-wa-outline"
          href={waDirectUrl}
          target="_blank"
          style={css("display:inline-flex;align-items:center;background:transparent;border:1px solid #25D366;color:#25D366;border-radius:11px;padding:14px 26px;font:700 14px 'Space Grotesk',sans-serif")}
        >
          Falar com atendente
        </a>
      </div>
    </section>
  );
}
