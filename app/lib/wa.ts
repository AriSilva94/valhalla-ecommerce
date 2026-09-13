export function fmt(n: number): string {
  return (
    "R$ " +
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function waUrl(phone: string, msg: string): string {
  return "https://wa.me/" + phone.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
}

// Many products in the catalog never got a colorName filled in (single-
// variant "Padrão" products with no color choice) — joining unconditionally
// with " · " left a dangling separator like "Padrão · " with nothing after
// it. Only join parts that actually have a value.
export function formatVariantMeta(configLabel: string, colorName: string): string {
  return [configLabel, colorName].filter(Boolean).join(" · ");
}
