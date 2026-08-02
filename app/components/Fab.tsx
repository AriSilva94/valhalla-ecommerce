"use client";

import { usePathname } from "next/navigation";
import { waUrl } from "../lib/wa";

export default function Fab({ show, whatsappNumber }: { show: boolean; whatsappNumber: string }) {
  const pathname = usePathname();
  if (!show || pathname === "/lista") return null;
  const href = waUrl(whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");
  return (
    <a
      className="vh-fab fixed right-5.5 bottom-5.5 z-80 flex items-center gap-2.5 bg-vh-wa rounded-vh-30 py-3.5 px-5.5 font-bold text-vh-13-5 font-space-grotesk shadow-vh-fab [transition:transform_.15s,filter_.15s] text-vh-wa-dark!"
      href={href}
      target="_blank"
      title="Falar no WhatsApp"
    >
      <span className="w-2.5 h-2.5 bg-vh-wa-dark rounded-full"></span>
      Falar no WhatsApp
    </a>
  );
}
