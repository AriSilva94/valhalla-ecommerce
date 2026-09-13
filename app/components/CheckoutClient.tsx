"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Building2,
  Hash,
  Landmark,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { fmt, formatVariantMeta } from "../lib/wa";
import { useCart } from "./CartProvider";
import { CHECKOUT_ERROR_CODES, type CustomerProfile } from "../lib/checkout-contracts";
import AuthPageHeader from "./AuthPageHeader";
import AuthTextField from "./AuthTextField";
import AuthAlert from "./AuthAlert";
import PixIcon from "./PixIcon";

const EMPTY_PROFILE: CustomerProfile = {
  cpfCnpj: "", phone: "", addressLine: "", addressNumber: "",
  addressComplement: "", neighborhood: "", city: "", state: "", postalCode: "",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`w-full max-w-135 bg-vh-panel border border-vh-border rounded-3xl p-7 sm:p-9 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] ${className}`}
    >
      {children}
    </div>
  );
}

function ProfileFormSkeleton() {
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

export default function CheckoutClient() {
  const router = useRouter();
  const { cart, cartTotal, cartCount, clear } = useCart();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile>(EMPTY_PROFILE);
  const [profileComplete, setProfileComplete] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [payingNow, setPayingNow] = useState(false);

  useEffect(() => {
    if (!loadingProfile && cartCount === 0 && !redirecting) router.replace("/lista");
  }, [loadingProfile, cartCount, redirecting, router]);

  useEffect(() => {
    fetch("/api/account/profile", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/entrar?returnTo=/checkout");
          return null;
        }
        return res.json();
      })
      .then((body) => {
        if (!body?.ok) return;
        if (body.data) {
          setProfile(body.data);
          setProfileComplete(true);
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [router]);

  function setField<K extends keyof CustomerProfile>(key: K, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError("");
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const body = await res.json();
    setSavingProfile(false);
    if (!body.ok) {
      setProfileError("Confira os dados: CPF/CNPJ, CEP e UF precisam ser válidos.");
      return;
    }
    setProfileComplete(true);
  }

  async function payWithPix() {
    setPayingNow(true);
    setCheckoutError("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((it) => ({ productSlug: it.productSlug, variantSku: it.variantSku, qty: it.qty })),
      }),
    });
    const body = await res.json();
    if (!body.ok) {
      setPayingNow(false);
      if (body.error === CHECKOUT_ERROR_CODES.PROFILE_INCOMPLETE) {
        setProfileComplete(false);
        return;
      }
      setCheckoutError("Não foi possível iniciar o pagamento. Tente novamente.");
      return;
    }
    setRedirecting(true);
    clear();
    window.location.href = body.data.checkoutUrl;
  }

  if (loadingProfile) return <ProfileFormSkeleton />;

  if (redirecting) {
    return (
      <section className="flex justify-center py-10 px-4 sm:py-14 sm:px-6">
        <Card>
          <AuthPageHeader
            icon={ShieldCheck}
            title="Redirecionando para o pagamento"
            subtitle="Você será levado à página segura do Asaas para concluir com Pix."
          />
          <div className="flex justify-center py-6">
            <Loader2 aria-hidden="true" size={28} className="animate-spin text-vh-lime" />
          </div>
        </Card>
      </section>
    );
  }

  if (!profileComplete) {
    return (
      <section className="flex justify-center py-10 px-4 sm:py-14 sm:px-6">
        <Card>
          <AuthPageHeader
            icon={User}
            title="Complete seus dados"
            subtitle={`Necessário para emitir a cobrança Pix do seu pedido de ${fmt(cartTotal)}.`}
          />
          <div className="flex flex-col gap-3">
            <AuthTextField
              icon={User}
              placeholder="CPF ou CNPJ *"
              value={profile.cpfCnpj}
              onChange={(e) => setField("cpfCnpj", e.target.value)}
            />
            <AuthTextField
              icon={Phone}
              placeholder="Telefone"
              value={profile.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />

            <p className="mt-2 mx-0 mb-0.5 font-bold text-vh-11-5 font-space-grotesk tracking-vh-006 uppercase text-vh-muted">
              Endereço de entrega
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              <AuthTextField
                icon={MapPin}
                className="col-span-2"
                placeholder="Rua *"
                value={profile.addressLine}
                onChange={(e) => setField("addressLine", e.target.value)}
              />
              <AuthTextField
                icon={Hash}
                placeholder="Nº *"
                value={profile.addressNumber}
                onChange={(e) => setField("addressNumber", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <AuthTextField
                icon={Building2}
                placeholder="Complemento"
                value={profile.addressComplement}
                onChange={(e) => setField("addressComplement", e.target.value)}
              />
              <AuthTextField
                icon={Landmark}
                placeholder="Bairro *"
                value={profile.neighborhood}
                onChange={(e) => setField("neighborhood", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <AuthTextField
                icon={Building2}
                className="col-span-2"
                placeholder="Cidade *"
                value={profile.city}
                onChange={(e) => setField("city", e.target.value)}
              />
              <AuthTextField
                icon={MapPin}
                placeholder="UF *"
                maxLength={2}
                value={profile.state}
                onChange={(e) => setField("state", e.target.value.toUpperCase())}
              />
            </div>

            <AuthTextField
              icon={MapPin}
              placeholder="CEP *"
              value={profile.postalCode}
              onChange={(e) => setField("postalCode", e.target.value)}
            />

            {profileError && <AuthAlert variant="error">{profileError}</AuthAlert>}

            <button
              type="button"
              disabled={savingProfile}
              className="vh-btn-lime mt-2 flex items-center justify-center gap-2 bg-vh-lime border-0 rounded-vh-11 py-3.5 px-6 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink! disabled:opacity-60 [transition:background_.15s]"
              onClick={saveProfile}
            >
              {savingProfile && <Loader2 aria-hidden="true" size={16} className="animate-spin" />}
              {savingProfile ? "Salvando..." : "Salvar e continuar"}
            </button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex justify-center py-10 px-4 sm:py-14 sm:px-6">
      <Card>
        <AuthPageHeader icon={ShieldCheck} title="Revise e pague" subtitle="Confira os itens antes de gerar a cobrança Pix." />

        <div className="bg-vh-bg border border-vh-border rounded-2xl p-5 flex flex-col gap-3 mb-5">
          {cart.map((it) => (
            <div key={it.key} className="flex gap-3 items-center">
              <div className="w-11.5 h-11.5 flex-none relative overflow-hidden bg-[repeating-linear-gradient(45deg,#2A0A45_0_8px,#24063C_8px_16px)] border border-vh-border rounded-vh-9">
                {it.productImageUrl && (
                  <Image src={it.productImageUrl} alt={it.productImageAlt ?? it.productName} fill sizes="46px" className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="font-bold text-vh-13 font-manrope truncate">{it.qty}× {it.productName}</span>
                <span className="font-medium text-vh-11-5 font-manrope text-vh-muted truncate">{formatVariantMeta(it.configLabel, it.colorName)}</span>
              </div>
              <span className="font-bold text-vh-13-5 font-space-grotesk text-vh-lime whitespace-nowrap">{fmt(it.unitPrice * it.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-3 border-t border-t-vh-panel">
            <span className="font-bold text-vh-14 font-space-grotesk text-vh-soft">Total</span>
            <span className="font-bold text-vh-24 font-space-grotesk text-vh-lime">{fmt(cartTotal)}</span>
          </div>
        </div>

        {checkoutError && <AuthAlert variant="error" className="mb-4">{checkoutError}</AuthAlert>}

        <button
          type="button"
          disabled={payingNow}
          className="vh-btn-lime w-full flex items-center justify-center gap-2 bg-vh-lime border-0 rounded-vh-11 py-4 px-6 font-bold text-vh-15 font-space-grotesk cursor-pointer text-vh-ink! disabled:opacity-60 [transition:background_.15s]"
          onClick={payWithPix}
        >
          {payingNow && <Loader2 aria-hidden="true" size={18} className="animate-spin" />}
          {payingNow ? "Gerando cobrança..." : "Pagar com Pix"}
          {!payingNow && <PixIcon size={17} />}
        </button>
        <p className="mt-3.5 mx-0 mb-0 flex items-center justify-center gap-1.5 font-medium text-vh-11-5 font-manrope text-vh-muted text-center">
          <ShieldCheck aria-hidden="true" size={13} strokeWidth={2} className="shrink-0" />
          Pagamento processado com segurança via Asaas
        </p>
      </Card>
    </section>
  );
}
