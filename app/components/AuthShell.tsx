import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section className="flex justify-center py-10 px-4 sm:py-14 sm:px-6">
      <div className="w-full max-w-245 grid md:grid-cols-2 bg-vh-panel border border-vh-border rounded-3xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]">
        <Link
          href="/"
          className="hidden md:flex items-center justify-center bg-vh-lime p-14"
        >
          <Image
            src="/assets/img/valhalla-favicon-final.png"
            alt="Valhalla Tecnologia"
            width={512}
            height={512}
            className="w-full max-w-70 h-auto"
            priority
          />
        </Link>

        <div className="flex items-center justify-center py-12 px-6 sm:px-10 md:px-12">
          <div className="w-full max-w-95">{children}</div>
        </div>
      </div>
    </section>
  );
}
