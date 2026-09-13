import { getSiteSettings } from "../lib/strapi";
import LegalPageLayout, { type LegalSection } from "../components/LegalPageLayout";

export const metadata = {
  title: "Política de Privacidade | Valhalla Tecnologia",
};

export default async function PoliticaPrivacidadePage() {
  const settings = await getSiteSettings();

  const sections: LegalSection[] = [
    {
      id: "quem-somos",
      title: "1. Quem somos",
      body: (
        <p className="m-0">
          A Valhalla Tecnologia é responsável pelo tratamento dos dados
          pessoais coletados neste site, nos termos da Lei nº 13.709/2018
          (Lei Geral de Proteção de Dados - LGPD). Em caso de dúvidas sobre
          esta política, entre em contato pelo e-mail{" "}
          <strong className="text-vh-soft">{settings.contactEmail}</strong>.
        </p>
      ),
    },
    {
      id: "dados-coletados",
      title: "2. Quais dados coletamos",
      body: (
        <>
          <p className="m-0">Coletamos os seguintes dados, conforme sua interação com o site:</p>
          <ul className="m-0 pl-5 flex flex-col gap-1.5 list-disc">
            <li>Cadastro: nome de usuário, e-mail e senha (armazenada de forma criptografada).</li>
            <li>Login social: nome, e-mail e foto de perfil fornecidos pelo Google, quando você opta por entrar com essa conta.</li>
            <li>Dados de compra: CPF ou CNPJ, telefone e endereço de entrega, necessários para emissão de cobrança e envio de produtos.</li>
            <li>Dados de pagamento: o processamento do Pix é feito pela Asaas Gestão Financeira S.A., que coleta e trata os dados de pagamento diretamente em seu ambiente seguro. Não armazenamos dados de cartão ou chaves Pix em nossos servidores.</li>
            <li>
              Dados de navegação: cookies de sessão (essenciais) e, mediante seu consentimento, cookies de análise de audiência. Veja detalhes na nossa{" "}
              <a href="/cookies" className="vh-lime underline underline-offset-2">Política de Cookies</a>.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "finalidade",
      title: "3. Para que usamos seus dados",
      body: (
        <ul className="m-0 pl-5 flex flex-col gap-1.5 list-disc">
          <li>Criar e autenticar sua conta na loja.</li>
          <li>Processar pedidos, emitir cobranças via Pix e confirmar pagamentos.</li>
          <li>Entregar os produtos comprados no endereço informado.</li>
          <li>Enviar comunicações sobre o status do pedido.</li>
          <li>Cumprir obrigações legais e fiscais.</li>
          <li>Entender o uso do site e melhorar a experiência de compra (somente com cookies de análise aceitos).</li>
        </ul>
      ),
    },
    {
      id: "base-legal",
      title: "4. Base legal",
      body: (
        <p className="m-0">
          Tratamos seus dados com base na execução de contrato (processar
          seu pedido e login), no cumprimento de obrigação legal (emissão
          fiscal) e, para cookies de análise, no seu consentimento livre e
          informado, que pode ser revogado a qualquer momento.
        </p>
      ),
    },
    {
      id: "compartilhamento",
      title: "5. Com quem compartilhamos",
      body: (
        <>
          <ul className="m-0 pl-5 flex flex-col gap-1.5 list-disc">
            <li><strong className="text-vh-soft">Asaas Gestão Financeira S.A.</strong> — processamento do pagamento via Pix.</li>
            <li><strong className="text-vh-soft">Google (Google Analytics/Tag Manager)</strong> — análise de audiência, somente se você aceitar cookies de análise.</li>
            <li><strong className="text-vh-soft">Provedores de infraestrutura e hospedagem</strong> — armazenamento seguro dos dados do sistema.</li>
          </ul>
          <p className="m-0">Não vendemos nem alugamos seus dados pessoais a terceiros.</p>
        </>
      ),
    },
    {
      id: "retencao",
      title: "6. Por quanto tempo guardamos seus dados",
      body: (
        <p className="m-0">
          Mantemos seus dados enquanto sua conta estiver ativa e pelo prazo
          adicional exigido pela legislação fiscal e civil aplicável (em
          geral, até 5 anos após a última transação). Você pode solicitar a
          exclusão da sua conta a qualquer momento, respeitadas as
          obrigações legais de guarda de documentos fiscais.
        </p>
      ),
    },
    {
      id: "direitos",
      title: "7. Seus direitos como titular",
      body: (
        <>
          <p className="m-0">Nos termos da LGPD, você pode solicitar a qualquer momento:</p>
          <ul className="m-0 pl-5 flex flex-col gap-1.5 list-disc">
            <li>Confirmação da existência de tratamento e acesso aos seus dados.</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados (disponível em <a href="/minha-conta" className="vh-lime underline underline-offset-2">Meus dados</a>).</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Portabilidade dos dados a outro fornecedor.</li>
            <li>Eliminação dos dados tratados com base no seu consentimento.</li>
            <li>Revogação do consentimento, incluindo o de cookies de análise.</li>
          </ul>
          <p className="m-0">
            Para exercer esses direitos, entre em contato pelo e-mail{" "}
            <strong className="text-vh-soft">{settings.contactEmail}</strong>.
          </p>
        </>
      ),
    },
    {
      id: "seguranca",
      title: "8. Segurança",
      body: (
        <p className="m-0">
          Adotamos medidas técnicas e organizacionais para proteger seus
          dados contra acesso não autorizado, perda ou alteração, incluindo
          conexão criptografada (HTTPS) e armazenamento de senhas com hash
          criptográfico.
        </p>
      ),
    },
    {
      id: "alteracoes",
      title: "9. Alterações desta política",
      body: (
        <p className="m-0">
          Podemos atualizar esta política periodicamente. A data da última
          atualização é sempre indicada no topo desta página.
        </p>
      ),
    },
  ];

  return (
    <LegalPageLayout
      title="Política de Privacidade"
      updatedAt="13 de setembro de 2026"
      intro="Como a Valhalla Tecnologia coleta, usa e protege seus dados pessoais ao longo da sua experiência de compra."
      sections={sections}
    />
  );
}
