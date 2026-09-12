import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export default function AuthResultHeading({
  icon: Icon,
  tone,
  children,
}: {
  icon: LucideIcon;
  tone: "success" | "error";
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon
        aria-hidden="true"
        size={20}
        strokeWidth={2}
        className={cn("shrink-0", tone === "success" ? "text-vh-lime" : "text-red-400")}
      />
      <span className="font-bold text-vh-15 font-space-grotesk">{children}</span>
    </div>
  );
}
