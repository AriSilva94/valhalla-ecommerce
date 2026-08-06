import { VALHALLA_STORE, mapsEmbedUrl, type MapEmbedOptions } from "../lib/store-map";
import { cn } from "../lib/cn";

export default function StoreMap({
  title = "Mapa da loja Valhalla Tecnologia",
  location = VALHALLA_STORE,
  className,
}: {
  title?: string;
  location?: MapEmbedOptions;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "aspect-21/9 overflow-hidden bg-vh-card border border-vh-border rounded-vh-18",
        className,
      )}
    >
      <iframe
        src={mapsEmbedUrl(location)}
        title={title}
        className="w-full h-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
