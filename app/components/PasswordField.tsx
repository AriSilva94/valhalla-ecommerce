"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/cn";

export default function PasswordField({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock
        aria-hidden="true"
        size={16}
        strokeWidth={1.8}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-vh-muted"
      />
      <input
        type={visible ? "text" : "password"}
        className={cn(
          "vh-input w-full bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 pr-11 pl-10 text-white font-medium text-vh-13-5 font-manrope outline-none [transition:border-color_.15s]",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="vh-eye-toggle absolute right-0 top-0 h-full px-3.25 flex items-center justify-center bg-transparent border-0 text-vh-muted [transition:color_.15s] cursor-pointer"
      >
        {visible ? (
          <EyeOff aria-hidden="true" size={16} strokeWidth={1.8} />
        ) : (
          <Eye aria-hidden="true" size={16} strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
