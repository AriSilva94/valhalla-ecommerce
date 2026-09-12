import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

const VARIANTS = {
  error: { icon: AlertCircle, classes: "bg-red-400/10 border-red-400/25 text-red-400" },
  success: { icon: CheckCircle2, classes: "bg-vh-lime/10 border-vh-lime/25 text-vh-lime" },
  info: { icon: Info, classes: "bg-vh-violet/10 border-vh-violet/25 text-vh-soft" },
} as const;

export default function AuthAlert({
  variant,
  icon,
  children,
  className,
}: {
  variant: keyof typeof VARIANTS;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const v = VARIANTS[variant];
  const Icon = icon ?? v.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-vh-10 border py-2.75 px-3.5 font-medium text-vh-12-5 font-manrope",
        v.classes,
        className,
      )}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={2} className="shrink-0 mt-0.25" />
      <span>{children}</span>
    </div>
  );
}
