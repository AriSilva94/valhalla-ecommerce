import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section className="grid md:grid-cols-2 md:min-h-130">
      <Link
        href="/"
        className="hidden md:flex items-center justify-center bg-vh-lime p-16"
      >
        <Image
          src="/assets/img/valhalla-favicon-final.png"
          alt="Valhalla Tecnologia"
          width={512}
          height={512}
          className="w-full max-w-90 h-auto"
          priority
        />
      </Link>

      <div className="flex items-center justify-center py-14 px-6 sm:py-16">
        <div className="w-full max-w-105">{children}</div>
      </div>
    </section>
  );
}
