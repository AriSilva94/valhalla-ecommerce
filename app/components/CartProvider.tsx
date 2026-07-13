"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartLine {
  key: string;
  productSlug: string;
  productName: string;
  variantSku: string;
  colorName: string;
  configLabel: string;
  unitPrice: number;
  qty: number;
}

interface CartContextValue {
  cart: CartLine[];
  addItem: (line: Omit<CartLine, "key" | "qty">, qty: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "valhalla:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // ignore malformed localStorage content
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addItem: CartContextValue["addItem"] = (line, qty) => {
    const key = line.productSlug + "|" + line.variantSku;
    setCart((c) => {
      const next = c.map((x) => ({ ...x }));
      const existing = next.find((x) => x.key === key);
      if (existing) existing.qty += qty;
      else next.push({ ...line, key, qty });
      return next;
    });
  };

  const updateQty = (key: string, qty: number) => {
    setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(10, qty)) } : x)));
  };

  const removeItem = (key: string) => {
    setCart((c) => c.filter((x) => x.key !== key));
  };

  const clear = () => setCart([]);

  const cartCount = cart.reduce((a, x) => a + x.qty, 0);
  const cartTotal = cart.reduce((a, x) => a + x.unitPrice * x.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQty, removeItem, clear, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
