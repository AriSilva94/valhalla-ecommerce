
export type MapViewMode = "satellite" | "roadmap";

export interface MapEmbedOptions {
  latitude: number;
  longitude: number;
  viewportSpanMeters: number;
  placeId: string;
  placeLabel: string;
  language: string;
  region: string;
  version: number;
  mode: MapViewMode;
  viewportPx?: { width: number; height: number };
  fieldOfView?: number;
}

const MODE_CODES: Record<MapViewMode, number> = {
  satellite: 1,
  roadmap: 0,
};

export function mapsEmbedUrl(o: MapEmbedOptions): string {
  const { width, height } = o.viewportPx ?? { width: 1024, height: 768 };
  const fov = o.fieldOfView ?? 13.1;
  const locale = `!1s${o.language}!2s${o.region}`;

  const pb = [
    "!1m18!1m12!1m3", // abertura: bloco de câmera
    `!1d${o.viewportSpanMeters}`,
    `!2d${o.longitude}`,
    `!3d${o.latitude}`,
    "!2m3!1f0!2f0!3f0", // rotação, inclinação e roll da câmera
    `!3m2!1i${width}!2i${height}`,
    `!4f${fov}`,
    "!3m3!1m2", // abertura: bloco do lugar
    `!1s${encodeURIComponent(o.placeId)}`,
    `!2s${encodeURIComponent(o.placeLabel)}`,
    `!5e${MODE_CODES[o.mode]}`,
    `!3m2${locale}`,
    `!4v${o.version}`,
    `!5m2${locale}`,
  ].join("");

  return `https://www.google.com/maps/embed?pb=${pb}`;
}

export const VALHALLA_STORE: MapEmbedOptions = {
  latitude: 0.0168319,
  longitude: -51.074473399999995,
  viewportSpanMeters: 4774.274580958311,
  placeId: "0x8d61e129be6d5195:0x6f97316cb7a05b8f",
  placeLabel: "Valhalla Tecnologia",
  language: "pt-BR",
  region: "br",
  version: 1786032841795,
  mode: "satellite",
};
