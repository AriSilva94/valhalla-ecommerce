"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fmt, waUrl } from "../lib/wa";
import { useCart } from "./CartProvider";
import Breadcrumb from "./Breadcrumb";

export default function ListaClient({ whatsappNumber }: { whatsappNumber: string }) {
  const { cart, updateQty, removeItem, cartCount, cartTotal, clear } = useCart();
  const [step, setStep] = useState<"cart" | "review" | "sent">("cart");
  const [name, setName] = useState("");

  const buildMsg = (who: string) => {
    const rows = cart
      .map((it, i) => {
        return (
          (i + 1) +
          ". " +
          it.productName +
          "\nModelo: " +
          it.configLabel +
          "\nCor: " +
          it.colorName +
          "\nQuantidade: " +
          it.qty +
          "\nPreço apresentado: " +
          fmt(it.unitPrice) +
          "\nLink: valhalla.tec.br/produto/" +
          it.productSlug
        );
      })
      .join("\n\n");
    return (
      "Olá, equipe Valhalla Tecnologia! Meu nome é " +
      (who || "[seu nome]") +
      ".\n\nTenho interesse nos seguintes produtos:\n\n" +
      rows +
      "\n\nValor total estimado: " +
      fmt(cartTotal) +
      "\n\nGostaria de confirmar a disponibilidade e finalizar a compra com um atendente."
    );
  };

  const waCartUrl = waUrl(whatsappNumber, buildMsg(name.trim()));
  const nameOk = name.trim().length > 1 && cart.length > 0;

  return (
    <div>
      {/* ===== INTEREST LIST ===== */}
      {step === "cart" && (
        <section className="max-w-310 my-0 mx-auto py-10 px-6 w-full">
          <Breadcrumb items={[{ label: "Início", href: "/" }, { label: "Minha lista" }]} />
          <h1 className="mt-0 mx-0 mb-6.5 font-bold text-vh-34 font-space-grotesk">Minha lista de interesse</h1>
          {cart.length === 0 && (
            <div className="text-center py-17.5 px-6 bg-vh-card border border-dashed border-vh-border rounded-2xl">
              <span className="inline-block w-4 h-4 border-3 border-vh-lime rounded mb-3.5"></span>
              <h3 className="mt-0 mx-0 mb-2 font-bold text-vh-20 font-space-grotesk">Sua lista está vazia</h3>
              <p className="mt-0 mx-0 mb-5 font-medium text-vh-14 font-manrope text-vh-muted">Explore o catálogo e adicione os produtos que você quer negociar com nosso time.</p>
              <Link className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 py-3.5 px-6.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!" href="/">Explorar produtos</Link>
            </div>
          )}
          {cartCount > 0 && (
            <div className="grid grid-cols-1 gap-7 max-w-275">
              <div className="flex flex-col gap-3">
                {cart.map((it) => (
                  <div key={it.key} className="flex gap-4 items-center bg-vh-card border border-vh-border rounded-vh-14 p-4 flex-wrap">
                    <Link href={`/produto/${it.productSlug}`} className="w-19 h-19 flex-none relative overflow-hidden bg-[repeating-linear-gradient(45deg,#2A0A45_0_8px,#24063C_8px_16px)] border border-vh-border rounded-vh-10 flex items-center justify-center cursor-pointer">
                      {it.productImageUrl ? (
                        <Image src={it.productImageUrl} alt={it.productImageAlt ?? it.productName} fill sizes="76px" className="object-cover" />
                      ) : (
                        <span className="font-medium text-vh-9 font-mono text-vh-muted">[foto]</span>
                      )}
                    </Link>
                    <div className="flex-1 min-w-42.5 flex flex-col gap-0.75">
                      <Link className="vh-lime font-bold text-vh-14-5 font-space-grotesk cursor-pointer" href={`/produto/${it.productSlug}`}>{it.productName}</Link>
                      <span className="font-medium text-vh-12 font-manrope text-vh-muted">{`${it.configLabel} · ${it.colorName}`}</span>
                      <span className="font-semibold text-vh-12-5 font-manrope text-vh-soft">{fmt(it.unitPrice)} /un.</span>
                    </div>
                    <div className="flex items-center border border-vh-border rounded-vh-9 overflow-hidden">
                      <button className="vh-qty w-8.5 h-9.5 bg-vh-panel border-0 text-white font-bold text-vh-16 font-space-grotesk cursor-pointer" onClick={() => updateQty(it.key, it.qty - 1)}>−</button>
                      <span className="w-9.5 text-center font-bold text-vh-14 font-space-grotesk">{it.qty}</span>
                      <button className="vh-qty w-8.5 h-9.5 bg-vh-panel border-0 text-white font-bold text-vh-16 font-space-grotesk cursor-pointer" onClick={() => updateQty(it.key, it.qty + 1)}>+</button>
                    </div>
                    <span className="min-w-25 text-right font-bold text-vh-17 font-space-grotesk text-vh-lime">{fmt(it.unitPrice * it.qty)}</span>
                    <button className="vh-remove w-8.5 h-8.5 bg-transparent border border-vh-border rounded-vh-9 text-vh-muted font-semibold text-vh-14 font-space-grotesk cursor-pointer [transition:border-color_.12s,color_.12s]" onClick={() => removeItem(it.key)} title="Remover">✕</button>
                  </div>
                ))}
              </div>
              <div className="bg-[linear-gradient(160deg,#22003D,#1D0333)] border border-vh-border rounded-2xl p-6.5 flex flex-wrap gap-5 items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-vh-13 font-manrope text-vh-muted">Valor total estimado ({cartCount} item(ns))</span>
                  <span className="font-bold text-vh-30 font-space-grotesk text-vh-lime">{fmt(cartTotal)}</span>
                  <span className="font-medium text-vh-12 font-manrope text-vh-muted">Valores confirmados com o atendente no WhatsApp</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Link className="vh-ghost-violet bg-transparent border border-vh-violet rounded-vh-11 py-3.75 px-6 font-semibold text-vh-14 font-space-grotesk cursor-pointer text-white!" href="/">Continuar explorando</Link>
                  <button className="vh-btn-lime bg-vh-lime border-0 rounded-vh-11 py-3.75 px-7 font-bold text-vh-14 font-space-grotesk cursor-pointer shadow-vh-lime-24 text-vh-ink!" onClick={() => setStep("review")}>Revisar solicitação →</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== REVIEW ===== */}
      {step === "review" && (
        <section className="max-w-215 my-0 mx-auto py-10 px-6 w-full">
          <div className="flex gap-2 items-center justify-center mb-7.5 flex-wrap">
            <span className="font-bold text-vh-12 font-space-grotesk text-vh-lime">✓ 1. Lista</span><span className="w-7 h-0.25 bg-vh-border"></span>
            <span className="font-bold text-vh-12 font-space-grotesk text-white bg-vh-violet py-1.5 px-3 rounded-2xl">2. Revisão</span><span className="w-7 h-0.25 bg-vh-border"></span>
            <span className="font-bold text-vh-12 font-space-grotesk text-vh-muted">3. WhatsApp</span>
          </div>
          <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-30 font-space-grotesk text-center">Revise sua solicitação</h1>
          <p className="mt-0 mx-0 mb-7 font-medium text-vh-14 font-manrope text-vh-muted text-center">Confira os itens e informe seu nome — nosso atendente vai te chamar pelo nome.</p>
          <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3 mb-4.5">
            {cart.map((it) => (
              <div key={it.key} className="flex justify-between gap-3.5 pb-3 border-b border-b-vh-panel flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-vh-14 font-space-grotesk">{it.qty}× {it.productName}</span>
                  <span className="font-medium text-vh-12 font-manrope text-vh-muted">{`${it.configLabel} · ${it.colorName}`}</span>
                </div>
                <span className="font-bold text-vh-15 font-space-grotesk text-vh-lime">{fmt(it.unitPrice * it.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-vh-14 font-space-grotesk text-vh-soft">Total estimado</span>
              <span className="font-bold text-vh-24 font-space-grotesk text-vh-lime">{fmt(cartTotal)}</span>
            </div>
          </div>
          <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3.5 mb-4.5">
            <label className="font-bold text-vh-12-5 font-space-grotesk tracking-vh-006 uppercase text-vh-soft">Seu nome *</label>
            <input className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.5 px-4 text-white font-medium text-vh-14 font-manrope outline-none [transition:border-color_.15s]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />
            <span className="font-bold text-vh-12-5 font-space-grotesk tracking-vh-006 uppercase text-vh-soft mt-1.5">Prévia da mensagem</span>
            <div className="bg-vh-chat-bg rounded-vh-14 p-4 border border-vh-chat-border">
              <div className="bg-vh-teal rounded-[12px_12px_4px_12px] py-3.5 px-4 max-w-[92%] ml-auto">
                <pre className="m-0 whitespace-pre-wrap font-medium text-vh-12-5/vh-16 font-manrope text-vh-chat-text">{buildMsg(name.trim())}</pre>
              </div>
            </div>
          </div>
          {nameOk ? (
            <button className="vh-finalize w-full flex items-center justify-center gap-2.5 bg-vh-wa border-0 rounded-xl p-4.5 font-bold text-vh-16 font-space-grotesk cursor-pointer shadow-vh-wa-34-soft [transition:filter_.15s] text-vh-wa-dark!" onClick={() => { window.open(waCartUrl, "_blank"); setStep("sent"); }}><span className="w-2.5 h-2.5 bg-vh-wa-dark rounded-full"></span>Finalizar pelo WhatsApp</button>
          ) : (
            <button disabled className="w-full bg-vh-border text-vh-muted border-0 rounded-xl p-4.5 font-bold text-vh-16 font-space-grotesk cursor-not-allowed">Informe seu nome para continuar</button>
          )}
          <p className="mt-3.5 mx-0 mb-0 text-center font-medium text-vh-12 font-manrope text-vh-muted">Você será redirecionado ao WhatsApp com a mensagem pronta. Nenhum pagamento é feito neste site.</p>
        </section>
      )}

      {/* ===== SENT ===== */}
      {step === "sent" && (
        <section className="max-w-155 my-0 mx-auto py-20 px-6 w-full text-center">
          <div className="w-18.5 h-18.5 mt-0 mx-auto mb-5.5 rounded-full bg-vh-wa/12 border-2 border-vh-wa flex items-center justify-center font-bold text-vh-32 font-space-grotesk text-vh-wa shadow-vh-wa-40">✓</div>
          <h1 className="mt-0 mx-0 mb-2.5 font-bold text-vh-30 font-space-grotesk">Solicitação enviada!</h1>
          <p className="mt-0 mx-0 mb-6.5 font-medium text-vh-14-5/vh-17 font-manrope text-vh-soft">Abrimos o WhatsApp com sua mensagem pronta. Se a janela não abriu, toque no botão abaixo — nosso time responde rapidinho.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a className="vh-wa inline-flex items-center gap-2.25 bg-vh-wa rounded-vh-11 py-3.75 px-6.5 font-bold text-vh-14 font-space-grotesk text-vh-wa-dark!" href={waCartUrl} target="_blank"><span className="w-2.25 h-2.25 bg-vh-wa-dark rounded-full"></span>Abrir WhatsApp novamente</a>
            <Link className="vh-ghost-violet bg-transparent border border-vh-violet rounded-vh-11 py-3.75 px-6.5 font-semibold text-vh-14 font-space-grotesk cursor-pointer text-white!" href="/" onClick={() => { clear(); setName(""); setStep("cart"); }}>Voltar à loja</Link>
          </div>
        </section>
      )}
    </div>
  );
}
