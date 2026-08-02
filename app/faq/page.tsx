import { getFaqs, getSiteSettings } from "../lib/strapi";
import { waUrl } from "../lib/wa";
import Accordion from "../components/Accordion";

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSiteSettings()]);
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section className="max-w-195 my-0 mx-auto py-12 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-34 font-space-grotesk">Perguntas frequentes</h1>
      <p className="mt-0 mx-0 mb-7 font-medium text-vh-14 font-manrope text-vh-muted">
        Não achou sua dúvida? <a href={waDirectUrl} target="_blank" className="text-vh-wa font-bold">Chama no WhatsApp</a>.
      </p>
      <Accordion items={faqs.map((f) => ({ q: f.question, a: f.answer }))} />
    </section>
  );
}
