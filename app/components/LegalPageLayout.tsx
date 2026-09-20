import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export default function LegalPageLayout({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <section className="max-w-245 my-0 mx-auto py-14 px-6 w-full">
      <header className="max-w-155 mb-9">
        <h1 className="mt-0 mx-0 mb-3 font-bold text-[clamp(28px,4vw,38px)]/vh-11 font-space-grotesk">
          {title}
        </h1>
        <p className="mt-0 mx-0 mb-4 font-medium text-vh-14/vh-175 font-manrope text-vh-soft">
          {intro}
        </p>
        <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-vh-30 border border-vh-border font-semibold text-vh-11-5 font-manrope text-vh-muted">
          <CalendarClock aria-hidden="true" size={13} strokeWidth={2} />
          Atualizado em {updatedAt}
        </span>
      </header>

      <div className="grid grid-cols-[200px_1fr] gap-10 items-start max-md:grid-cols-1">
        <nav
          aria-label="Sumário"
          className="sticky top-30 flex flex-col gap-0.5 max-md:hidden"
        >
          <span className="mb-2 font-bold text-vh-10-5 font-space-grotesk tracking-vh-014 uppercase text-vh-footer-muted">
            Sumário
          </span>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="vh-lime py-1.5 font-semibold text-vh-12-5 font-manrope text-vh-muted border-l-2 border-l-vh-border pl-3 [transition:color_.12s,border-color_.12s] hover:border-l-vh-lime"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="bg-vh-card border border-vh-border rounded-vh-14 py-2 px-7 sm:px-9">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              className={`scroll-mt-30 py-7 ${i !== sections.length - 1 ? "border-b border-b-vh-border" : ""}`}
            >
              <h2 className="mt-0 mb-3 font-bold text-vh-17 font-space-grotesk">
                {s.title}
              </h2>
              <div className="max-w-165 flex flex-col gap-3 font-medium text-vh-13-5/vh-175 font-manrope text-vh-muted">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
