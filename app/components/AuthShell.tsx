import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Truck, MessageCircle } from "lucide-react";

const BRAND_POINTS = [
  { icon: ShieldCheck, label: "Produtos originais com garantia de fábrica" },
  { icon: Truck, label: "Retirada rápida ou entrega combinada no ato" },
  { icon: MessageCircle, label: "Atendimento humano pelo WhatsApp" },
];

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section className="grid md:grid-cols-2 md:min-h-130">
      <div className="vh-auth-panel-bg hidden md:flex flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        <Link href="/" className="relative flex items-center">
          <Image
            src="/assets/img/valhalla-logo-.png"
            alt="Valhalla Tecnologia"
            width={96}
            height={78}
            className="h-15 w-auto"
          />
        </Link>

        <div className="relative flex flex-col gap-6">
          <p className="font-bold text-vh-30 lg:text-vh-32 font-space-grotesk leading-tight max-w-100">
            Eletrônicos originais, atendimento de verdade.
          </p>
          <ul className="flex flex-col gap-3.5 list-none m-0 p-0">
            {BRAND_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 border border-white/10">
                  <Icon aria-hidden="true" size={15} strokeWidth={2} className="text-vh-lime" />
                </span>
                <span className="font-medium text-vh-13-5 font-manrope text-vh-soft">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-medium text-vh-12 font-manrope text-vh-muted">
          © {new Date().getFullYear()} Valhalla Tecnologia
        </p>
      </div>

      <div className="flex items-center justify-center py-14 px-6 sm:py-16">
        <div className="w-full max-w-105">{children}</div>
      </div>
    </section>
  );
}
