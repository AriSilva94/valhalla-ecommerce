import type { CSSProperties } from "react";

/**
 * Parses a CSS declaration string ("prop:value;prop:value") into a React style
 * object. Lets us port the design prototype's inline styles verbatim.
 */
export function css(s: string): CSSProperties {
  // A fixed grid track min (e.g. minmax(320px,1fr)) can exceed a narrow
  // viewport and force horizontal overflow. Cap every fixed min at 100% of
  // the container so columns collapse cleanly on small screens.
  s = s.replace(/minmax\((\d+)px,\s*1fr\)/g, "minmax(min($1px,100%),1fr)");

  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const key = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!key) continue;
    const camel = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = val;
  }
  return out as CSSProperties;
}
