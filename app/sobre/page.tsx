import { getSiteSettings } from "../lib/strapi";
import StoreMap from "../components/StoreMap";

export default async function SobrePage() {
  const settings = await getSiteSettings();
  return (
    <section className="max-w-245 my-0 mx-auto py-14 px-6 w-full">
      <span className="font-bold text-vh-11-5 font-space-grotesk tracking-vh-018 uppercase text-vh-lime">{settings.aboutEyebrow}</span>
      <h1 className="mt-2.5 mx-0 mb-4 font-bold text-[clamp(30px,4vw,42px)]/vh-11 font-space-grotesk">{settings.aboutHeadline}</h1>
      <p className="mt-0 mx-0 mb-9 max-w-155 font-medium text-vh-15/vh-175 font-manrope text-vh-soft">{settings.aboutText}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 mb-9">
        {settings.aboutStats.map((s, i) => (
          <div key={i} className="bg-vh-card border border-vh-border rounded-vh-14 p-6">
            <span className="font-bold text-vh-30 font-space-grotesk text-vh-lime">{s.value}</span>
            <p className="mt-1.5 mx-0 mb-0 font-medium text-vh-13 font-manrope text-vh-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <StoreMap />
    </section>
  );
}
