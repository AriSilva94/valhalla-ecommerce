import ForgotPasswordForm from "../components/ForgotPasswordForm";

export const metadata = {
  title: "Esqueci minha senha",
};

export default function EsqueciSenhaPage() {
  return (
    <section className="max-w-125 my-0 mx-auto py-12 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-34 font-space-grotesk">
        Esqueci minha senha
      </h1>
      <p className="mt-0 mx-0 mb-7.5 font-medium text-vh-14 font-manrope text-vh-muted">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>
      <ForgotPasswordForm />
    </section>
  );
}
