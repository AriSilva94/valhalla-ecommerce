import Link from "next/link";
import { cn } from "../lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Trilha de navegação"
      className={cn("mt-0 mx-0 mb-1.5 font-semibold text-vh-12 font-space-grotesk text-vh-muted", className)}
    >
      <ol className="list-none m-0 p-0">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label + i} className="inline">
              {item.href ? (
                <Link href={item.href} className="vh-lime cursor-pointer text-vh-accent [transition:color_.15s]">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
              {!isLast && " / "}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
