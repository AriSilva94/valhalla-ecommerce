import Link from "next/link";
import Image from "next/image";
import { css } from "../lib/css";
import type { StrapiMedia } from "../lib/strapi";

export interface CardVM {
  slug: string;
  name: string;
  brand: string;
  priceF: string;
  oldPriceF: string | null;
  badge: string | null;
  badgeBg: string;
  badgeFg: string;
  out: boolean;
  canAdd: boolean;
  image: StrapiMedia | null;
  add: () => void;
}

export default function ProductCard({ p }: { p: CardVM }) {
  return (
    <Link
      href={`/produto/${p.slug}`}
      className="vh-cardprod"
      style={css(
        "width:100%;background:#1D0333;border:1px solid #341052;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;text-decoration:none;color:inherit"
      )}
    >
      <div style={css("position:relative;aspect-ratio:1/1;background:repeating-linear-gradient(45deg,#2A0A45 0 12px,#24063C 12px 24px);display:flex;align-items:center;justify-content:center")}>
        {p.image ? (
          <Image
            src={p.image.url}
            alt={p.image.alternativeText ?? p.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1240px) 33vw, 300px"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <span style={css("font:500 11px ui-monospace,Menlo,monospace;color:#9690A3;background:rgba(9,5,13,.55);padding:5px 10px;border-radius:6px")}>[foto: {p.name}]</span>
        )}
        {p.badge && (
          <span style={{ ...css("position:absolute;top:10px;left:10px;font:700 11px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:5px 9px;border-radius:6px"), background: p.badgeBg, color: p.badgeFg }}>{p.badge}</span>
        )}
        {p.out && (
          <span style={css("position:absolute;inset:auto 10px 10px 10px;text-align:center;font:600 11px 'Space Grotesk',sans-serif;letter-spacing:.05em;padding:6px;border-radius:6px;background:rgba(9,5,13,.75);color:#D8D5E0;text-transform:uppercase")}>Esgotado</span>
        )}
      </div>
      <div style={css("padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;flex:1")}>
        <span style={css("font:600 10.5px 'Space Grotesk',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#B056FF")}>{p.brand}</span>
        <span style={css("font:600 14.5px/1.35 'Space Grotesk',sans-serif;color:#FFFFFF")}>{p.name}</span>
        <div style={css("margin-top:auto;padding-top:8px;display:flex;flex-direction:column;gap:2px")}>
          {p.oldPriceF && (
            <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3;text-decoration:line-through")}>{p.oldPriceF}</span>
          )}
          <span style={css("font:700 19px 'Space Grotesk',sans-serif;color:#8CFF00")}>{p.priceF}</span>
          <span style={css("font:500 11px 'Manrope',sans-serif;color:#9690A3")}>à combinar no atendimento</span>
        </div>
        <div style={css("display:flex;gap:8px;margin-top:10px")}>
          <span
            className="vh-ghost-violet"
            style={css("flex:1;font:600 12.5px 'Space Grotesk',sans-serif;color:#FFFFFF;background:transparent;border:1px solid #8B2CF5;border-radius:8px;padding:9px 0;cursor:pointer;transition:background .15s;text-align:center")}
          >
            Ver detalhes
          </span>
          {p.canAdd && (
            <button
              className="vh-btn-lime"
              title="Adicionar à lista"
              style={css("width:38px;font:700 18px 'Space Grotesk',sans-serif;color:#09050D;background:#8CFF00;border:none;border-radius:8px;cursor:pointer;transition:background .15s")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                p.add();
              }}
            >
              +
            </button>
          )}
          {p.out && (
            <button disabled style={css("width:38px;font:700 18px 'Space Grotesk',sans-serif;color:#9690A3;background:#341052;border:none;border-radius:8px;cursor:not-allowed")}>
              +
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
