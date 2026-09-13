import OrderDetailClient from "../../components/OrderDetailClient";

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailClient id={Number(id)} />;
}
