import ServiceOrderDetail from "@/components/service-orders/ServiceOrderDetail";

export default async function ServiceOrderDetailPage({ params }) {
  const { id } = await params;

  return (
    <main className="space-y-6">
      <ServiceOrderDetail orderId={id} />
    </main>
  );
}
