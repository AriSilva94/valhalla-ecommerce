"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fmt, waUrl } from "../lib/wa";
import { useCart } from "./CartProvider";
import ProductCard, { CardVM } from "./ProductCard";
import type { Product } from "../lib/strapi";
import { bgClass, borderClass, ringShadowClass, textClass } from "../lib/color-classes";
import { cn } from "../lib/cn";

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
    <section className="max-w-310 my-0 mx-auto py-9 px-6 w-full">
      <p className="mt-0 mx-0 mb-5 font-semibold text-vh-12 font-space-grotesk text-vh-muted">
        <Link href="/" className="cursor-pointer text-vh-accent">Início</Link> / {product.category && (<>
          <Link href={`/categoria/${product.category.slug}`} className="cursor-pointer text-vh-accent">{product.category.name}</Link> / </>)}{product.name}
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-11 items-start">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square bg-[repeating-linear-gradient(45deg,#2A0A45_0_14px,#24063C_14px_28px)] border border-vh-border rounded-vh-18 flex items-center justify-center">
            {selPhoto ? (
              <Image
                src={selPhoto.url}
                alt={selPhoto.alternativeText ?? product.name}
                fill
                priority
                sizes="(max-width:768px) 100vw, 560px"
                className="rounded-vh-18 object-contain"
              />
            ) : (
              <span className="font-medium text-vh-12 font-mono text-vh-muted bg-vh-ink/55 py-1.5 px-3 rounded-md">[foto principal: {product.name}]</span>
            )}
            {pBadge && (
              <span className="absolute top-3.5 left-3.5 font-bold text-vh-12 font-space-grotesk tracking-vh-006 uppercase py-1.5 px-2.75 rounded-vh-7 bg-vh-lime text-vh-ink">{pBadge}</span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {photos.slice(0, 8).map((ph, i) => (
              <button
                key={ph.url}
                type="button"
                className={cn("vh-thumb relative aspect-square bg-vh-card rounded-vh-10 cursor-pointer [transition:border-color_.12s] p-0 overflow-hidden border", i === selImageIdx ? "border-vh-lime" : "border-vh-border")}
                onClick={() => setSelImageIdx(i)}
                aria-label={`Ver foto ${i + 1} de ${photos.length}`}
              >
                <Image src={ph.url} alt="" fill sizes="120px" className="object-contain" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-vh-11-5 font-space-grotesk tracking-vh-014 uppercase text-vh-accent">{product.brand?.name}</span>
            <h1 className="m-0 font-bold text-[clamp(24px,3vw,32px)]/vh-115 font-space-grotesk">{product.name}</h1>
            <span className="font-medium text-vh-12 font-mono text-vh-muted">Cód. {pCode}</span>
          </div>
          <span className={cn("self-start font-bold text-vh-11-5 font-space-grotesk tracking-vh-008 uppercase py-1.5 px-3 rounded-vh-20 border", bgClass(st[1]), textClass(st[2]), borderClass(st[3]))}>{st[0]}</span>
          <div className="bg-vh-card border border-vh-border rounded-vh-14 py-4.5 px-5 flex flex-col gap-0.5">
            {pOldPriceF && (
              <span className="font-medium text-vh-14 font-manrope text-vh-muted line-through">{pOldPriceF}</span>
            )}
            <span className="font-bold text-vh-34 font-space-grotesk text-vh-lime">{fmt(unit)}</span>
            <span className="font-medium text-vh-12-5 font-manrope text-vh-muted">Preço à vista de referência · condições finais com o atendente</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-bold text-vh-12-5 font-space-grotesk tracking-vh-006 uppercase text-vh-soft">Cor: <span className="text-vh-lime">{selColorName}</span></span>
            <div className="flex gap-2.5 flex-wrap">
              {colors.map((c, i) => {
                const unav = product.variants.filter((v) => v.color.name === c.name).every((v) => !v.available);
                const selected = c.name === selColorName;
                return (
                  <span
                    key={i}
                    onClick={() => setSelColorName(c.name)}
                    title={c.name + (unav ? " (indisponível)" : "")}
                    className={cn("relative w-8.5 h-8.5 rounded-full [transition:box-shadow_.12s]", bgClass(c.hex), unav ? "cursor-not-allowed opacity-45" : "cursor-pointer opacity-100", ringShadowClass(selected ? "#8CFF00" : unav ? "#22003D" : "#341052"))}
                  >
                    {unav && (<span className="absolute -left-1 -right-1 top-1/2 h-0.5 bg-vh-muted -rotate-45"></span>)}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-bold text-vh-12-5 font-space-grotesk tracking-vh-006 uppercase text-vh-soft">{product.variantGroupLabel}</span>
            <div className="flex gap-2.5 flex-wrap">
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
                  <span
                    key={i}
                    onClick={() => setSelConfigLabel(label)}
                    className={cn(
                      "font-semibold text-vh-13 font-space-grotesk py-2.5 px-4 rounded-vh-10 [transition:border-color_.12s] border",
                      unav ? "cursor-not-allowed text-vh-muted line-through" : "cursor-pointer",
                      sel ? "border-vh-lime text-vh-lime bg-vh-lime/8" : "border-vh-border text-white bg-transparent"
                    )}
                  >
                    {labelF}
                  </span>
                );
              })}
            </div>
            {pVarUnavailable && (
              <div className="flex gap-2.5 items-center bg-vh-warning/8 border border-vh-warning/40 rounded-vh-10 py-2.75 px-3.5 font-semibold text-vh-12-5 font-manrope text-vh-warning"><span className="w-2 h-2 bg-vh-warning rounded-full"></span>Variação indisponível no momento — escolha outra opção ou consulte o atendente.</div>
            )}
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center border border-vh-border rounded-vh-10 overflow-hidden">
              <button className="vh-qty w-10 h-11 bg-vh-card border-0 text-white font-bold text-vh-18 font-space-grotesk cursor-pointer" onClick={() => setQty((n) => Math.max(n - 1, 1))}>−</button>
              <span className="w-12 text-center font-bold text-vh-15 font-space-grotesk">{qty}</span>
              <button className="vh-qty w-10 h-11 bg-vh-card border-0 text-white font-bold text-vh-18 font-space-grotesk cursor-pointer" onClick={() => setQty((n) => Math.min(n + 1, 10))}>+</button>
            </div>
            <span className="font-medium text-vh-12-5 font-manrope text-vh-muted">Subtotal: <span className="text-vh-lime font-bold text-vh-14 font-space-grotesk">{pSubtotalF}</span></span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {pCanBuy && (
              <>
                <button
                  className="vh-btn-lime flex-1 min-w-45 bg-vh-lime border-0 rounded-vh-11 py-4 px-5 font-bold text-vh-14-5 font-space-grotesk cursor-pointer shadow-vh-lime-24 [transition:background_.15s] text-vh-ink!"
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
                >
                  Adicionar à lista
                </button>
                <a className="vh-wa flex-1 min-w-45 inline-flex items-center justify-center gap-2 bg-vh-wa rounded-vh-11 py-4 px-5 font-bold text-vh-14-5 font-space-grotesk [transition:filter_.15s] text-vh-wa-dark!" href={buyNowUrl} target="_blank"><span className="w-2.25 h-2.25 bg-vh-wa-dark rounded-full"></span>Comprar pelo WhatsApp</a>
              </>
            )}
            {out && (
              <>
                <button disabled className="flex-1 min-w-45 bg-vh-border text-vh-muted border-0 rounded-vh-11 py-4 px-5 font-bold text-vh-14-5 font-space-grotesk cursor-not-allowed">Produto indisponível</button>
                <a className="vh-wa-outline flex-1 min-w-45 inline-flex items-center justify-center bg-transparent border border-vh-wa rounded-vh-11 py-3.75 px-5 font-bold text-vh-14-5 font-space-grotesk text-vh-wa!" href={notifyUrl} target="_blank">Avise-me quando chegar</a>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2.25 bg-vh-card border border-vh-border rounded-vh-14 py-4 px-5">
            <span className="font-semibold text-vh-13 font-manrope text-vh-soft"><span className="text-vh-lime">✓</span> Garantia: {product.warranty}</span>
            <span className="font-semibold text-vh-13 font-manrope text-vh-soft"><span className="text-vh-lime">✓</span> Retirada na loja ou entrega combinada com o atendente</span>
            <span className="font-semibold text-vh-13 font-manrope text-vh-soft"><span className="text-vh-lime">✓</span> Produto original, lacrado e com nota fiscal</span>
          </div>
          <div className="flex gap-2.5 items-start bg-vh-wa/7 border border-vh-wa/35 rounded-xl py-3.25 px-4">
            <span className="w-2.25 h-2.25 mt-1 bg-vh-wa rounded-full flex-none"></span>
            <span className="font-semibold text-vh-12-5/vh-155 font-manrope text-vh-soft">A compra é concluída com um atendente pelo WhatsApp. Nenhum pagamento é feito neste site.</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 mt-13">
        <div className="bg-vh-card border border-vh-border rounded-2xl p-6.5">
          <h3 className="mt-0 mx-0 mb-4 font-bold text-vh-17 font-space-grotesk text-vh-accent">Especificações técnicas</h3>
          {product.specs.map((s, i) => (
            <div key={i} className="flex justify-between gap-4 py-2.5 px-0 border-b border-b-vh-panel">
              <span className="font-semibold text-vh-13 font-manrope text-vh-muted">{s.key}</span>
              <span className="font-semibold text-vh-13 font-manrope text-white text-right">{s.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-vh-card border border-vh-border rounded-2xl p-6.5">
          <h3 className="mt-0 mx-0 mb-3 font-bold text-vh-17 font-space-grotesk text-vh-accent">Descrição</h3>
          <p className="m-0 font-medium text-vh-14/vh-17 font-manrope text-vh-soft">{product.description}</p>
          <h3 className="mt-5.5 mx-0 mb-3 font-bold text-vh-17 font-space-grotesk text-vh-accent">Entrega e retirada</h3>
          <p className="m-0 font-medium text-vh-14/vh-17 font-manrope text-vh-soft">Retire na loja em Macapá-AP ou combine a entrega diretamente com o atendente. Prazos e valores de frete são confirmados no WhatsApp antes da compra.</p>
        </div>
      </div>
      <h2 className="mt-13 mx-0 mb-5 font-bold text-vh-24 font-space-grotesk">Produtos relacionados</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {related.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} />))}
      </div>
    </section>
  );
}
