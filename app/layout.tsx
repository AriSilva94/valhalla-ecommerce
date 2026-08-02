import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings, getCategories, getProducts } from "./lib/strapi";
import { CartProvider } from "./components/CartProvider";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Fab from "./components/Fab";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.defaultSeo?.metaTitle ?? "Valhalla Tecnologia",
    description: settings.defaultSeo?.metaDescription ?? "",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, categories, products] = await Promise.all([getSiteSettings(), getCategories(), getProducts()]);

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>
          {/* The top-bar strip is rendered INSIDE Header (ported as part of Header's own JSX in Step 2,
              since the original source has it as a sibling immediately before <header>) — do not add a
              second copy of it here. */}
          <Header categories={categories} products={products} whatsappNumber={settings.whatsappNumber} showTopBar={settings.showTopBar} topBarText={settings.topBarText} />
          <main className="flex-1">{children}</main>
          <Footer categories={categories} settings={settings} />
          <Fab show={settings.showFab} whatsappNumber={settings.whatsappNumber} />
        </CartProvider>
      </body>
    </html>
  );
}
