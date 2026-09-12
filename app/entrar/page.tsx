import { Suspense } from "react";
import LoginForm from "../components/LoginForm";

export const metadata = {
  title: "Entrar",
};

export default function EntrarPage() {
  return (
    <section className="max-w-125 my-0 mx-auto py-12 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-34 font-space-grotesk">
        Entrar
      </h1>
      <p className="mt-0 mx-0 mb-7.5 font-medium text-vh-14 font-manrope text-vh-muted">
        Acesse sua conta Valhalla.
      </p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
