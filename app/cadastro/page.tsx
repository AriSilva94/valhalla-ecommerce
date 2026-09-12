import RegisterForm from "../components/RegisterForm";

export const metadata = {
  title: "Criar conta",
};

export default function CadastroPage() {
  return (
    <section className="max-w-125 my-0 mx-auto py-12 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-34 font-space-grotesk">
        Criar conta
      </h1>
      <p className="mt-0 mx-0 mb-7.5 font-medium text-vh-14 font-manrope text-vh-muted">
        Crie sua conta Valhalla para acompanhar pedidos e favoritos.
      </p>
      <RegisterForm />
    </section>
  );
}
