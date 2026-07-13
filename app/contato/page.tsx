import { css } from "../lib/css";
import { getSiteSettings } from "../lib/strapi";
import { waUrl } from "../lib/wa";
import ContactForm from "../components/ContactForm";

export default async function ContatoPage() {
  const settings = await getSiteSettings();
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section style={css("max-width:980px;margin:0 auto;padding:48px 24px;width:100%")}>
      <h1 style={css("margin:0 0 8px;font:700 34px 'Space Grotesk',sans-serif")}>Fale com a gente</h1>
      <p style={css("margin:0 0 30px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>O WhatsApp é nosso canal mais rápido — resposta em minutos no horário comercial.</p>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;align-items:start")}>
        <div style={css("display:flex;flex-direction:column;gap:12px")}>
          <a
            className="vh-contactlink"
            href={waDirectUrl}
            target="_blank"
            style={css("display:flex;align-items:center;gap:14px;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.4);border-radius:14px;padding:20px;color:#FFFFFF")}
          >
            <span style={css("width:40px;height:40px;flex:none;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center")}>
              <span style={css("width:12px;height:12px;background:#062e17;border-radius:50%")}></span>
            </span>
            <span style={css("display:flex;flex-direction:column;gap:2px")}>
              <span style={css("font:700 15px 'Space Grotesk',sans-serif")}>WhatsApp</span>
              <span style={css("font:600 13px 'Manrope',sans-serif;color:#25D366")}>+55 96 8423-5663 · resposta rápida</span>
            </span>
          </a>
          <div style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:10px")}>
            <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#B056FF;font-weight:700")}>E-mail:</span> {settings.contactEmail}</span>
            <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#B056FF;font-weight:700")}>Endereço:</span> {settings.contactAddress}</span>
            <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#B056FF;font-weight:700")}>Horário:</span> {settings.contactHours}</span>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
