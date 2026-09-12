import { KeyRound } from "lucide-react";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import AuthPageHeader from "../components/AuthPageHeader";

export const metadata = {
  title: "Esqueci minha senha",
};

export default function EsqueciSenhaPage() {
  return (
    <section className="max-w-125 my-0 mx-auto py-12 px-6 w-full">
      <AuthPageHeader
        icon={KeyRound}
        title="Esqueci minha senha"
        subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha."
      />
      <ForgotPasswordForm />
    </section>
  );
}
