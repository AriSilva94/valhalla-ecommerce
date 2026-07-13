import { getSiteSettings } from "../lib/strapi";
import ListaClient from "../components/ListaClient";

export default async function ListaPage() {
  const settings = await getSiteSettings();
  return <ListaClient whatsappNumber={settings.whatsappNumber} />;
}
