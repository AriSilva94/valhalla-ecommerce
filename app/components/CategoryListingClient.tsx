"use client";

import { useState } from "react";
import Link from "next/link";
import { fmt, waUrl } from "../lib/wa";
import { useCart } from "./CartProvider";
import ProductCard, { CardVM } from "./ProductCard";
import Select, { type SelectOption } from "./Select";
import Breadcrumb, { type BreadcrumbItem } from "./Breadcrumb";
import type { Product } from "../lib/strapi";
import { isSoldOut, sortSoldOutLast } from "../lib/product-availability";
import { plural } from "../lib/plural";
import { cn } from "../lib/cn";

const SORT_OPTIONS: SelectOption[] = [
  { value: "rel", label: "Relevância" },
  { value: "asc", label: "Menor preço" },
  { value: "desc", label: "Maior preço" },
  { value: "promo", label: "Maiores descontos" },
];

function toCardVM(p: Product, addItem: ReturnType<typeof useCart>["addItem"]): CardVM {
  const v = p.variants.find((x) => x.available) ?? p.variants[0];
  const price = v?.price ?? p.basePrice;
  const oldPrice = v?.compareAtPrice ?? null;
  const disc = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;
  const allUnavailable = isSoldOut(p);
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
        { productSlug: p.slug, productName: p.name, productImageUrl: p.mainImage?.url ?? null, productImageAlt: p.mainImage?.alternativeText ?? p.name, variantSku: v.sku, colorName: v.color.name, configLabel: v.configLabel, unitPrice: v.price },
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
  crumb: BreadcrumbItem[];
  title: string;
  emptyTitle: string;
  emptyDesc: string;
  whatsappNumber: string;
}) {
  const { addItem } = useCart();
  const [sort, setSort] = useState("rel");
  const [brand, setBrand] = useState("Todas");

  const brandsIn = ["Todas", ...Array.from(new Set(products.map((p) => p.brand?.name ?? "").filter(Boolean)))];
  const filtered = products.filter((p) => brand === "Todas" || p.brand?.name === brand);
  const priceOf = (p: Product) => p.variants[0]?.price ?? p.basePrice;
  const oldOf = (p: Product) => p.variants[0]?.compareAtPrice ?? null;
  const discountOf = (p: Product) => {
    const old = oldOf(p);
    return old ? old - priceOf(p) : 0;
  };
  const comparators: Record<string, (a: Product, b: Product) => number> = {
    asc: (a, b) => priceOf(a) - priceOf(b),
    desc: (a, b) => priceOf(b) - priceOf(a),
    promo: (a, b) => discountOf(b) - discountOf(a),
  };
  const list = sortSoldOutLast(filtered, comparators[sort]);

  const brandChips = brandsIn.map((b) => {
    const sel = b === brand;
    return { n: b, bc: sel ? "#8CFF00" : "#341052", fg: sel ? "#8CFF00" : "#D8D5E0", bg: sel ? "rgba(140,255,0,.08)" : "#1D0333", pick: () => setBrand(b) };
  });

  const listingReady = list.length > 0;
  const listingEmpty = list.length === 0;

  const waDirectUrl = waUrl(whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  return (
    <section className="max-w-310 my-0 mx-auto py-10 px-6 w-full">
      <Breadcrumb items={[{ label: "Início", href: "/" }, ...crumb]} />
      <div className="flex items-baseline gap-3.5 flex-wrap mb-5">
        <h1 className="m-0 font-bold text-vh-34 font-space-grotesk">{title}</h1>
        <span className="font-medium text-vh-13-5 font-manrope text-vh-muted">{plural(list.length, "resultado")}</span>
      </div>
      <div className="flex gap-2.5 flex-wrap items-center mb-6">
        {brandChips.map((b, i) => (
          <span
            key={i}
            className={cn(
              "vh-chip font-semibold text-vh-12-5 font-space-grotesk py-2 px-4 rounded-vh-20 cursor-pointer [transition:border-color_.12s] border",
              b.bc === "#8CFF00" ? "border-vh-lime" : "border-vh-border",
              b.fg === "#8CFF00" ? "text-vh-lime" : "text-vh-soft",
              b.bg === "rgba(140,255,0,.08)" ? "bg-vh-lime/8" : "bg-vh-card"
            )}
            onClick={b.pick}
          >
            {b.n}
          </span>
        ))}
        <span className="flex-1"></span>
        <Select
          label="Ordenar por"
          value={sort}
          onChange={setSort}
          options={SORT_OPTIONS}
          className="w-full sm:w-auto sm:min-w-52"
        />
      </div>
      {listingReady && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
          {list.map((p, i) => (
            <ProductCard key={i} p={toCardVM(p, addItem)} priority={i < 4} />
          ))}
        </div>
      )}
      {listingEmpty && (
        <div className="text-center py-17.5 px-6 bg-vh-card border border-dashed border-vh-border rounded-2xl">
          <span className="inline-block w-4.5 h-4.5 border-3 border-vh-violet rounded-full mb-3.5"></span>
          <h3 className="mt-0 mx-0 mb-2 font-bold text-vh-20 font-space-grotesk">{emptyTitle}</h3>
          <p className="mt-0 mx-0 mb-5 font-medium text-vh-14 font-manrope text-vh-muted">{emptyDesc}</p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <Link
              href="/"
              className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 py-3.25 px-6 font-bold text-vh-13-5 font-space-grotesk cursor-pointer no-underline inline-block text-vh-ink!"
            >
              Ver destaques
            </Link>
            <a
              className="vh-wa inline-flex items-center bg-vh-wa rounded-vh-10 py-3.25 px-6 font-bold text-vh-13-5 font-space-grotesk text-vh-wa-dark!"
              href={waDirectUrl}
              target="_blank"
            >
              Pedir ajuda no WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
