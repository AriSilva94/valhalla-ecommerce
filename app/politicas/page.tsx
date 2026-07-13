import { css } from "../lib/css";
import { getPolicies } from "../lib/strapi";
import Accordion from "../components/Accordion";

export default async function PoliticasPage() {
  const policies = await getPolicies();

  return (
    <section style={css("max-width:780px;margin:0 auto;padding:48px 24px;width:100%")}>
      <h1 style={css("margin:0 0 28px;font:700 34px 'Space Grotesk',sans-serif")}>Políticas da empresa</h1>
      <Accordion items={policies.map((p) => ({ q: p.title, a: p.body }))} />
    </section>
  );
}
