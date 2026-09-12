import { UserPlus } from "lucide-react";
import RegisterForm from "../components/RegisterForm";
import AuthPageHeader from "../components/AuthPageHeader";

export const metadata = {
  title: "Criar conta",
};

export default function CadastroPage() {
  return (
    <section className="max-w-125 my-0 mx-auto py-12 px-6 w-full">
      <AuthPageHeader
        icon={UserPlus}
        title="Criar conta"
        subtitle="Crie sua conta Valhalla para acompanhar pedidos e favoritos."
      />
      <RegisterForm />
    </section>
  );
}
