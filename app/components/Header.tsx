"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmt } from "../lib/wa";
import { useCart } from "./CartProvider";
import type { Category, Product } from "../lib/strapi";
import { visibleCategories } from "../lib/categories";

export default function Header({
  categories,
  products,
  showTopBar,
  topBarText,
}: {
  categories: Category[];
  products: Product[];
  showTopBar: boolean;
  topBarText: string;
}) {
  const router = useRouter();
  const { cartCount } = useCart();
  const [q, setQ] = useState("");
  const [auto, setAuto] = useState(false);

  const catRowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0, moved: false });

  const onCatRowMouseDown = (e: React.MouseEvent) => {
    const el = catRowRef.current;
    if (!el) return;
    e.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
  };
  const onCatRowMouseMove = (e: React.MouseEvent) => {
    const el = catRowRef.current;
    const d = dragRef.current;
    if (!d.dragging || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - d.startX;
    if (Math.abs(walk) > 5) d.moved = true;
    el.scrollLeft = d.scrollLeft - walk;
  };
  const stopCatRowDrag = () => {
    dragRef.current.dragging = false;
  };
  const onCatRowClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  const query = q.trim().toLowerCase();
  const suggestions = query
    ? products
        .filter((p) =>
          (p.name + " " + (p.brand?.name ?? "")).toLowerCase().includes(query),
        )
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          priceF: fmt(p.variants[0]?.price ?? p.basePrice),
          slug: p.slug,
        }))
    : [];

  const navCats = visibleCategories(categories);

  return (
    <>
      {/* ===== HEADER ===== */}
      {showTopBar && (
        <div className="bg-vh-lime text-vh-ink text-center font-bold text-vh-12 font-space-grotesk tracking-vh-008 uppercase py-2 px-4">
          {topBarText}
        </div>
      )}
      <header className="sticky top-0 z-60 bg-vh-bg/94 backdrop-blur-vh-backdrop-14 border-b border-b-vh-border">
        <div className="max-w-310 my-0 mx-auto py-3.5 px-6 flex items-center gap-5 flex-wrap">
          <Link
            href="/"
            className="order-1 cursor-pointer flex items-center select-none"
          >
            <Image
              src="/assets/img/valhalla-logo-.png"
              alt="Valhalla Tecnologia"
              width={78}
              height={64}
              priority
              className="h-11 w-auto sm:h-16"
            />
          </Link>
          <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 sm:min-w-55 relative">
            <input
              className="vh-input w-full bg-vh-card border border-vh-border rounded-vh-10 pt-3 pr-11 pb-3 pl-4 text-white font-medium text-vh-13-5 font-manrope outline-none [transition:border-color_.15s]"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setAuto(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim())
                  router.push("/busca?q=" + encodeURIComponent(q.trim()));
              }}
              onFocus={() => setAuto(true)}
              onBlur={() => setTimeout(() => setAuto(false), 150)}
              placeholder="Buscar smartphones, notebooks, fones..."
            />
            <button
              className="vh-searchbtn absolute right-1.5 top-1.5 bottom-1.5 w-8.5 bg-vh-violet border-0 rounded-vh-7 cursor-pointer text-white font-bold text-vh-14 font-space-grotesk [transition:background_.15s]"
              onClick={() => {
                if (q.trim())
                  router.push("/busca?q=" + encodeURIComponent(q.trim()));
              }}
              title="Buscar"
            >
              ⌕
            </button>
            {auto && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-vh-card border border-vh-violet rounded-xl overflow-hidden shadow-vh-dropdown z-70">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="vh-autorow flex justify-between items-center gap-3 py-2.75 px-4 cursor-pointer border-b border-b-vh-deep [transition:background_.12s]"
                    onMouseDown={() => router.push("/produto/" + s.slug)}
                  >
                    <span className="font-semibold text-vh-13 font-manrope text-white">
                      {s.name}
                    </span>
                    <span className="font-bold text-vh-12-5 font-space-grotesk text-vh-lime whitespace-nowrap">
                      {s.priceF}
                    </span>
                  </div>
                ))}
                <div
                  className="vh-lime py-2.5 px-4 font-semibold text-vh-12 font-space-grotesk tracking-wider text-vh-accent cursor-pointer uppercase"
                  onMouseDown={() => {
                    if (q.trim())
                      router.push("/busca?q=" + encodeURIComponent(q.trim()));
                  }}
                >
                  Ver todos os resultados →
                </div>
              </div>
            )}
          </div>
          <Link
            href="/lista"
            className="vh-minhalista order-2 sm:order-3 ml-auto sm:ml-0 relative flex items-center gap-2.25 bg-transparent border border-vh-border rounded-vh-10 py-2.75 px-4 cursor-pointer text-white font-semibold text-vh-13 font-space-grotesk [transition:border-color_.15s,background_.15s]"
          >
            <span className="w-2 h-2 border-2 border-vh-lime rounded-xs"></span>
            Minha lista
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-vh-lime text-vh-ink rounded-vh-10 font-extrabold text-vh-11 font-space-grotesk flex items-center justify-center py-0 px-1.25">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        <nav className="border-t border-t-vh-panel relative">
          <div className="max-w-310 my-0 mx-auto px-6 flex items-center gap-4">
            <div
              ref={catRowRef}
              onMouseDown={onCatRowMouseDown}
              onMouseMove={onCatRowMouseMove}
              onMouseUp={stopCatRowDrag}
              onMouseLeave={stopCatRowDrag}
              onClickCapture={onCatRowClickCapture}
              className="flex-1 min-w-0 flex gap-1 overflow-x-auto py-2.75 cursor-grab active:cursor-grabbing select-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_left,transparent,black_48px)] [-webkit-mask-image:linear-gradient(to_left,transparent,black_48px)]"
            >

              {navCats.map((c, i) => (
                <Link
                  key={i}
                  href={"/categoria/" + c.slug}
                  draggable={false}
                  className="vh-navcat py-2.75 px-3.5 font-semibold text-vh-12-5 font-space-grotesk tracking-vh-003 text-vh-soft cursor-pointer whitespace-nowrap border-b-2 border-b-transparent [transition:color_.12s,border-color_.12s]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <Link
                href="/sobre"
                className="vh-lime py-2.75 px-3 font-semibold text-vh-12-5 font-space-grotesk text-vh-muted cursor-pointer whitespace-nowrap"
              >
                Sobre
              </Link>
              <Link
                href="/faq"
                className="vh-lime py-2.75 px-3 font-semibold text-vh-12-5 font-space-grotesk text-vh-muted cursor-pointer whitespace-nowrap"
              >
                FAQ
              </Link>
              <Link
                href="/contato"
                className="vh-lime py-2.75 px-3 font-semibold text-vh-12-5 font-space-grotesk text-vh-muted cursor-pointer whitespace-nowrap"
              >
                Contato
              </Link>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
