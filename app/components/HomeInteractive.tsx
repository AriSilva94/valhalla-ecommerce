"use client";

import Link from "next/link";
import Image from "next/image";
import { css } from "../lib/css";
import { fmt } from "../lib/wa";
import { useCart } from "./CartProvider";
import ProductCard, { CardVM } from "./ProductCard";
import type { Homepage, Product, Category } from "../lib/strapi";

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
      <section style={css("position:relative;overflow:hidden;background:radial-gradient(1100px 500px at 75% -10%,rgba(139,44,245,.35),transparent 65%),radial-gradient(circle at 12% 90%,rgba(140,255,0,.07),transparent 40%),#120020")}>
        <div style={css("position:absolute;inset:0;background:radial-gradient(rgba(176,86,255,.13) 1px,transparent 1.5px);background-size:20px 20px;mask-image:linear-gradient(115deg,transparent 35%,black 75%)")}></div>
        <div style={css("position:relative;max-width:1240px;margin:0 auto;padding:64px 24px 72px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;align-items:center")}>
          <div style={css("display:flex;flex-direction:column;gap:18px")}>
            <span style={css("align-self:flex-start;font:700 11.5px 'Space Grotesk',sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8CFF00;border:1px solid rgba(140,255,0,.4);border-radius:20px;padding:7px 14px")}>{homepage.hero.eyebrow}</span>
            <h1 style={css("margin:0;font:700 clamp(34px,4.5vw,56px)/1.05 'Space Grotesk',sans-serif;letter-spacing:-.01em")}><span style={css("color:#B056FF")}>{homepage.hero.headlineAccent}</span><br />{homepage.hero.headline}<br /><span style={css("color:#8CFF00")}>{homepage.hero.headlineHighlight}</span></h1>
            <p style={css("margin:0;max-width:440px;font:500 15.5px/1.65 'Manrope',sans-serif;color:#D8D5E0")}>{homepage.hero.subtext}</p>
            <div style={css("display:flex;gap:12px;flex-wrap:wrap;margin-top:6px")}>
              <Link href={homepage.hero.ctaLink} className="vh-btn-lime-lift" style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:15px 28px;font:700 14.5px 'Space Grotesk',sans-serif;letter-spacing:.03em;cursor:pointer;box-shadow:0 0 28px rgba(140,255,0,.35);transition:background .15s,transform .12s;text-decoration:none;display:inline-block")}>{homepage.hero.ctaLabel}</Link>
              <Link href="/categorias" className="vh-ghost-violet" style={css("background:transparent;color:#FFFFFF;border:1px solid #8B2CF5;border-radius:10px;padding:15px 28px;font:600 14.5px 'Space Grotesk',sans-serif;cursor:pointer;transition:background .15s;text-decoration:none;display:inline-block")}>{homepage.hero.secondaryCtaLabel}</Link>
            </div>
            <div style={css("display:flex;gap:22px;flex-wrap:wrap;margin-top:10px")}>
              {homepage.hero.trustBadges.map((b, i) => (
                <span key={i} style={css("font:600 12.5px 'Manrope',sans-serif;color:#9690A3")}><span style={css("color:#8CFF00")}>✓</span> {b.text}</span>
              ))}
            </div>
          </div>
          <div style={css("position:relative;display:flex;align-items:center;justify-content:center;min-height:340px")}>
            <div style={css("position:absolute;bottom:8%;width:70%;height:60px;background:radial-gradient(ellipse,rgba(140,255,0,.4),transparent 70%);filter:blur(18px);animation:vh-glow 3.5s ease-in-out infinite")}></div>
            <div style={css("position:relative;width:min(340px,80%);aspect-ratio:3/4;background:" + (homepage.hero.image ? "#1D0333" : "repeating-linear-gradient(45deg,#2A0A45 0 14px,#24063C 14px 28px)") + ";border:1px solid #341052;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 24px 60px rgba(9,5,13,.6);overflow:hidden")}>
              {homepage.hero.image ? (
                <Image
                  src={homepage.hero.image.url}
                  alt={homepage.hero.image.alternativeText ?? homepage.hero.headlineAccent}
                  fill
                  priority
                  sizes="(max-width:768px) 80vw, 340px"
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <span style={css("font:500 12px ui-monospace,Menlo,monospace;color:#9690A3;background:rgba(9,5,13,.55);padding:6px 12px;border-radius:6px")}>[foto do destaque]</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={css("max-width:1240px;margin:0 auto;padding:56px 24px 8px;width:100%")}>
        <div style={css("display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:22px")}>
          <h2 style={css("margin:0;font:700 26px 'Space Grotesk',sans-serif;color:#FFFFFF")}>Categorias</h2>
          <Link href="/categorias" className="vh-lime" style={css("font:600 13px 'Space Grotesk',sans-serif;color:#B056FF;cursor:pointer;text-decoration:none")}>Ver todas →</Link>
        </div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px")}>
          {categories.filter((c) => c.productCount > 0).map((c, i) => (
            <Link key={i} href={`/categoria/${c.slug}`} className="vh-cardcat" style={css("background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:14px;padding:20px 18px;cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:border-color .15s,transform .15s;text-decoration:none;color:inherit")}>
              <span style={css("width:12px;height:12px;background:linear-gradient(135deg,#8B2CF5,#B056FF);transform:rotate(45deg);border-radius:3px")}></span>
              <span style={css("font:700 15px 'Space Grotesk',sans-serif;color:#FFFFFF")}>{c.name}</span>
              <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>{c.productCount} produtos</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={css("max-width:1240px;margin:0 auto;padding:48px 24px 8px;width:100%")}>
        <div style={css("display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:22px")}>
          <h2 style={css("margin:0;font:700 26px 'Space Grotesk',sans-serif")}>Destaques</h2>
        </div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
          {featured.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} />))}
        </div>
      </section>

      <section style={css("background:#22003D;margin-top:56px")}>
        <div style={css("max-width:1240px;margin:0 auto;padding:48px 24px;width:100%")}>
          <div style={css("display:flex;align-items:baseline;gap:14px;margin-bottom:22px")}>
            <h2 style={css("margin:0;font:700 26px 'Space Grotesk',sans-serif;color:#8CFF00")}>Ofertas imperdíveis</h2>
            <span style={css("font:700 11px 'Space Grotesk',sans-serif;letter-spacing:.1em;background:#8CFF00;color:#09050D;padding:4px 9px;border-radius:6px;text-transform:uppercase")}>Por tempo limitado</span>
          </div>
          <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
            {offers.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} />))}
          </div>
        </div>
      </section>

      <section style={css("max-width:1240px;margin:0 auto;padding:56px 24px 8px;width:100%")}>
        <h2 style={css("margin:0 0 22px;font:700 26px 'Space Grotesk',sans-serif")}>Lançamentos</h2>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
          {launches.map((p, i) => (<ProductCard key={i} p={toCardVM(p, addItem)} />))}
        </div>
      </section>

      <section style={css("max-width:1240px;margin:0 auto;padding:56px 24px 0;width:100%")}>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px")}>
          {homepage.benefits.map((b, i) => (
            <div key={i} style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:10px")}>
              <span style={css("width:34px;height:34px;border-radius:10px;background:rgba(140,255,0,.12);border:1px solid rgba(140,255,0,.35);display:flex;align-items:center;justify-content:center;color:#8CFF00;font:700 15px 'Space Grotesk',sans-serif")}>{b.icon}</span>
              <span style={css("font:700 15px 'Space Grotesk',sans-serif;color:#FFFFFF")}>{b.title}</span>
              <span style={css("font:500 13px/1.55 'Manrope',sans-serif;color:#9690A3")}>{b.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={css("max-width:1240px;margin:0 auto;padding:64px 24px 0;width:100%")}>
        <h2 style={css("margin:0 0 8px;font:700 26px 'Space Grotesk',sans-serif;text-align:center")}>Como comprar pelo <span style={css("color:#25D366")}>WhatsApp</span></h2>
        <p style={css("margin:0 auto 30px;max-width:520px;text-align:center;font:500 14px/1.6 'Manrope',sans-serif;color:#9690A3")}>Sem checkout, sem complicação. Você escolhe no site e finaliza com um atendente de verdade.</p>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px")}>
          {homepage.steps.map((s, i) => (
            <div key={i} style={css("background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:10px")}>
              <span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>{s.number}</span>
              <span style={css("font:700 15.5px 'Space Grotesk',sans-serif")}>{s.title}</span>
              <span style={css("font:500 13px/1.55 'Manrope',sans-serif;color:#9690A3")}>{s.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={css("max-width:1240px;margin:0 auto;padding:64px 24px 0;width:100%")}>
        <h2 style={css("margin:0 0 26px;font:700 26px 'Space Grotesk',sans-serif;text-align:center")}>Quem comprou, recomenda</h2>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px")}>
          {homepage.testimonials.map((t, i) => (
            <div key={i} style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:12px")}>
              <span style={css("color:#8CFF00;font:700 14px 'Space Grotesk',sans-serif;letter-spacing:.25em")}>★★★★★</span>
              <span style={css("font:500 14px/1.6 'Manrope',sans-serif;color:#D8D5E0")}>&quot;{t.quote}&quot;</span>
              <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;color:#B056FF")}>{t.authorName} <span style={css("color:#9690A3;font-weight:500")}>· {t.authorLocation}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section style={css("max-width:1240px;margin:64px auto 0;padding:0 24px;width:100%")}>
        <div style={css("position:relative;overflow:hidden;background:radial-gradient(700px 300px at 85% 0%,rgba(37,211,102,.22),transparent 60%),linear-gradient(160deg,#22003D,#120020);border:1px solid #341052;border-radius:20px;padding:44px 40px;display:flex;flex-wrap:wrap;gap:28px;align-items:center;justify-content:space-between")}>
          <div style={css("position:absolute;inset:0;background:radial-gradient(rgba(176,86,255,.12) 1px,transparent 1.5px);background-size:18px 18px;mask-image:linear-gradient(100deg,transparent 40%,black 90%)")}></div>
          <div style={css("position:relative;max-width:560px;display:flex;flex-direction:column;gap:10px")}>
            <h2 style={css("margin:0;font:700 clamp(24px,3vw,34px)/1.15 'Space Grotesk',sans-serif;color:#B056FF")}>{homepage.whatsappBanner.headline}</h2>
            <p style={css("margin:0;font:500 14px/1.6 'Manrope',sans-serif;color:#D8D5E0")}>{homepage.whatsappBanner.text}</p>
          </div>
          <a className="vh-wa" href={homepage.whatsappBanner.buttonLink} target="_blank" style={css("position:relative;display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#062e17;border-radius:12px;padding:16px 30px;font:700 15px 'Space Grotesk',sans-serif;box-shadow:0 0 34px rgba(37,211,102,.4);transition:filter .15s")}><span style={css("width:10px;height:10px;background:#062e17;border-radius:50%")}></span>{homepage.whatsappBanner.buttonLabel}</a>
        </div>
      </section>
    </>
  );
}
