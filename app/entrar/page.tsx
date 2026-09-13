import { Suspense } from "react";
import { LogIn } from "lucide-react";
import LoginForm from "../components/LoginForm";
import AuthPageHeader from "../components/AuthPageHeader";
import AuthShell from "../components/AuthShell";

export const metadata = {
  title: "Entrar",
};

export default function EntrarPage() {
  return (
    <AuthShell>
      <AuthPageHeader icon={LogIn} title="Entrar" subtitle="Acesse sua conta Valhalla." />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
