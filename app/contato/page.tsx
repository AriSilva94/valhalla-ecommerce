import { getSiteSettings } from "../lib/strapi";
import { waUrl } from "../lib/wa";
import ContactForm from "../components/ContactForm";

export default async function ContatoPage() {
  const settings = await getSiteSettings();
  const waDirectUrl = waUrl(settings.whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section className="max-w-245 my-0 mx-auto py-12 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-34 font-space-grotesk">Fale com a gente</h1>
      <p className="mt-0 mx-0 mb-7.5 font-medium text-vh-14 font-manrope text-vh-muted">O WhatsApp é nosso canal mais rápido — resposta em minutos no horário comercial.</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 items-start">
        <div className="flex flex-col gap-3">
          <a
            className="vh-contactlink flex items-center gap-3.5 bg-vh-wa/8 border border-vh-wa/40 rounded-vh-14 p-5 text-white"
            href={waDirectUrl}
            target="_blank"
          >
            <span className="w-10 h-10 flex-none rounded-full bg-vh-wa flex items-center justify-center">
              <span className="w-3 h-3 bg-vh-wa-dark rounded-full"></span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-bold text-vh-15 font-space-grotesk">WhatsApp</span>
              <span className="font-semibold text-vh-13 font-manrope text-vh-wa">+55 96 8423-5663 · resposta rápida</span>
            </span>
          </a>
          <div className="bg-vh-card border border-vh-border rounded-vh-14 p-5 flex flex-col gap-2.5">
            <span className="font-semibold text-vh-13 font-manrope text-vh-soft"><span className="text-vh-accent font-bold">E-mail:</span> {settings.contactEmail}</span>
            <span className="font-semibold text-vh-13 font-manrope text-vh-soft"><span className="text-vh-accent font-bold">Endereço:</span> {settings.contactAddress}</span>
            <span className="font-semibold text-vh-13 font-manrope text-vh-soft"><span className="text-vh-accent font-bold">Horário:</span> {settings.contactHours}</span>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
