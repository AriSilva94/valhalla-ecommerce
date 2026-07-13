"use client";

import { usePathname } from "next/navigation";
import { css } from "../lib/css";
import { waUrl } from "../lib/wa";

export default function Fab({ show, whatsappNumber }: { show: boolean; whatsappNumber: string }) {
  const pathname = usePathname();
  if (!show || pathname === "/lista") return null;
  const href = waUrl(whatsappNumber, "Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");
  return (
    <a
      className="vh-fab"
      href={href}
      target="_blank"
      title="Falar no WhatsApp"
      style={css(
        "position:fixed;right:22px;bottom:22px;z-index:80;display:flex;align-items:center;gap:10px;background:#25D366;color:#062e17;border-radius:30px;padding:14px 22px;font:700 13.5px 'Space Grotesk',sans-serif;box-shadow:0 10px 30px rgba(37,211,102,.4);transition:transform .15s,filter .15s"
      )}
    >
      <span style={css("width:10px;height:10px;background:#062e17;border-radius:50%")}></span>
      Falar no WhatsApp
    </a>
  );
}
