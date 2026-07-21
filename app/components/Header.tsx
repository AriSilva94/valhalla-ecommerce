"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { css } from "../lib/css";
import { fmt, waUrl } from "../lib/wa";
import { useCart } from "./CartProvider";
import type { Category, Product } from "../lib/strapi";

export default function Header({
  categories,
  products,
  whatsappNumber,
  showTopBar,
  topBarText,
}: {
  categories: Category[];
  products: Product[];
  whatsappNumber: string;
  showTopBar: boolean;
  topBarText: string;
}) {
  const router = useRouter();
  const { cartCount } = useCart();
  const [q, setQ] = useState("");
  const [auto, setAuto] = useState(false);

  const waDirectUrl = waUrl(whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  const query = q.trim().toLowerCase();
  const suggestions = query
    ? products
        .filter((p) => (p.name + " " + (p.brand?.name ?? "")).toLowerCase().includes(query))
        .slice(0, 5)
        .map((p) => ({ name: p.name, priceF: fmt(p.variants[0]?.price ?? p.basePrice), slug: p.slug }))
    : [];

  const navCats = categories.filter((c) => c.productCount > 0);

  return (
    <>
      {/* ===== HEADER ===== */}
      {showTopBar && (
        <div style={css("background:#8CFF00;color:#09050D;text-align:center;font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:8px 16px")}>{topBarText}</div>
      )}
      <header style={css("position:sticky;top:0;z-index:60;background:rgba(18,0,32,.94);backdrop-filter:blur(14px);border-bottom:1px solid #341052")}>
        <div style={css("max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap")}>
          <Link href="/" style={css("cursor:pointer;display:flex;flex-direction:column;line-height:1;user-select:none")}>
            <span style={css("font:700 24px 'Space Grotesk',sans-serif;letter-spacing:.04em;color:#FFFFFF;transform:skewX(-4deg)")}>VALHALLA</span>
            <span style={css("display:flex;align-items:center;gap:6px;margin-top:3px")}><span style={css("width:5px;height:5px;background:#8CFF00;transform:rotate(45deg)")}></span><span style={css("font:700 9.5px 'Space Grotesk',sans-serif;letter-spacing:.42em;color:#8CFF00")}>TECNOLOGIA</span><span style={css("width:5px;height:5px;background:#8CFF00;transform:rotate(45deg)")}></span></span>
          </Link>
          <div style={css("flex:1;min-width:220px;position:relative")}>
            <input className="vh-input" value={q} onChange={(e) => { setQ(e.target.value); setAuto(true); }} onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) router.push('/busca?q=' + encodeURIComponent(q.trim())); }} onFocus={() => setAuto(true)} onBlur={() => setTimeout(() => setAuto(false), 150)} placeholder="Buscar smartphones, notebooks, fones..." style={css("width:100%;background:#1D0333;border:1px solid #341052;border-radius:10px;padding:12px 44px 12px 16px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none;transition:border-color .15s")} />
            <button className="vh-searchbtn" onClick={() => { if (q.trim()) router.push('/busca?q=' + encodeURIComponent(q.trim())); }} title="Buscar" style={css("position:absolute;right:6px;top:6px;bottom:6px;width:34px;background:#8B2CF5;border:none;border-radius:7px;cursor:pointer;color:#fff;font:700 14px 'Space Grotesk',sans-serif;transition:background .15s")}>⌕</button>
            {auto && suggestions.length > 0 && (
              <div style={css("position:absolute;top:calc(100% + 6px);left:0;right:0;background:#1D0333;border:1px solid #8B2CF5;border-radius:12px;overflow:hidden;box-shadow:0 16px 40px rgba(9,5,13,.6);z-index:70")}>
                {suggestions.map((s, i) => (
                  <div key={i} className="vh-autorow" onMouseDown={() => router.push('/produto/' + s.slug)} style={css("display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;border-bottom:1px solid #2A0A45;transition:background .12s")}>
                    <span style={css("font:600 13px 'Manrope',sans-serif;color:#FFFFFF")}>{s.name}</span>
                    <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;color:#8CFF00;white-space:nowrap")}>{s.priceF}</span>
                  </div>
                ))}
                <div className="vh-lime" onMouseDown={() => { if (q.trim()) router.push('/busca?q=' + encodeURIComponent(q.trim())); }} style={css("padding:10px 16px;font:600 12px 'Space Grotesk',sans-serif;letter-spacing:.05em;color:#B056FF;cursor:pointer;text-transform:uppercase")}>Ver todos os resultados →</div>
              </div>
            )}
          </div>
          <Link href="/lista" className="vh-minhalista" style={css("position:relative;display:flex;align-items:center;gap:9px;background:transparent;border:1px solid #341052;border-radius:10px;padding:11px 16px;cursor:pointer;color:#FFFFFF;font:600 13px 'Space Grotesk',sans-serif;transition:border-color .15s,background .15s")}>
            <span style={css("width:8px;height:8px;border:2px solid #8CFF00;border-radius:2px")}></span>Minha lista
            {cartCount > 0 && (
              <span style={css("position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;background:#8CFF00;color:#09050D;border-radius:10px;font:800 11px 'Space Grotesk',sans-serif;display:flex;align-items:center;justify-content:center;padding:0 5px")}>{cartCount}</span>
            )}
          </Link>
          <a className="vh-wa" href={waDirectUrl} target="_blank" style={css("display:flex;align-items:center;gap:8px;background:#25D366;border-radius:10px;padding:11px 16px;color:#062e17;font:700 13px 'Space Grotesk',sans-serif;transition:filter .15s")}>
            <span style={css("width:9px;height:9px;background:#062e17;border-radius:50%")}></span>WhatsApp
          </a>
        </div>
        <nav style={css("border-top:1px solid #22003D")}>
          <div style={css("max-width:1240px;margin:0 auto;padding:0 24px;display:flex;gap:4px;overflow-x:auto")}>
            {navCats.map((c, i) => (
              <Link key={i} href={'/categoria/' + c.slug} className="vh-navcat" style={css("padding:11px 14px;font:600 12.5px 'Space Grotesk',sans-serif;letter-spacing:.03em;color:#D8D5E0;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:color .12s,border-color .12s")}>{c.name}</Link>
            ))}
            <span style={css("flex:1")}></span>
            <Link href="/sobre" className="vh-lime" style={css("padding:11px 12px;font:600 12.5px 'Space Grotesk',sans-serif;color:#9690A3;cursor:pointer;white-space:nowrap")}>Sobre</Link>
            <Link href="/faq" className="vh-lime" style={css("padding:11px 12px;font:600 12.5px 'Space Grotesk',sans-serif;color:#9690A3;cursor:pointer;white-space:nowrap")}>FAQ</Link>
            <Link href="/contato" className="vh-lime" style={css("padding:11px 12px;font:600 12.5px 'Space Grotesk',sans-serif;color:#9690A3;cursor:pointer;white-space:nowrap")}>Contato</Link>
          </div>
        </nav>
      </header>
    </>
  );
}
