import Link from "next/link";
import Image from "next/image";
import type { StrapiMedia } from "../lib/strapi";
import { bgClass, textClass } from "../lib/color-classes";
import { cn } from "../lib/cn";

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

export default function ProductCard({ p, priority = false }: { p: CardVM; priority?: boolean }) {
  return (
    <Link
      href={`/produto/${p.slug}`}
      className="vh-cardprod w-full bg-vh-card border border-vh-border rounded-vh-14 overflow-hidden flex flex-col cursor-pointer [transition:transform_.18s_ease,border-color_.18s_ease,box-shadow_.18s_ease] no-underline text-inherit"
    >
      <div className="relative aspect-square bg-[repeating-linear-gradient(45deg,#2A0A45_0_12px,#24063C_12px_24px)] flex items-center justify-center">
        {p.image ? (
          <Image
            src={p.image.url}
            alt={p.image.alternativeText ?? p.name}
            fill
            priority={priority}
            sizes="(max-width:640px) 50vw, (max-width:1240px) 33vw, 300px"
            quality={90}
            className="object-cover"
          />
        ) : (
          <span className="font-medium text-vh-11 font-mono text-vh-muted bg-vh-ink/55 py-1.25 px-2.5 rounded-md">[foto: {p.name}]</span>
        )}
        {p.badge && (
          <span className={cn("absolute top-2.5 left-2.5 font-bold text-vh-16 font-space-grotesk tracking-vh-006 uppercase py-1.25 px-2.25 rounded-md", bgClass(p.badgeBg), textClass(p.badgeFg))}>{p.badge}</span>
        )}
        {p.out && (
          <span className="absolute top-auto right-2.5 bottom-2.5 left-2.5 text-center font-semibold text-vh-16 font-space-grotesk tracking-wider p-1.5 rounded-md bg-vh-ink/75 text-vh-soft uppercase">Esgotado</span>
        )}
      </div>
      <div className="pt-3.5 px-4 pb-4 flex flex-col gap-1.5 flex-1">
        <span className="font-semibold text-vh-10-5 font-space-grotesk tracking-vh-012 uppercase text-vh-accent">{p.brand}</span>
        <span className="font-semibold text-vh-14-5/[1.35] font-space-grotesk text-white">{p.name}</span>
        <div className="mt-auto pt-2 flex flex-col gap-0.5">
          {p.oldPriceF && (
            <span className="font-medium text-vh-12 font-manrope text-vh-muted line-through">{p.oldPriceF}</span>
          )}
          <span className="font-bold text-vh-19 font-space-grotesk text-vh-lime">{p.priceF}</span>
          <span className="font-medium text-vh-11 font-manrope text-vh-muted">à combinar no atendimento</span>
        </div>
        <div className="flex gap-2 mt-2.5">
          <span
            className="vh-ghost-violet flex-1 font-semibold text-vh-12-5 font-space-grotesk bg-transparent border border-vh-violet rounded-lg py-2.25 px-0 cursor-pointer [transition:background_.15s] text-center text-white!"
          >
            Ver detalhes
          </span>
          {p.canAdd && (
            <button
              className="vh-btn-lime w-9.5 font-bold text-vh-18 font-space-grotesk bg-vh-lime border-0 rounded-lg cursor-pointer [transition:background_.15s] text-vh-ink!"
              title="Adicionar à lista"
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
            <button disabled className="w-9.5 font-bold text-vh-18 font-space-grotesk text-vh-muted bg-vh-border border-0 rounded-lg cursor-not-allowed">
              +
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
