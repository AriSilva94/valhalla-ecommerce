import { getPolicies } from "../lib/strapi";
import Accordion from "../components/Accordion";

export default async function PoliticasPage() {
  const policies = await getPolicies();

  return (
    <section className="max-w-195 my-0 mx-auto py-12 px-6 w-full">
      <h1 className="mt-0 mx-0 mb-7 font-bold text-vh-34 font-space-grotesk">Políticas da empresa</h1>
      <Accordion items={policies.map((p) => ({ q: p.title, a: p.body }))} />
    </section>
  );
}
