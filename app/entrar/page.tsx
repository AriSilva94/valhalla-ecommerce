import { Suspense } from "react";
import { LogIn } from "lucide-react";
import LoginForm from "../components/LoginForm";
import AuthPageHeader from "../components/AuthPageHeader";

export const metadata = {
  title: "Entrar",
};

export default function EntrarPage() {
  return (
    <section className="max-w-125 my-0 mx-auto py-12 px-6 w-full">
      <AuthPageHeader icon={LogIn} title="Entrar" subtitle="Acesse sua conta Valhalla." />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
