"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function CategoryListingClient({
  products,
  crumb,
  title,
  emptyTitle,
  emptyDesc,
  whatsappNumber,
}: {
  products: Product[];
  crumb: string;
  title: string;
  emptyTitle: string;
  emptyDesc: string;
  whatsappNumber: string;
}) {
  const { addItem } = useCart();
  const [sort, setSort] = useState("rel");
  const [brand, setBrand] = useState("Todas");

  const brandsIn = ["Todas", ...Array.from(new Set(products.map((p) => p.brand?.name ?? "").filter(Boolean)))];
  let list = products.filter((p) => brand === "Todas" || p.brand?.name === brand);
  const priceOf = (p: Product) => p.variants[0]?.price ?? p.basePrice;
  const oldOf = (p: Product) => p.variants[0]?.compareAtPrice ?? null;
  if (sort === "asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === "desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
  if (sort === "promo")
    list = [...list].sort((a, b) => {
      const bOld = oldOf(b);
      const aOld = oldOf(a);
      return (bOld ? bOld - priceOf(b) : 0) - (aOld ? aOld - priceOf(a) : 0);
    });

  const brandChips = brandsIn.map((b) => {
    const sel = b === brand;
    return { n: b, bc: sel ? "#8CFF00" : "#341052", fg: sel ? "#8CFF00" : "#D8D5E0", bg: sel ? "rgba(140,255,0,.08)" : "#1D0333", pick: () => setBrand(b) };
  });

  const listingReady = list.length > 0;
  const listingEmpty = list.length === 0;

  const waDirectUrl = waUrl(whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section style={css("max-width:1240px;margin:0 auto;padding:40px 24px;width:100%")}>
      <p style={css("margin:0 0 6px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}>
        <Link href="/" style={css("cursor:pointer;color:#B056FF")}>Início</Link> / {crumb}
      </p>
      <div style={css("display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:20px")}>
        <h1 style={css("margin:0;font:700 34px 'Space Grotesk',sans-serif")}>{title}</h1>
        <span style={css("font:500 13.5px 'Manrope',sans-serif;color:#9690A3")}>{list.length} resultado(s)</span>
      </div>
      <div style={css("display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:24px")}>
        {brandChips.map((b, i) => (
          <span
            key={i}
            className="vh-chip"
            onClick={b.pick}
            style={{ ...css("font:600 12.5px 'Space Grotesk',sans-serif;padding:8px 16px;border-radius:20px;cursor:pointer;transition:border-color .12s"), border: "1px solid " + b.bc, color: b.fg, background: b.bg }}
          >
            {b.n}
          </span>
        ))}
        <span style={css("flex:1")}></span>
        <select
          className="vh-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={css("background:#1D0333;border:1px solid #341052;border-radius:10px;padding:10px 14px;color:#FFFFFF;font:600 12.5px 'Space Grotesk',sans-serif;outline:none;cursor:pointer")}
        >
          <option value="rel">Relevância</option>
          <option value="asc">Menor preço</option>
          <option value="desc">Maior preço</option>
          <option value="promo">Maiores descontos</option>
        </select>
      </div>
      {listingReady && (
        <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
          {list.map((p, i) => (
            <ProductCard key={i} p={toCardVM(p, addItem)} />
          ))}
        </div>
      )}
      {listingEmpty && (
        <div style={css("text-align:center;padding:70px 24px;background:#1D0333;border:1px dashed #341052;border-radius:16px")}>
          <span style={css("display:inline-block;width:18px;height:18px;border:3px solid #8B2CF5;border-radius:50%;margin-bottom:14px")}></span>
          <h3 style={css("margin:0 0 8px;font:700 20px 'Space Grotesk',sans-serif")}>{emptyTitle}</h3>
          <p style={css("margin:0 0 20px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>{emptyDesc}</p>
          <div style={css("display:flex;gap:10px;justify-content:center;flex-wrap:wrap")}>
            <Link
              href="/"
              className="vh-btn-lime"
              style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:13px 24px;font:700 13.5px 'Space Grotesk',sans-serif;cursor:pointer;text-decoration:none;display:inline-block")}
            >
              Ver destaques
            </Link>
            <a
              className="vh-wa"
              href={waDirectUrl}
              target="_blank"
              style={css("display:inline-flex;align-items:center;background:#25D366;color:#062e17;border-radius:10px;padding:13px 24px;font:700 13.5px 'Space Grotesk',sans-serif")}
            >
              Pedir ajuda no WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
