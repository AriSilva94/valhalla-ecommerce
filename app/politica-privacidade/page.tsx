import { getSiteSettings } from "../lib/strapi";

export const metadata = {
  title: "Política de Privacidade | Valhalla Tecnologia",
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

export default async function PoliticaPrivacidadePage() {
  const settings = await getSiteSettings();

  return (
    <section className="max-w-190 my-0 mx-auto py-14 px-6 w-full">
      <span className="font-bold text-vh-11-5 font-space-grotesk tracking-vh-018 uppercase text-vh-lime">
        Privacidade
      </span>
      <h1 className="mt-2.5 mx-0 mb-2 font-bold text-[clamp(28px,4vw,38px)]/vh-11 font-space-grotesk">
        Política de Privacidade
      </h1>
      <p className="mt-0 mx-0 mb-10 font-medium text-vh-13 font-manrope text-vh-footer-muted">
        Última atualização: 13 de setembro de 2026
      </p>

      <Section title="1. Quem somos">
        <p className="m-0">
          A Valhalla Tecnologia é responsável pelo tratamento dos dados
          pessoais coletados neste site, nos termos da Lei nº 13.709/2018
          (Lei Geral de Proteção de Dados - LGPD). Em caso de dúvidas sobre
          esta política, entre em contato pelo e-mail{" "}
          <strong className="text-vh-soft">{settings.contactEmail}</strong>.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p className="m-0">Coletamos os seguintes dados, conforme sua interação com o site:</p>
        <ul className="m-0 pl-5 flex flex-col gap-1.5 list-disc">
          <li>Cadastro: nome de usuário, e-mail e senha (armazenada de forma criptografada).</li>
          <li>Login social: nome, e-mail e foto de perfil fornecidos pelo Google, quando você opta por entrar com essa conta.</li>
          <li>Dados de compra: CPF ou CNPJ, telefone e endereço de entrega, necessários para emissão de cobrança e envio de produtos.</li>
          <li>Dados de pagamento: o processamento do Pix é feito pela Asaas Gestão Financeira S.A., que coleta e trata os dados de pagamento diretamente em seu ambiente seguro. Não armazenamos dados de cartão ou chaves Pix em nossos servidores.</li>
          <li>Dados de navegação: cookies de sessão (essenciais) e, mediante seu consentimento, cookies de análise de audiência. Veja detalhes na nossa <a href="/cookies" className="vh-lime underline underline-offset-2">Política de Cookies</a>.</li>
        </ul>
      </Section>

      <Section title="3. Para que usamos seus dados">
        <ul className="m-0 pl-5 flex flex-col gap-1.5 list-disc">
          <li>Criar e autenticar sua conta na loja.</li>
          <li>Processar pedidos, emitir cobranças via Pix e confirmar pagamentos.</li>
          <li>Entregar os produtos comprados no endereço informado.</li>
          <li>Enviar comunicações sobre o status do pedido.</li>
          <li>Cumprir obrigações legais e fiscais.</li>
          <li>Entender o uso do site e melhorar a experiência de compra (somente com cookies de análise aceitos).</li>
        </ul>
      </Section>

      <Section title="4. Base legal">
        <p className="m-0">
          Tratamos seus dados com base na execução de contrato (processar
          seu pedido e login), no cumprimento de obrigação legal (emissão
          fiscal) e, para cookies de análise, no seu consentimento livre e
          informado, que pode ser revogado a qualquer momento.
        </p>
      </Section>

      <Section title="5. Com quem compartilhamos">
        <ul className="m-0 pl-5 flex flex-col gap-1.5 list-disc">
          <li><strong className="text-vh-soft">Asaas Gestão Financeira S.A.</strong> — processamento do pagamento via Pix.</li>
          <li><strong className="text-vh-soft">Google (Google Analytics/Tag Manager)</strong> — análise de audiência, somente se você aceitar cookies de análise.</li>
          <li><strong className="text-vh-soft">Provedores de infraestrutura e hospedagem</strong> — armazenamento seguro dos dados do sistema.</li>
        </ul>
        <p className="m-0">Não vendemos nem alugamos seus dados pessoais a terceiros.</p>
      </Section>

      <Section title="6. Por quanto tempo guardamos seus dados">
        <p className="m-0">
          Mantemos seus dados enquanto sua conta estiver ativa e pelo prazo
          adicional exigido pela legislação fiscal e civil aplicável (em
          geral, até 5 anos após a última transação). Você pode solicitar a
          exclusão da sua conta a qualquer momento, respeitadas as
          obrigações legais de guarda de documentos fiscais.
        </p>
      </Section>

      <Section title="7. Seus direitos como titular">
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
      </Section>

      <Section title="8. Segurança">
        <p className="m-0">
          Adotamos medidas técnicas e organizacionais para proteger seus
          dados contra acesso não autorizado, perda ou alteração, incluindo
          conexão criptografada (HTTPS) e armazenamento de senhas com hash
          criptográfico.
        </p>
      </Section>

      <Section title="9. Alterações desta política">
        <p className="m-0">
          Podemos atualizar esta política periodicamente. A data da última
          atualização é sempre indicada no topo desta página.
        </p>
      </Section>
    </section>
  );
}
