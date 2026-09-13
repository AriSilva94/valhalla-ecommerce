import CookiePreferencesButton from "../components/CookiePreferencesButton";

export const metadata = {
  title: "Política de Cookies | Valhalla Tecnologia",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mt-0 mb-3 font-bold text-vh-18 font-space-grotesk">{title}</h2>
      <div className="flex flex-col gap-3 font-medium text-vh-13-5/vh-175 font-manrope text-vh-muted">
        {children}
      </div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <section className="max-w-190 my-0 mx-auto py-14 px-6 w-full">
      <span className="font-bold text-vh-11-5 font-space-grotesk tracking-vh-018 uppercase text-vh-lime">
        Cookies
      </span>
      <h1 className="mt-2.5 mx-0 mb-2 font-bold text-[clamp(28px,4vw,38px)]/vh-11 font-space-grotesk">
        Política de Cookies
      </h1>
      <p className="mt-0 mx-0 mb-10 font-medium text-vh-13 font-manrope text-vh-footer-muted">
        Última atualização: 13 de setembro de 2026
      </p>

      <Section title="1. O que são cookies">
        <p className="m-0">
          Cookies são pequenos arquivos de texto armazenados no seu
          navegador quando você visita um site. Eles ajudam o site a
          funcionar corretamente e, quando você permite, a entender como
          você o utiliza.
        </p>
      </Section>

      <Section title="2. Cookies necessários (sempre ativos)">
        <p className="m-0">
          Essenciais para o funcionamento da loja: manter sua sessão de
          login, lembrar os itens da sua lista de interesse e proteger o
          site contra ações maliciosas (CSRF). Não podem ser desativados
          porque o site não funciona sem eles, e não dependem do seu
          consentimento.
        </p>
      </Section>

      <Section title="3. Cookies de análise (opcionais)">
        <p className="m-0">
          Usados apenas se você aceitar, via Google Analytics e/ou Google
          Tag Manager, para entender de forma agregada e anônima quais
          páginas são mais acessadas e melhorar a experiência de compra.
          Esses cookies só são carregados depois que você clica em
          &quot;Aceitar cookies&quot; no banner exibido no site.
        </p>
      </Section>

      <Section title="4. Como alterar sua escolha">
        <p className="m-0">
          Você pode revogar ou alterar seu consentimento a qualquer
          momento clicando no botão abaixo — isso reabre o banner de
          cookies na próxima navegação.
        </p>
        <CookiePreferencesButton />
      </Section>

      <Section title="5. Mais informações">
        <p className="m-0">
          Para saber como tratamos seus dados pessoais de forma geral,
          consulte nossa{" "}
          <a href="/politica-privacidade" className="vh-lime underline underline-offset-2">
            Política de Privacidade
          </a>
          .
        </p>
      </Section>
    </section>
  );
}
