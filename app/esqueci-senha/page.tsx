import { KeyRound } from "lucide-react";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import AuthPageHeader from "../components/AuthPageHeader";
import AuthShell from "../components/AuthShell";

export const metadata = {
  title: "Esqueci minha senha",
};

export default function EsqueciSenhaPage() {
  return (
    <AuthShell>
      <AuthPageHeader
        icon={KeyRound}
        title="Esqueci minha senha"
        subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha."
      />
      <ForgotPasswordForm />
    </AuthShell>
  );
}
