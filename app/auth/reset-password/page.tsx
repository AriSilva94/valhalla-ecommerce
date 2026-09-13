import { KeyRound, AlertTriangle } from "lucide-react";
import Link from "next/link";
import ResetPasswordForm from "../../components/ResetPasswordForm";
import AuthPageHeader from "../../components/AuthPageHeader";
import AuthShell from "../../components/AuthShell";

export const metadata = {
  title: "Redefinir senha",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (!code) {
    return (
      <AuthShell>
        <AuthPageHeader
          icon={AlertTriangle}
          title="Link inválido"
          subtitle="Este link de redefinição não é válido ou já expirou."
          tone="error"
        />
        <div className="flex flex-col gap-3">
          <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">
            Solicite uma nova redefinição de senha para continuar.
          </span>
          <Link
            href="/esqueci-senha"
            className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink! text-center no-underline"
          >
            Solicitar novo link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthPageHeader
        icon={KeyRound}
        title="Redefinir senha"
        subtitle="Escolha uma nova senha para sua conta."
      />
      <ResetPasswordForm code={code} />
    </AuthShell>
  );
}
