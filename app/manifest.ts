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
        src: "/assets/img/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/assets/img/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/assets/img/valhalla-favicon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
