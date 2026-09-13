"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, LogOut, ClipboardList, LogIn } from "lucide-react";
import type { AuthUser } from "../lib/auth-contracts";
import { cn } from "../lib/cn";

export default function AccountMenu({
  user,
  cartCount,
}: {
  user: AuthUser | null;
  cartCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/entrar"
        className="flex items-center gap-2 py-2.5 px-3.5 rounded-vh-10 border border-vh-border bg-transparent cursor-pointer text-white font-semibold text-vh-13 font-space-grotesk no-underline hover:border-vh-violet [transition:border-color_.15s]"
      >
        <LogIn aria-hidden="true" size={15} strokeWidth={2} className="text-vh-lime shrink-0" />
        Entrar
      </Link>
    );
  }

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 py-2.5 px-3.5 rounded-vh-10 border border-vh-border bg-transparent cursor-pointer text-white font-semibold text-vh-13 font-space-grotesk [transition:border-color_.15s]"
      >
        <User aria-hidden="true" size={15} strokeWidth={2} className="text-vh-lime shrink-0" />
        <span className="max-w-30 truncate">{user.username}</span>
        <ChevronDown
          aria-hidden="true"
          size={14}
          strokeWidth={2}
          className={cn("text-vh-muted shrink-0 [transition:transform_.15s]", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+6px)] right-0 z-70 min-w-45 bg-vh-card border border-vh-violet rounded-xl shadow-vh-dropdown overflow-hidden"
        >
          <Link
            href="/lista"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-3 py-2.5 px-3.5 font-semibold text-vh-12-5 font-manrope text-vh-soft no-underline hover:bg-vh-deep hover:text-white [transition:background_.12s,color_.12s]"
          >
            <span className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" size={15} strokeWidth={2} />
              Minha lista
            </span>
            {cartCount > 0 && (
              <span className="min-w-5 h-5 bg-vh-lime text-vh-ink rounded-vh-10 font-extrabold text-vh-11 font-space-grotesk flex items-center justify-center py-0 px-1.25">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full py-2.5 px-3.5 bg-transparent border-0 border-t border-t-vh-border cursor-pointer text-left font-semibold text-vh-12-5 font-manrope text-vh-soft hover:bg-vh-deep hover:text-white [transition:background_.12s,color_.12s]"
          >
            <LogOut aria-hidden="true" size={15} strokeWidth={2} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
