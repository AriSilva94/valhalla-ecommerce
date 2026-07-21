"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { css } from "../lib/css";
import { fmt, waUrl } from "../lib/wa";
import { useCart } from "./CartProvider";
import ProductCard, { CardVM } from "./ProductCard";
import type { Product } from "../lib/strapi";

function toCardVM(p: Product, addItem: ReturnType<typeof useCart>["addItem"]): CardVM {
  const v = p.variants.find((x) => x.available) ?? p.variants[0];
  const price = v?.price ?? p.basePrice;
  const oldPrice = v?.compareAtPrice ?? null;
  const disc = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;
  const allUnavailable = p.variants.length > 0 && p.variants.every((x) => !x.available);
  const tagNovo = p.tags.some((t) => t.slug === "novo");
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name ?? "",
    priceF: fmt(price),
    oldPriceF: oldPrice ? fmt(oldPrice) : null,
    badge: allUnavailable ? null : oldPrice ? "-" + disc + "%" : tagNovo ? "NOVO" : null,
    badgeBg: oldPrice ? "#8CFF00" : "#8B2CF5",
    badgeFg: oldPrice ? "#09050D" : "#FFFFFF",
    out: allUnavailable,
    canAdd: !allUnavailable,
    image: p.mainImage,
    add: () => {
      if (!v) return;
      addItem(
        { productSlug: p.slug, productName: p.name, variantSku: v.sku, colorName: v.color.name, configLabel: v.configLabel, unitPrice: v.price },
        1
      );
    },
  };
}

