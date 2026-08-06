"use client";

import { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import {
  addLine,
  cartCount as sumCount,
  cartTotal as sumTotal,
  getCartSnapshot,
  getServerCartSnapshot,
  removeLine,
  setQty,
  subscribeToCart,
  updateCart,
  type CartLine,
  type NewCartLine,
} from "../lib/cart-store";

export type { CartLine } from "../lib/cart-store";

interface CartContextValue {
  cart: CartLine[];
  addItem: (line: NewCartLine, qty: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);

  const addItem: CartContextValue["addItem"] = (line, qty) => {
    updateCart((c) => addLine(c, line, qty));
  };

  const updateQty = (key: string, qty: number) => {
    updateCart((c) => setQty(c, key, qty));
  };

  const removeItem = (key: string) => {
    updateCart((c) => removeLine(c, key));
  };

  const clear = () => updateCart(() => []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        updateQty,
        removeItem,
        clear,
        cartCount: sumCount(cart),
        cartTotal: sumTotal(cart),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
