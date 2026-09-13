import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

const TONES = {
  brand: { icon: "text-vh-lime", ring: "border-vh-border" },
  success: { icon: "text-vh-lime", ring: "border-vh-lime/40" },
  error: { icon: "text-red-400", ring: "border-red-400/40" },
  neutral: { icon: "text-vh-accent", ring: "border-vh-border" },
} as const;

export default function AuthPageHeader({
  icon: Icon,
  title,
  subtitle,
  tone = "brand",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];

  return (
    <div className="flex flex-col mb-7.5">
      <span
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vh-deep border",
          t.ring,
        )}
      >
        <Icon aria-hidden="true" size={22} strokeWidth={1.75} className={t.icon} />
      </span>
      <h1 className="mt-0 mx-0 mb-2 font-bold text-vh-30 font-space-grotesk">{title}</h1>
      {subtitle && (
        <p className="mt-0 mx-0 font-medium text-vh-14 font-manrope text-vh-muted">{subtitle}</p>
      )}
    </div>
  );
}
