import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valhalla Tecnologia — Eletrônicos originais com atendimento pelo WhatsApp",
  description:
    "Catálogo de eletrônicos originais em Macapá-AP. Monte sua lista de interesse e finalize a compra com um atendente pelo WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Loaded in the root layout, so it applies to every route. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
