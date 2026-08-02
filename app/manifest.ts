import type { MetadataRoute } from "next";
import { getSiteSettings } from "./lib/strapi";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const name = "Valhalla Tecnologia";
  const description = settings.defaultSeo?.metaDescription || name;

  return {
    name,
    short_name: "Valhalla",
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#120020",
    theme_color: "#120020",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
