"use client";

import Link from "next/link";
import Image from "next/image";
import { fmt } from "../lib/wa";
import { useCart } from "./CartProvider";
import ProductCard, { CardVM } from "./ProductCard";
import type { Homepage, Product, Category } from "../lib/strapi";
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
        {
          productSlug: p.slug,
          productName: p.name,
          variantSku: v.sku,
          colorName: v.color.name,
          configLabel: v.configLabel,
          unitPrice: v.price,
        },
        1
      );
    },
  };
}

export default function HomeInteractive({
  homepage,
  categories,
  featured,
  offers,
  launches,
}: {
  homepage: Homepage;
  categories: Category[];
  featured: Product[];
  offers: Product[];
  launches: Product[];
}) {
  const { addItem } = useCart();

  return (
    <>
      {/* ===== HOME ===== */}
      <section className="relative overflow-hidden vh-home-hero-bg">
        <div className="absolute inset-0 vh-hero-pattern"></div>
        <div className="relative max-w-310 my-0 mx-auto pt-8 sm:pt-16 px-6 pb-18 grid vh-grid-hero gap-12 items-center">
          <div className="flex flex-col gap-4.5">
            <span className="self-start font-bold text-vh-11-5 font-space-grotesk tracking-vh-018 uppercase text-vh-lime border border-vh-lime/40 rounded-vh-20 py-1.75 px-3.5">{homepage.hero.eyebrow}</span>
            <h1 className="m-0 font-bold text-vh-34/vh-105 vh-hero-title font-space-grotesk -tracking-vh-001"><span className="text-vh-accent">{homepage.hero.headlineAccent}</span><br />{homepage.hero.headline}<br /><span className="text-vh-lime">{homepage.hero.headlineHighlight}</span></h1>
            <p className="m-0 max-w-110 font-medium text-vh-15-5/vh-165 font-manrope text-vh-soft">{homepage.hero.subtext}</p>
            <div className="flex gap-3 flex-wrap mt-1.5">
              <Link href={homepage.hero.ctaLink} className="vh-btn-lime-lift bg-vh-lime border-0 rounded-vh-10 py-3.75 px-7 font-bold text-vh-14-5 font-space-grotesk tracking-vh-003 cursor-pointer shadow-vh-lime-28 vh-button-lift-transition no-underline inline-block text-vh-ink!">{homepage.hero.ctaLabel}</Link>
              <Link href="/categorias" className="vh-ghost-violet bg-transparent border border-vh-violet rounded-vh-10 py-3.75 px-7 font-semibold text-vh-14-5 font-space-grotesk cursor-pointer vh-button-bg-transition no-underline inline-block text-white!">{homepage.hero.secondaryCtaLabel}</Link>
            </div>
            <div className="flex gap-5.5 flex-wrap mt-2.5">
              {homepage.hero.trustBadges.map((b, i) => (
                <span key={i} className="font-semibold text-vh-12-5 font-manrope text-vh-muted"><span className="text-vh-lime">✓</span> {b.text}</span>
              ))}
            </div>
          </div>
          <div className="relative flex items-center justify-center min-h-85">
            <div className="absolute vh-hero-glow h-15 blur-vh-18 animate-vh-glow"></div>
            <div className={cn("relative vh-hero-product-frame aspect-3/4 border border-vh-border rounded-vh-20 flex items-center justify-center shadow-vh-product overflow-hidden", homepage.hero.image ? "bg-vh-card" : "vh-product-placeholder-bg")}>
              {homepage.hero.image ? (
                <Image
                  src={homepage.hero.image.url}
                  alt={homepage.hero.image.alternativeText ?? homepage.hero.headlineAccent}
                  fill
                  priority
                  sizes="(max-width:768px) 80vw, 340px"
                  quality={90}
                  className="object-cover"
                />
              ) : (
                <span className="font-medium text-vh-12 font-mono text-vh-muted bg-vh-ink/55 py-1.5 px-3 rounded-md">[foto do destaque]</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-310 my-0 mx-auto pt-14 px-6 pb-2 w-full">
        <div className="flex items-baseline justify-between gap-4 mb-5.5">
          <h2 className="m-0 font-bold text-vh-26 font-space-grotesk text-white">Categorias</h2>
          <Link href="/categorias" className="vh-lime font-semibold text-vh-13 font-space-grotesk text-vh-accent cursor-pointer no-underline">Ver todas →</Link>
        </div>
        <div className="grid vh-grid-categories gap-3.5">
          {categories.filter((c) => c.productCount > 0).map((c, i) => (
            <Link key={i} href={`/categoria/${c.slug}`} className="vh-cardcat vh-cardcat-bg border border-vh-border rounded-vh-14 py-5 px-4.5 cursor-pointer flex flex-col gap-2 vh-card-transition no-underline text-inherit">
              <span className="w-3 h-3 vh-diamond-bg rotate-45 rounded-vh-3"></span>
              <span className="font-bold text-vh-15 font-space-grotesk text-white">{c.name}</span>
              <span className="font-medium text-vh-12 font-manrope text-vh-muted">{c.productCount} produtos</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-310 my-0 mx-auto pt-12 px-6 pb-2 w-full">
        <div className="flex items-baseline justify-between gap-4 mb-5.5">
          <h2 className="m-0 font-bold text-vh-26 font-space-grotesk">Destaques</h2>
        </div>
        <div className="grid vh-grid-products gap-4">
          {featured.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} priority={i < 4} />))}
        </div>
      </section>

      {offers.length > 0 && (
        <section className="bg-vh-panel mt-14">
          <div className="max-w-310 my-0 mx-auto py-12 px-6 w-full">
            <div className="flex items-baseline gap-3.5 mb-5.5">
              <h2 className="m-0 font-bold text-vh-26 font-space-grotesk text-vh-lime">Ofertas imperdíveis</h2>
              <span className="font-bold text-vh-11 font-space-grotesk tracking-widest bg-vh-lime text-vh-ink py-1 px-2.25 rounded-md uppercase">Por tempo limitado</span>
            </div>
            <div className="grid vh-grid-products gap-4">
              {offers.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} />))}
            </div>
          </div>
        </section>
      )}

      {launches.length > 0 && (
        <section className="max-w-310 my-0 mx-auto pt-14 px-6 pb-2 w-full">
          <h2 className="mt-0 mx-0 mb-5.5 font-bold text-vh-26 font-space-grotesk">Lançamentos</h2>
          <div className="grid vh-grid-products gap-4">
            {launches.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} priority={i === 0} />))}
          </div>
        </section>
      )}

      <section className="max-w-310 my-0 mx-auto pt-14 px-6 pb-0 w-full">
        <div className="grid vh-grid-benefits gap-3.5">
          {homepage.benefits.map((b, i) => (
            <div key={i} className="bg-vh-card border border-vh-border rounded-vh-14 p-5.5 flex flex-col gap-2.5">
              <span className="w-8.5 h-8.5 rounded-vh-10 bg-vh-lime/12 border border-vh-lime/35 flex items-center justify-center text-vh-lime font-bold text-vh-15 font-space-grotesk">{b.icon}</span>
              <span className="font-bold text-vh-15 font-space-grotesk text-white">{b.title}</span>
              <span className="font-medium text-vh-13/vh-155 font-manrope text-vh-muted">{b.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-310 my-0 mx-auto pt-16 px-6 pb-0 w-full">
        <h2 className="mt-0 mx-0 mb-2 font-bold text-vh-26 font-space-grotesk text-center">Como comprar pelo <span className="text-vh-wa">WhatsApp</span></h2>
        <p className="mt-0 mx-auto mb-7.5 max-w-130 text-center font-medium text-vh-14/vh-16 font-manrope text-vh-muted">Sem checkout, sem complicação. Você escolhe no site e finaliza com um atendente de verdade.</p>
        <div className="grid vh-grid-steps gap-3.5">
          {homepage.steps.map((s, i) => (
            <div key={i} className="vh-cardcat-bg border border-vh-border rounded-vh-14 p-6 flex flex-col gap-2.5">
              <span className="font-bold text-vh-30 font-space-grotesk text-vh-lime">{s.number}</span>
              <span className="font-bold text-vh-15-5 font-space-grotesk">{s.title}</span>
              <span className="font-medium text-vh-13/vh-155 font-manrope text-vh-muted">{s.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-310 my-0 mx-auto pt-16 px-6 pb-0 w-full">
        <h2 className="mt-0 mx-0 mb-6.5 font-bold text-vh-26 font-space-grotesk text-center">Quem comprou, recomenda</h2>
        <div className="grid vh-grid-testimonials gap-3.5">
          {homepage.testimonials.map((t, i) => (
            <div key={i} className="bg-vh-card border border-vh-border rounded-vh-14 p-6 flex flex-col gap-3">
              <span className="text-vh-lime font-bold text-vh-14 font-space-grotesk tracking-vh-025">★★★★★</span>
              <span className="font-medium text-vh-14/vh-16 font-manrope text-vh-soft">&quot;{t.quote}&quot;</span>
              <span className="font-bold text-vh-12-5 font-space-grotesk text-vh-accent">{t.authorName} <span className="text-vh-muted font-medium">· {t.authorLocation}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-310 mt-16 mx-auto mb-0 py-0 px-6 w-full">
        <div className="relative overflow-hidden vh-whatsapp-banner-bg border border-vh-border rounded-vh-20 py-11 px-10 flex flex-wrap gap-7 items-center justify-between">
          <div className="absolute inset-0 vh-whatsapp-pattern"></div>
          <div className="relative max-w-140 flex flex-col gap-2.5">
            <h2 className="m-0 font-bold text-vh-24/vh-115 vh-whatsapp-title font-space-grotesk text-vh-accent">{homepage.whatsappBanner.headline}</h2>
            <p className="m-0 font-medium text-vh-14/vh-16 font-manrope text-vh-soft">{homepage.whatsappBanner.text}</p>
          </div>
          <a className="vh-wa relative inline-flex items-center gap-2.5 bg-vh-wa rounded-xl py-4 px-7.5 font-bold text-vh-15 font-space-grotesk shadow-vh-wa-34 vh-filter-transition text-vh-wa-dark!" href={homepage.whatsappBanner.buttonLink} target="_blank"><span className="w-2.5 h-2.5 bg-vh-wa-dark rounded-full"></span>{homepage.whatsappBanner.buttonLabel}</a>
        </div>
      </section>
    </>
  );
}
