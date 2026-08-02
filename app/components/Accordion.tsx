"use client";

import { useState } from "react";
import { cn } from "../lib/cn";

export default function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number>(-1);

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={cn("bg-vh-card rounded-vh-14 overflow-hidden [transition:border-color_.15s] border", isOpen ? "border-vh-violet" : "border-vh-border")}>
            <div
              className="vh-accordion flex justify-between items-center gap-3.5 py-4.5 px-5.5 cursor-pointer"
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="font-bold text-vh-14-5 font-space-grotesk">{f.q}</span>
              <span className="font-bold text-vh-18 font-space-grotesk text-vh-lime flex-none">{isOpen ? "−" : "+"}</span>
            </div>
            {isOpen && <p className="m-0 pt-0 px-5.5 pb-4.5 font-medium text-vh-13-5/vh-17 font-manrope text-vh-soft">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
