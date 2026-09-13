import CookiePreferencesButton from "../components/CookiePreferencesButton";
import LegalPageLayout, { type LegalSection } from "../components/LegalPageLayout";

export const metadata = {
  title: "Política de Cookies | Valhalla Tecnologia",
};

const sections: LegalSection[] = [
  {
    id: "o-que-sao",
    title: "1. O que são cookies",
    body: (
      <p className="m-0">
        Cookies são pequenos arquivos de texto armazenados no seu
        navegador quando você visita um site. Eles ajudam o site a
        funcionar corretamente e, quando você permite, a entender como
        você o utiliza.
      </p>
    ),
  },
  {
    id: "necessarios",
    title: "2. Cookies necessários (sempre ativos)",
    body: (
      <p className="m-0">
        Essenciais para o funcionamento da loja: manter sua sessão de
        login, lembrar os itens da sua lista de interesse e proteger o
        site contra ações maliciosas (CSRF). Não podem ser desativados
        porque o site não funciona sem eles, e não dependem do seu
        consentimento.
      </p>
    ),
  },
  {
    id: "analise",
    title: "3. Cookies de análise (opcionais)",
    body: (
      <p className="m-0">
        Usados apenas se você aceitar, via Google Analytics e/ou Google
        Tag Manager, para entender de forma agregada e anônima quais
        páginas são mais acessadas e melhorar a experiência de compra.
        Esses cookies só são carregados depois que você clica em
        &quot;Aceitar cookies&quot; no banner exibido no site.
      </p>
    ),
  },
  {
    id: "alterar-escolha",
    title: "4. Como alterar sua escolha",
    body: (
      <>
        <p className="m-0">
          Você pode revogar ou alterar seu consentimento a qualquer
          momento clicando no botão abaixo — isso reabre o banner de
          cookies na próxima navegação.
        </p>
        <CookiePreferencesButton />
      </>
    ),
  },
  {
    id: "mais-informacoes",
    title: "5. Mais informações",
    body: (
      <p className="m-0">
        Para saber como tratamos seus dados pessoais de forma geral,
        consulte nossa{" "}
        <a href="/politica-privacidade" className="vh-lime underline underline-offset-2">
          Política de Privacidade
        </a>
        .
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      updatedAt="13 de setembro de 2026"
      intro="Quais cookies a Valhalla usa, para quê, e como você controla o que é opcional."
      sections={sections}
    />
  );
}
