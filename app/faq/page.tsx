import { css } from "../lib/css";
import { getFaqs, getSiteSettings } from "../lib/strapi";
import { waUrl } from "../lib/wa";
import Accordion from "../components/Accordion";

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSiteSettings()]);
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section style={css("max-width:780px;margin:0 auto;padding:48px 24px;width:100%")}>
      <h1 style={css("margin:0 0 8px;font:700 34px 'Space Grotesk',sans-serif")}>Perguntas frequentes</h1>
      <p style={css("margin:0 0 28px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>
        Não achou sua dúvida? <a href={waDirectUrl} target="_blank" style={css("color:#25D366;font-weight:700")}>Chama no WhatsApp</a>.
      </p>
      <Accordion items={faqs.map((f) => ({ q: f.question, a: f.answer }))} />
    </section>
  );
}
