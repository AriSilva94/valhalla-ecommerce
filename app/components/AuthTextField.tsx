import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export default function AuthTextField({
  icon: Icon,
  className,
  ...props
}: { icon: LucideIcon } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        size={16}
        strokeWidth={1.8}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-vh-muted"
      />
      <input
        className={cn(
          "vh-input w-full bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 pr-3.75 pl-10 text-white font-medium text-vh-13-5 font-manrope outline-none [transition:border-color_.15s]",
          className,
        )}
        {...props}
      />
    </div>
  );
}
