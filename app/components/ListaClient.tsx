"use client";

import { useState } from "react";
import Link from "next/link";
import { css } from "../lib/css";
import { fmt, waUrl } from "../lib/wa";
import { useCart } from "./CartProvider";

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
          "\nLink: valhalla.tec.br/p/" +
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
        <section style={css("max-width:1240px;margin:0 auto;padding:40px 24px;width:100%")}>
          <p style={css("margin:0 0 6px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}><Link href="/" style={css("cursor:pointer;color:#B056FF")}>Início</Link> / Minha lista</p>
          <h1 style={css("margin:0 0 26px;font:700 34px 'Space Grotesk',sans-serif")}>Minha lista de interesse</h1>
          {cart.length === 0 && (
            <div style={css("text-align:center;padding:70px 24px;background:#1D0333;border:1px dashed #341052;border-radius:16px")}>
              <span style={css("display:inline-block;width:16px;height:16px;border:3px solid #8CFF00;border-radius:4px;margin-bottom:14px")}></span>
              <h3 style={css("margin:0 0 8px;font:700 20px 'Space Grotesk',sans-serif")}>Sua lista está vazia</h3>
              <p style={css("margin:0 0 20px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>Explore o catálogo e adicione os produtos que você quer negociar com nosso time.</p>
              <Link className="vh-btn-lime" href="/" style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:14px 26px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Explorar produtos</Link>
            </div>
          )}
          {cartCount > 0 && (
            <div style={css("display:grid;grid-template-columns:1fr;gap:28px;max-width:1100px")}>
              <div style={css("display:flex;flex-direction:column;gap:12px")}>
                {cart.map((it) => (
                  <div key={it.key} style={css("display:flex;gap:16px;align-items:center;background:#1D0333;border:1px solid #341052;border-radius:14px;padding:16px;flex-wrap:wrap")}>
                    <Link href={`/p/${it.productSlug}`} style={css("width:76px;height:76px;flex:none;background:repeating-linear-gradient(45deg,#2A0A45 0 8px,#24063C 8px 16px);border:1px solid #341052;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer")}><span style={css("font:500 9px ui-monospace,monospace;color:#9690A3")}>[foto]</span></Link>
                    <div style={css("flex:1;min-width:170px;display:flex;flex-direction:column;gap:3px")}>
                      <Link className="vh-lime" href={`/p/${it.productSlug}`} style={css("font:700 14.5px 'Space Grotesk',sans-serif;cursor:pointer")}>{it.productName}</Link>
                      <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>{`${it.configLabel} · ${it.colorName}`}</span>
                      <span style={css("font:600 12.5px 'Manrope',sans-serif;color:#D8D5E0")}>{fmt(it.unitPrice)} /un.</span>
                    </div>
                    <div style={css("display:flex;align-items:center;border:1px solid #341052;border-radius:9px;overflow:hidden")}>
                      <button className="vh-qty" onClick={() => updateQty(it.key, it.qty - 1)} style={css("width:34px;height:38px;background:#22003D;border:none;color:#FFFFFF;font:700 16px 'Space Grotesk',sans-serif;cursor:pointer")}>−</button>
                      <span style={css("width:38px;text-align:center;font:700 14px 'Space Grotesk',sans-serif")}>{it.qty}</span>
                      <button className="vh-qty" onClick={() => updateQty(it.key, it.qty + 1)} style={css("width:34px;height:38px;background:#22003D;border:none;color:#FFFFFF;font:700 16px 'Space Grotesk',sans-serif;cursor:pointer")}>+</button>
                    </div>
                    <span style={css("min-width:100px;text-align:right;font:700 17px 'Space Grotesk',sans-serif;color:#8CFF00")}>{fmt(it.unitPrice * it.qty)}</span>
                    <button className="vh-remove" onClick={() => removeItem(it.key)} title="Remover" style={css("width:34px;height:34px;background:transparent;border:1px solid #341052;border-radius:9px;color:#9690A3;font:600 14px 'Space Grotesk',sans-serif;cursor:pointer;transition:border-color .12s,color .12s")}>✕</button>
                  </div>
                ))}
              </div>
              <div style={css("background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:16px;padding:26px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between")}>
                <div style={css("display:flex;flex-direction:column;gap:4px")}>
                  <span style={css("font:600 13px 'Manrope',sans-serif;color:#9690A3")}>Valor total estimado ({cartCount} item(ns))</span>
                  <span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>{fmt(cartTotal)}</span>
                  <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>Valores confirmados com o atendente no WhatsApp</span>
                </div>
                <div style={css("display:flex;gap:12px;flex-wrap:wrap")}>
                  <Link className="vh-ghost-violet" href="/" style={css("background:transparent;border:1px solid #8B2CF5;color:#FFFFFF;border-radius:11px;padding:15px 24px;font:600 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Continuar explorando</Link>
                  <button className="vh-btn-lime" onClick={() => setStep("review")} style={css("background:#8CFF00;color:#09050D;border:none;border-radius:11px;padding:15px 28px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer;box-shadow:0 0 24px rgba(140,255,0,.28)")}>Revisar solicitação →</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== REVIEW ===== */}
      {step === "review" && (
        <section style={css("max-width:860px;margin:0 auto;padding:40px 24px;width:100%")}>
          <div style={css("display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:30px;flex-wrap:wrap")}>
            <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#8CFF00")}>✓ 1. Lista</span><span style={css("width:28px;height:1px;background:#341052")}></span>
            <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#FFFFFF;background:#8B2CF5;padding:6px 12px;border-radius:16px")}>2. Revisão</span><span style={css("width:28px;height:1px;background:#341052")}></span>
            <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#9690A3")}>3. WhatsApp</span>
          </div>
          <h1 style={css("margin:0 0 8px;font:700 30px 'Space Grotesk',sans-serif;text-align:center")}>Revise sua solicitação</h1>
          <p style={css("margin:0 0 28px;font:500 14px 'Manrope',sans-serif;color:#9690A3;text-align:center")}>Confira os itens e informe seu nome — nosso atendente vai te chamar pelo nome.</p>
          <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:12px;margin-bottom:18px")}>
            {cart.map((it) => (
              <div key={it.key} style={css("display:flex;justify-content:space-between;gap:14px;padding-bottom:12px;border-bottom:1px solid #22003D;flex-wrap:wrap")}>
                <div style={css("display:flex;flex-direction:column;gap:2px")}>
                  <span style={css("font:700 14px 'Space Grotesk',sans-serif")}>{it.qty}× {it.productName}</span>
                  <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>{`${it.configLabel} · ${it.colorName}`}</span>
                </div>
                <span style={css("font:700 15px 'Space Grotesk',sans-serif;color:#8CFF00")}>{fmt(it.unitPrice * it.qty)}</span>
              </div>
            ))}
            <div style={css("display:flex;justify-content:space-between;align-items:baseline")}>
              <span style={css("font:700 14px 'Space Grotesk',sans-serif;color:#D8D5E0")}>Total estimado</span>
              <span style={css("font:700 24px 'Space Grotesk',sans-serif;color:#8CFF00")}>{fmt(cartTotal)}</span>
            </div>
          </div>
          <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:14px;margin-bottom:18px")}>
            <label style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0")}>Seu nome *</label>
            <input className="vh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:14px 16px;color:#FFFFFF;font:500 14px 'Manrope',sans-serif;outline:none;transition:border-color .15s")} />
            <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0;margin-top:6px")}>Prévia da mensagem</span>
            <div style={css("background:#0b141a;border-radius:14px;padding:16px;border:1px solid #1f2c34")}>
              <div style={css("background:#005c4b;border-radius:12px 12px 4px 12px;padding:14px 16px;max-width:92%;margin-left:auto")}>
                <pre style={css("margin:0;white-space:pre-wrap;font:500 12.5px/1.6 'Manrope',sans-serif;color:#e9edef")}>{buildMsg(name.trim())}</pre>
              </div>
            </div>
          </div>
          {nameOk ? (
            <button className="vh-finalize" onClick={() => { window.open(waCartUrl, "_blank"); setStep("sent"); }} style={css("width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#25D366;color:#062e17;border:none;border-radius:12px;padding:18px;font:700 16px 'Space Grotesk',sans-serif;cursor:pointer;box-shadow:0 0 34px rgba(37,211,102,.35);transition:filter .15s")}><span style={css("width:10px;height:10px;background:#062e17;border-radius:50%")}></span>Finalizar pelo WhatsApp</button>
          ) : (
            <button disabled style={css("width:100%;background:#341052;color:#9690A3;border:none;border-radius:12px;padding:18px;font:700 16px 'Space Grotesk',sans-serif;cursor:not-allowed")}>Informe seu nome para continuar</button>
          )}
          <p style={css("margin:14px 0 0;text-align:center;font:500 12px 'Manrope',sans-serif;color:#9690A3")}>Você será redirecionado ao WhatsApp com a mensagem pronta. Nenhum pagamento é feito neste site.</p>
        </section>
      )}

      {/* ===== SENT ===== */}
      {step === "sent" && (
        <section style={css("max-width:620px;margin:0 auto;padding:80px 24px;width:100%;text-align:center")}>
          <div style={css("width:74px;height:74px;margin:0 auto 22px;border-radius:50%;background:rgba(37,211,102,.12);border:2px solid #25D366;display:flex;align-items:center;justify-content:center;font:700 32px 'Space Grotesk',sans-serif;color:#25D366;box-shadow:0 0 40px rgba(37,211,102,.3)")}>✓</div>
          <h1 style={css("margin:0 0 10px;font:700 30px 'Space Grotesk',sans-serif")}>Solicitação enviada!</h1>
          <p style={css("margin:0 0 26px;font:500 14.5px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>Abrimos o WhatsApp com sua mensagem pronta. Se a janela não abriu, toque no botão abaixo — nosso time responde rapidinho.</p>
          <div style={css("display:flex;gap:12px;justify-content:center;flex-wrap:wrap")}>
            <a className="vh-wa" href={waCartUrl} target="_blank" style={css("display:inline-flex;align-items:center;gap:9px;background:#25D366;color:#062e17;border-radius:11px;padding:15px 26px;font:700 14px 'Space Grotesk',sans-serif")}><span style={css("width:9px;height:9px;background:#062e17;border-radius:50%")}></span>Abrir WhatsApp novamente</a>
            <Link className="vh-ghost-violet" href="/" onClick={() => { clear(); setName(""); setStep("cart"); }} style={css("background:transparent;border:1px solid #8B2CF5;color:#FFFFFF;border-radius:11px;padding:15px 26px;font:600 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Voltar à loja</Link>
          </div>
        </section>
      )}
    </div>
  );
}
