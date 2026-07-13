"use client";

import { useState } from "react";
import { css } from "../lib/css";

export default function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number>(-1);

  return (
    <div style={css("display:flex;flex-direction:column;gap:10px")}>
      {items.map((f, i) => {
        const isOpen = open === i;
        const bc = isOpen ? "#8B2CF5" : "#341052";
        return (
          <div key={i} style={{ ...css("background:#1D0333;border-radius:14px;overflow:hidden;transition:border-color .15s"), border: "1px solid " + bc }}>
            <div
              className="vh-accordion"
              onClick={() => setOpen(isOpen ? -1 : i)}
              style={css("display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 22px;cursor:pointer")}
            >
              <span style={css("font:700 14.5px 'Space Grotesk',sans-serif")}>{f.q}</span>
              <span style={css("font:700 18px 'Space Grotesk',sans-serif;color:#8CFF00;flex:none")}>{isOpen ? "−" : "+"}</span>
            </div>
            {isOpen && <p style={css("margin:0;padding:0 22px 18px;font:500 13.5px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