export default function ProductDetailClient({
  product,
  related,
  whatsappNumber,
}: {
  product: Product;
  related: Product[];
  whatsappNumber: string;
}) {
  const { addItem } = useCart();
  // colors and configs are two independent axes: derive the distinct color list and distinct
  // configLabel list from `product.variants`, matching the original data model's `p.colors`/`p.vars`.
  const colors = Array.from(new Map(product.variants.map((v) => [v.color.name, v.color])).values());
  const configLabels = Array.from(new Set(product.variants.map((v) => v.configLabel)));
  const cheapestPrice = Math.min(...product.variants.map((v) => v.price));

  const [selColorName, setSelColorName] = useState(colors[0]?.name ?? "");
  const [selConfigLabel, setSelConfigLabel] = useState(configLabels[0] ?? "");
  const [qty, setQty] = useState(1);
  const [selImageIdx, setSelImageIdx] = useState(0);

  const selectedVariant =
    product.variants.find((v) => v.color.name === selColorName && v.configLabel === selConfigLabel) ?? product.variants[0];

  const allUnavailable = product.variants.length > 0 && product.variants.every((v) => !v.available);
  const out = allUnavailable;
  const varBad = !selectedVariant?.available;
  const unit = selectedVariant?.price ?? product.basePrice;

  const stockMap: Record<string, string[]> = {
    available: ["Em estoque", "rgba(140,255,0,.1)", "#8CFF00", "rgba(140,255,0,.4)"],
    unavailable: ["Indisponível", "rgba(255,77,109,.1)", "#FF4D6D", "rgba(255,77,109,.4)"],
  };
  const st = out ? stockMap.unavailable : stockMap.available;

  const buyNowUrl = waUrl(
    whatsappNumber,
    "Olá, equipe Valhalla Tecnologia!\n\nTenho interesse neste produto:\n\n1. " +
      product.name +
      "\nModelo: " +
      selConfigLabel +
      "\nCor: " +
      selColorName +
      "\nQuantidade: " +
      qty +
      "\nPreço apresentado: " +
      fmt(unit) +
      "\nLink: valhalla.tec.br/produto/" +
      product.slug +
      "\n\nGostaria de confirmar a disponibilidade e finalizar a compra com um atendente."
  );
  const notifyUrl = waUrl(whatsappNumber, `Olá! Quero ser avisado(a) quando o produto "${product.name}" voltar ao estoque na Valhalla Tecnologia.`);

  const pCode = "VLH-" + product.slug.toUpperCase();
  const pBadge = selectedVariant?.compareAtPrice ? "-" + Math.round((1 - selectedVariant.price / selectedVariant.compareAtPrice) * 100) + "% OFF" : null;

  // mainImage first, then the gallery, so index 0 is always the cover.
  const photos = [product.mainImage, ...product.gallery].filter(Boolean) as NonNullable<typeof product.mainImage>[];
  const selPhoto = photos[selImageIdx] ?? photos[0] ?? null;
  const pOldPriceF = selectedVariant?.compareAtPrice ? fmt(selectedVariant.compareAtPrice) : null;
  const pCanBuy = !out && !varBad;
  const pVarUnavailable = varBad && !out;
  const pSubtotalF = fmt(unit * qty);

  return (
    <section style={css("max-width:1240px;margin:0 auto;padding:36px 24px;width:100%")}>
      <p style={css("margin:0 0 20px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}>
        <Link href="/" style={css("cursor:pointer;color:#B056FF")}>Início</Link> / {product.category && (<>
          <Link href={`/categoria/${product.category.slug}`} style={css("cursor:pointer;color:#B056FF")}>{product.category.name}</Link> / </>)}{product.name}
      </p>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:44px;align-items:start")}>
        <div style={css("display:flex;flex-direction:column;gap:12px")}>
          <div style={css("position:relative;aspect-ratio:1/1;background:repeating-linear-gradient(45deg,#2A0A45 0 14px,#24063C 14px 28px);border:1px solid #341052;border-radius:18px;display:flex;align-items:center;justify-content:center")}>
            {selPhoto ? (
              <Image
                src={selPhoto.url}
                alt={selPhoto.alternativeText ?? product.name}
                fill
                priority
                sizes="(max-width:768px) 100vw, 560px"
                style={{ objectFit: "contain", borderRadius: 18 }}
              />
            ) : (
              <span style={css("font:500 12px ui-monospace,Menlo,monospace;color:#9690A3;background:rgba(9,5,13,.55);padding:6px 12px;border-radius:6px")}>[foto principal: {product.name}]</span>
            )}
            {pBadge && (
              <span style={css("position:absolute;top:14px;left:14px;font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:6px 11px;border-radius:7px;background:#8CFF00;color:#09050D")}>{pBadge}</span>
            )}
          </div>
          <div style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:10px")}>
            {photos.slice(0, 8).map((ph, i) => (
              <button
                key={ph.url}
                type="button"
                className="vh-thumb"
                onClick={() => setSelImageIdx(i)}
                aria-label={`Ver foto ${i + 1} de ${photos.length}`}
                style={{
                  ...css("position:relative;aspect-ratio:1/1;background:#1D0333;border-radius:10px;cursor:pointer;transition:border-color .12s;padding:0;overflow:hidden"),
                  border: "1px solid " + (i === selImageIdx ? "#8CFF00" : "#341052"),
                }}
              >
                <Image src={ph.url} alt="" fill sizes="120px" style={{ objectFit: "contain" }} />
              </button>
            ))}
          </div>
        </div>
        <div style={css("display:flex;flex-direction:column;gap:16px")}>
          <div style={css("display:flex;flex-direction:column;gap:6px")}>
            <span style={css("font:600 11.5px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF")}>{product.brand?.name}</span>
            <h1 style={css("margin:0;font:700 clamp(24px,3vw,32px)/1.15 'Space Grotesk',sans-serif")}>{product.name}</h1>
            <span style={css("font:500 12px ui-monospace,Menlo,monospace;color:#9690A3")}>Cód. {pCode}</span>
          </div>
          <span style={{ ...css("align-self:flex-start;font:700 11.5px 'Space Grotesk',sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:20px"), background: st[1], color: st[2], border: "1px solid " + st[3] }}>{st[0]}</span>
          <div style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:2px")}>
            {pOldPriceF && (
              <span style={css("font:500 14px 'Manrope',sans-serif;color:#9690A3;text-decoration:line-through")}>{pOldPriceF}</span>
            )}
            <span style={css("font:700 34px 'Space Grotesk',sans-serif;color:#8CFF00")}>{fmt(unit)}</span>
            <span style={css("font:500 12.5px 'Manrope',sans-serif;color:#9690A3")}>Preço à vista de referência · condições finais com o atendente</span>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0")}>Cor: <span style={css("color:#8CFF00")}>{selColorName}</span></span>
            <div style={css("display:flex;gap:10px;flex-wrap:wrap")}>
              {colors.map((c, i) => {
                const unav = product.variants.filter((v) => v.color.name === c.name).every((v) => !v.available);
                const selected = c.name === selColorName;
                return (
                  <span key={i} onClick={() => setSelColorName(c.name)} title={c.name + (unav ? " (indisponível)" : "")} style={{ ...css("position:relative;width:34px;height:34px;border-radius:50%;transition:box-shadow .12s"), background: c.hex, cursor: unav ? "not-allowed" : "pointer", opacity: unav ? 0.45 : 1, boxShadow: "0 0 0 2px #120020,0 0 0 4px " + (selected ? "#8CFF00" : unav ? "#22003D" : "#341052") }}>
                    {unav && (<span style={css("position:absolute;left:-4px;right:-4px;top:50%;height:2px;background:#9690A3;transform:rotate(-45deg)")}></span>)}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0")}>{product.variantGroupLabel}</span>
            <div style={css("display:flex;gap:10px;flex-wrap:wrap")}>
              {configLabels.map((label, i) => {
                const variantsForLabel = product.variants.filter((v) => v.configLabel === label);
                const unav = variantsForLabel.every((v) => !v.available);
                const sel = label === selConfigLabel;
                const repVariant =
                  variantsForLabel.find((v) => v.color.name === selColorName) ??
                  variantsForLabel.reduce((a, b) => (b.price < a.price ? b : a), variantsForLabel[0]);
                const delta = repVariant.price - cheapestPrice;
                const labelF = label + (delta > 0 ? " · +" + fmt(delta) : "");
                return (
                  <span key={i} onClick={() => setSelConfigLabel(label)} style={{ ...css("font:600 13px 'Space Grotesk',sans-serif;padding:10px 16px;border-radius:10px;transition:border-color .12s"), cursor: unav ? "not-allowed" : "pointer", border: "1px solid " + (sel ? "#8CFF00" : "#341052"), color: unav ? "#9690A3" : sel ? "#8CFF00" : "#FFFFFF", background: sel ? "rgba(140,255,0,.08)" : "transparent", textDecoration: unav ? "line-through" : "none" }}>{labelF}</span>
                );
              })}
            </div>
            {pVarUnavailable && (
              <div style={css("display:flex;gap:10px;align-items:center;background:rgba(255,176,32,.08);border:1px solid rgba(255,176,32,.4);border-radius:10px;padding:11px 14px;font:600 12.5px 'Manrope',sans-serif;color:#FFB020")}><span style={css("width:8px;height:8px;background:#FFB020;border-radius:50%")}></span>Variação indisponível no momento — escolha outra opção ou consulte o atendente.</div>
            )}
          </div>
          <div style={css("display:flex;gap:12px;align-items:center;flex-wrap:wrap")}>
            <div style={css("display:flex;align-items:center;border:1px solid #341052;border-radius:10px;overflow:hidden")}>
              <button className="vh-qty" onClick={() => setQty((n) => Math.max(n - 1, 1))} style={css("width:40px;height:44px;background:#1D0333;border:none;color:#FFFFFF;font:700 18px 'Space Grotesk',sans-serif;cursor:pointer")}>−</button>
              <span style={css("width:48px;text-align:center;font:700 15px 'Space Grotesk',sans-serif")}>{qty}</span>
              <button className="vh-qty" onClick={() => setQty((n) => Math.min(n + 1, 10))} style={css("width:40px;height:44px;background:#1D0333;border:none;color:#FFFFFF;font:700 18px 'Space Grotesk',sans-serif;cursor:pointer")}>+</button>
            </div>
            <span style={css("font:500 12.5px 'Manrope',sans-serif;color:#9690A3")}>Subtotal: <span style={css("color:#8CFF00;font:700 14px 'Space Grotesk',sans-serif")}>{pSubtotalF}</span></span>
          </div>
          <div style={css("display:flex;gap:12px;flex-wrap:wrap")}>
            {pCanBuy && (
              <>
                <button
                  className="vh-btn-lime"
                  onClick={() =>
                    addItem(
                      {
                        productSlug: product.slug,
                        productName: product.name,
                        variantSku: selectedVariant.sku,
                        colorName: selColorName,
                        configLabel: selConfigLabel,
                        unitPrice: unit,
                      },
                      qty
                    )
                  }
                  style={css("flex:1;min-width:180px;background:#8CFF00;color:#09050D;border:none;border-radius:11px;padding:16px 20px;font:700 14.5px 'Space Grotesk',sans-serif;cursor:pointer;box-shadow:0 0 24px rgba(140,255,0,.28);transition:background .15s")}
                >
                  Adicionar à lista
                </button>
                <a className="vh-wa" href={buyNowUrl} target="_blank" style={css("flex:1;min-width:180px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#062e17;border-radius:11px;padding:16px 20px;font:700 14.5px 'Space Grotesk',sans-serif;transition:filter .15s")}><span style={css("width:9px;height:9px;background:#062e17;border-radius:50%")}></span>Comprar pelo WhatsApp</a>
              </>
            )}
            {out && (
              <>
                <button disabled style={css("flex:1;min-width:180px;background:#341052;color:#9690A3;border:none;border-radius:11px;padding:16px 20px;font:700 14.5px 'Space Grotesk',sans-serif;cursor:not-allowed")}>Produto indisponível</button>
                <a className="vh-wa-outline" href={notifyUrl} target="_blank" style={css("flex:1;min-width:180px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:1px solid #25D366;color:#25D366;border-radius:11px;padding:15px 20px;font:700 14.5px 'Space Grotesk',sans-serif")}>Avise-me quando chegar</a>
              </>
            )}
          </div>
          <div style={css("display:flex;flex-direction:column;gap:9px;background:#1D0333;border:1px solid #341052;border-radius:14px;padding:16px 20px")}>
            <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#8CFF00")}>✓</span> Garantia: {product.warranty}</span>
            <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#8CFF00")}>✓</span> Retirada na loja ou entrega combinada com o atendente</span>
            <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#8CFF00")}>✓</span> Produto original, lacrado e com nota fiscal</span>
          </div>
          <div style={css("display:flex;gap:10px;align-items:flex-start;background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.35);border-radius:12px;padding:13px 16px")}>
            <span style={css("width:9px;height:9px;margin-top:4px;background:#25D366;border-radius:50%;flex:none")}></span>
            <span style={css("font:600 12.5px/1.55 'Manrope',sans-serif;color:#D8D5E0")}>A compra é concluída com um atendente pelo WhatsApp. Nenhum pagamento é feito neste site.</span>
          </div>
        </div>
      </div>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:52px")}>
        <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:26px")}>
          <h3 style={css("margin:0 0 16px;font:700 17px 'Space Grotesk',sans-serif;color:#B056FF")}>Especificações técnicas</h3>
          {product.specs.map((s, i) => (
            <div key={i} style={css("display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #22003D")}>
              <span style={css("font:600 13px 'Manrope',sans-serif;color:#9690A3")}>{s.key}</span>
              <span style={css("font:600 13px 'Manrope',sans-serif;color:#FFFFFF;text-align:right")}>{s.value}</span>
            </div>
          ))}
        </div>
        <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:26px")}>
          <h3 style={css("margin:0 0 12px;font:700 17px 'Space Grotesk',sans-serif;color:#B056FF")}>Descrição</h3>
          <p style={css("margin:0;font:500 14px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>{product.description}</p>
          <h3 style={css("margin:22px 0 12px;font:700 17px 'Space Grotesk',sans-serif;color:#B056FF")}>Entrega e retirada</h3>
          <p style={css("margin:0;font:500 14px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>Retire na loja em Macapá-AP ou combine a entrega diretamente com o atendente. Prazos e valores de frete são confirmados no WhatsApp antes da compra.</p>
        </div>
      </div>
      <h2 style={css("margin:52px 0 20px;font:700 24px 'Space Grotesk',sans-serif")}>Produtos relacionados</h2>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
        {related.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} />))}
      </div>
    </section>
  );
}
