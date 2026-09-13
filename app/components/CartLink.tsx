"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useCart } from "./CartProvider";

export default function CartLink() {
  const { cartCount } = useCart();

  return (
    <Link
      href="/lista"
      title="Minha lista"
      className="vh-border-violet-hover relative flex items-center justify-center h-9.5 w-9.5 rounded-vh-10 border border-vh-border bg-transparent cursor-pointer text-white shrink-0 [transition:border-color_.15s]"
    >
      <ClipboardList aria-hidden="true" size={16} strokeWidth={2} className="text-vh-lime" />
      {cartCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 bg-vh-lime text-vh-ink rounded-full font-extrabold text-vh-8-5 font-space-grotesk leading-none flex items-center justify-center py-0 px-0.75 border-2 border-vh-bg">
          {cartCount > 9 ? "9+" : cartCount}
        </span>
      )}
    </Link>
  );
}
