"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCog } from "lucide-react";
import AuthPageHeader from "./AuthPageHeader";
import AuthAlert from "./AuthAlert";
import ProfileForm from "./ProfileForm";
import type { CustomerProfile } from "../lib/checkout-contracts";

const EMPTY_PROFILE: CustomerProfile = {
  cpfCnpj: "", phone: "", addressLine: "", addressNumber: "",
  addressComplement: "", neighborhood: "", city: "", state: "", postalCode: "",
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-135 bg-vh-panel border border-vh-border rounded-3xl p-7 sm:p-9 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]">
      {children}
    </div>
  );
}

function FormSkeleton() {
  return (
    <section className="flex justify-center py-10 px-4 sm:py-14 sm:px-6">
      <Card>
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-12 w-12 rounded-full bg-vh-deep mb-4" />
          <div className="h-6 w-2/3 rounded bg-vh-deep mb-1" />
          <div className="h-4 w-1/2 rounded bg-vh-deep mb-6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 rounded-vh-10 bg-vh-deep" />
          ))}
        </div>
      </Card>
    </section>
  );
}

export default function MinhaContaClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/entrar?returnTo=/minha-conta");
          return null;
        }
        return res.json();
      })
      .then((body) => {
        if (!body?.ok) return;
        if (body.data) setProfile(body.data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const body = await res.json();
    setSaving(false);
    if (!body.ok) {
      setError("Confira os dados: CPF/CNPJ, CEP e UF precisam ser válidos.");
      return;
    }
    setSaved(true);
  }

  if (loading) return <FormSkeleton />;

  return (
    <section className="flex justify-center py-10 px-4 sm:py-14 sm:px-6">
      <Card>
        <AuthPageHeader
          icon={UserCog}
          title="Meus dados"
          subtitle="Mantenha seu CPF/CNPJ e endereço atualizados para agilizar seus pedidos."
        />
        {saved && (
          <AuthAlert variant="success" className="mb-4">
            Dados atualizados com sucesso.
          </AuthAlert>
        )}
        <ProfileForm
          profile={profile}
          onChange={(next) => {
            setProfile(next);
            setSaved(false);
          }}
          onSave={saveProfile}
          saving={saving}
          error={error}
          submitLabel="Salvar alterações"
        />
      </Card>
    </section>
  );
}
