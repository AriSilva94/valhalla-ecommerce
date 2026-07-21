import Link from "next/link";
import { css } from "../lib/css";
import { getCategories } from "../lib/strapi";

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <section style={css("max-width:1240px;margin:0 auto;padding:40px 24px;width:100%")}>
      <p style={css("margin:0 0 6px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}>
        <Link href="/" style={css("cursor:pointer;color:#B056FF")}>Início</Link> / Categorias
      </p>
      <h1 style={css("margin:0 0 26px;font:700 34px 'Space Grotesk',sans-serif")}>Todas as categorias</h1>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px")}>
        {categories.map((c, i) => (
          <Link
            key={i}
            href={`/categoria/${c.slug}`}
            className="vh-cardcat"
            style={css(
              "background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:16px;padding:28px 24px;cursor:pointer;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,transform .15s;text-decoration:none;color:inherit"
            )}
          >
            <span style={css("width:14px;height:14px;background:linear-gradient(135deg,#8B2CF5,#B056FF);transform:rotate(45deg);border-radius:3px")}></span>
            <span style={css("font:700 19px 'Space Grotesk',sans-serif")}>{c.name}</span>
            <span style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3")}>{c.description}</span>
            <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#8CFF00")}>{c.productCount} produtos →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
