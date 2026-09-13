"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmt } from "../lib/wa";
import { useCart } from "./CartProvider";
import type { CustomerProfile, Order } from "../lib/checkout-contracts";
import PixPayment from "./PixPayment";

const EMPTY_PROFILE: CustomerProfile = {
  cpfCnpj: "", phone: "", addressLine: "", addressNumber: "",
  addressComplement: "", neighborhood: "", city: "", state: "", postalCode: "",
};

export default function CheckoutClient() {
  const router = useRouter();
  const { cart, cartTotal, cartCount } = useCart();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile>(EMPTY_PROFILE);
  const [profileComplete, setProfileComplete] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [payingNow, setPayingNow] = useState(false);

  useEffect(() => {
    if (cartCount === 0) router.replace("/lista");
  }, [cartCount, router]);

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
    setPayingNow(false);
    if (!body.ok) {
      setCheckoutError("Não foi possível iniciar o pagamento. Tente novamente.");
      return;
    }
    setOrder(body.data);
  }

  if (loadingProfile) return null;

  if (order) {
    return (
      <section className="max-w-155 my-0 mx-auto py-10 px-6 w-full">
        <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-30 font-space-grotesk text-center">Pague com Pix</h1>
        <p className="mt-0 mx-0 mb-6 font-bold text-vh-24 font-space-grotesk text-vh-lime text-center">
          {fmt(order.totalAmount)}
        </p>
        <PixPayment order={order} />
      </section>
    );
  }

  if (!profileComplete) {
    return (
      <section className="max-w-135 my-0 mx-auto py-10 px-6 w-full">
        <h1 className="mt-0 mx-0 mb-6 font-bold text-vh-24 font-space-grotesk">Complete seus dados</h1>
        <div className="flex flex-col gap-3">
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="CPF ou CNPJ" value={profile.cpfCnpj} onChange={(e) => setProfile({ ...profile, cpfCnpj: e.target.value })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="Telefone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="Rua" value={profile.addressLine} onChange={(e) => setProfile({ ...profile, addressLine: e.target.value })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="Número" value={profile.addressNumber} onChange={(e) => setProfile({ ...profile, addressNumber: e.target.value })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="Complemento (opcional)" value={profile.addressComplement} onChange={(e) => setProfile({ ...profile, addressComplement: e.target.value })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="Bairro" value={profile.neighborhood} onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="Cidade" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="UF" maxLength={2} value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value.toUpperCase() })} />
          <input className="vh-input bg-vh-card border border-vh-border rounded-vh-10 py-3 px-4 text-white" placeholder="CEP" value={profile.postalCode} onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })} />
          {profileError && <p className="text-vh-12 font-manrope text-red-400">{profileError}</p>}
          <button
            type="button"
            disabled={savingProfile}
            className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.5 px-6 font-bold text-vh-14 font-space-grotesk text-vh-ink! disabled:opacity-60"
            onClick={saveProfile}
          >
            {savingProfile ? "Salvando..." : "Salvar e continuar"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-155 my-0 mx-auto py-10 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-6 font-bold text-vh-24 font-space-grotesk">Revise e pague</h1>
      <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3 mb-5">
        {cart.map((it) => (
          <div key={it.key} className="flex justify-between gap-3">
            <span className="font-semibold text-vh-13 font-manrope">{it.qty}× {it.productName}</span>
            <span className="font-bold text-vh-14 font-space-grotesk text-vh-lime">{fmt(it.unitPrice * it.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 border-t border-t-vh-panel">
          <span className="font-bold text-vh-14 font-space-grotesk">Total</span>
          <span className="font-bold text-vh-20 font-space-grotesk text-vh-lime">{fmt(cartTotal)}</span>
        </div>
      </div>
      {checkoutError && <p className="text-vh-12 font-manrope text-red-400 mb-3">{checkoutError}</p>}
      <button
        type="button"
        disabled={payingNow}
        className="w-full vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-4 px-6 font-bold text-vh-15 font-space-grotesk text-vh-ink! disabled:opacity-60"
        onClick={payWithPix}
      >
        {payingNow ? "Gerando cobrança..." : "Pagar com Pix"}
      </button>
    </section>
  );
}
