"use client";

import { useState } from "react";
import { Building2, Hash, Landmark, Loader2, MapPin, Phone, User } from "lucide-react";
import AuthTextField from "./AuthTextField";
import AuthAlert from "./AuthAlert";
import type { CustomerProfile } from "../lib/checkout-contracts";

export default function ProfileForm({
  profile,
  onChange,
  onSave,
  saving,
  error,
  submitLabel,
}: {
  profile: CustomerProfile;
  onChange: (profile: CustomerProfile) => void;
  onSave: () => void;
  saving: boolean;
  error: string;
  submitLabel: string;
}) {
  const [lookingUpCep, setLookingUpCep] = useState(false);

  function setField<K extends keyof CustomerProfile>(key: K, value: string) {
    onChange({ ...profile, [key]: value });
  }

  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLookingUpCep(true);
    try {
      const res = await fetch(`/api/cep/${digits}`);
      const body = await res.json();
      if (body.ok) {
        onChange({
          ...profile,
          postalCode: rawCep,
          addressLine: body.data.addressLine || profile.addressLine,
          neighborhood: body.data.neighborhood || profile.neighborhood,
          city: body.data.city || profile.city,
          state: body.data.state || profile.state,
        });
      }
    } finally {
      setLookingUpCep(false);
    }
  }

  return (
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

      <AuthTextField
        icon={lookingUpCep ? Loader2 : MapPin}
        placeholder="CEP *"
        value={profile.postalCode}
        onChange={(e) => setField("postalCode", e.target.value)}
        onBlur={(e) => lookupCep(e.target.value)}
      />

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

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <button
        type="button"
        disabled={saving}
        className="vh-btn-lime mt-2 flex items-center justify-center gap-2 bg-vh-lime border-0 rounded-vh-11 py-3.5 px-6 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink! disabled:opacity-60 [transition:background_.15s]"
        onClick={onSave}
      >
        {saving && <Loader2 aria-hidden="true" size={16} className="animate-spin" />}
        {saving ? "Salvando..." : submitLabel}
      </button>
    </div>
  );
}
