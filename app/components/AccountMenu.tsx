"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, LogOut } from "lucide-react";
import type { AuthUser } from "../lib/auth-contracts";
import { cn } from "../lib/cn";

export default function AccountMenu({ user }: { user: AuthUser | null }) {
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
        className="hidden sm:inline-flex items-center py-2.75 px-4 cursor-pointer text-vh-muted font-semibold text-vh-13 font-space-grotesk [transition:color_.15s]"
      >
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
    <div ref={containerRef} className="relative hidden sm:block">
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
          className="absolute top-[calc(100%+6px)] right-0 z-70 min-w-40 bg-vh-card border border-vh-violet rounded-xl shadow-vh-dropdown overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full py-2.5 px-3.5 bg-transparent border-0 cursor-pointer text-left font-semibold text-vh-12-5 font-manrope text-vh-soft hover:bg-vh-deep hover:text-white [transition:background_.12s,color_.12s]"
          >
            <LogOut aria-hidden="true" size={15} strokeWidth={2} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
