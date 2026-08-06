const BG_CLASSES: Record<string, string> = {
  transparent: "bg-transparent",
  "#000000": "bg-black",
  "#062e17": "bg-vh-wa-dark",
  "#09050D": "bg-vh-ink",
  "#120020": "bg-vh-bg",
  "#1D0333": "bg-vh-card",
  "#22003D": "bg-vh-panel",
  "#24063C": "bg-vh-panel-2",
  "#2A0A45": "bg-vh-deep",
  "#341052": "bg-vh-border",
  "#8B2CF5": "bg-vh-violet",
  "#8CFF00": "bg-vh-lime",
  "#9690A3": "bg-vh-muted",
  "#B056FF": "bg-vh-accent",
  "#D8D5E0": "bg-vh-soft",
  "#FFFFFF": "bg-white",
  "#ffffff": "bg-white",
  "#FF4D6D": "bg-vh-red",
  "rgba(140,255,0,.08)": "bg-vh-lime/8",
  "rgba(140,255,0,.1)": "bg-vh-lime/10",
  "rgba(255,77,109,.1)": "bg-vh-red/10",
};

const TEXT_CLASSES: Record<string, string> = {
  inherit: "text-inherit",
  transparent: "text-transparent",
  "#062e17": "text-vh-wa-dark",
  "#09050D": "text-vh-ink",
  "#25D366": "text-vh-wa",
  "#8B2CF5": "text-vh-violet",
  "#8CFF00": "text-vh-lime",
  "#9690A3": "text-vh-muted",
  "#B056FF": "text-vh-accent",
  "#D8D5E0": "text-vh-soft",
  "#FFFFFF": "text-white",
  "#ffffff": "text-white",
  "#fff": "text-white",
  "#FF4D6D": "text-vh-red",
};

const BORDER_CLASSES: Record<string, string> = {
  "#22003D": "border-vh-panel",
  "#341052": "border-vh-border",
  "#8B2CF5": "border-vh-violet",
  "#8CFF00": "border-vh-lime",
  "rgba(140,255,0,.4)": "border-vh-lime/40",
  "rgba(255,77,109,.4)": "border-vh-red/40",
};

const RING_SHADOW_CLASSES: Record<string, string> = {
  "#8CFF00": "shadow-vh-ring-lime",
  "#22003D": "shadow-vh-ring-panel",
  "#341052": "shadow-vh-ring-border",
};

export function bgClass(value: string) {
  return BG_CLASSES[value] ?? "bg-black";
}

export function textClass(value: string) {
  return TEXT_CLASSES[value] ?? "text-white";
}

export function borderClass(value: string) {
  return BORDER_CLASSES[value] ?? "border-vh-border";
}

export function ringShadowClass(value: string) {
  return RING_SHADOW_CLASSES[value] ?? "shadow-vh-ring-border";
}

const SWATCH_FALLBACK = "#9690A3";

// Cores cadastradas no Strapi são arbitrárias: nenhuma classe do Tailwind existe
// para elas em build time, então o allowlist acima não serve — vai em style inline.
// Só hex é aceito, para não deixar valor de CMS virar CSS arbitrário.
export function swatchStyle(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  const valid = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
  return { backgroundColor: valid ? hex : SWATCH_FALLBACK };
}
