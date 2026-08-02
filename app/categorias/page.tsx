import Link from "next/link";
import { getCategories } from "../lib/strapi";

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <section className="max-w-310 my-0 mx-auto py-10 px-6 w-full">
      <p className="mt-0 mx-0 mb-1.5 font-semibold text-vh-12 font-space-grotesk text-vh-muted">
        <Link href="/" className="cursor-pointer text-vh-accent">Início</Link> / Categorias
      </p>
      <h1 className="mt-0 mx-0 mb-6.5 font-bold text-vh-34 font-space-grotesk">Todas as categorias</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {categories.map((c, i) => (
          <Link
            key={i}
            href={`/categoria/${c.slug}`}
            className="vh-cardcat bg-[linear-gradient(160deg,#22003D,#1D0333)] border border-vh-border rounded-2xl py-7 px-6 cursor-pointer flex flex-col gap-2.5 [transition:border-color_.15s,transform_.15s] no-underline text-inherit"
          >
            <span className="w-3.5 h-3.5 bg-[linear-gradient(135deg,#8B2CF5,#B056FF)] rotate-45 rounded-vh-3"></span>
            <span className="font-bold text-vh-19 font-space-grotesk">{c.name}</span>
            <span className="font-medium text-vh-13 font-manrope text-vh-muted">{c.description}</span>
            <span className="font-bold text-vh-12 font-space-grotesk text-vh-lime">{c.productCount} produtos →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
