import { UserPlus } from "lucide-react";
import RegisterForm from "../components/RegisterForm";
import AuthPageHeader from "../components/AuthPageHeader";
import AuthShell from "../components/AuthShell";

export const metadata = {
  title: "Criar conta",
};

export default function CadastroPage() {
  return (
    <AuthShell>
      <AuthPageHeader
        icon={UserPlus}
        title="Criar conta"
        subtitle="Crie sua conta Valhalla para acompanhar pedidos e favoritos."
      />
      <RegisterForm />
    </AuthShell>
  );
}
