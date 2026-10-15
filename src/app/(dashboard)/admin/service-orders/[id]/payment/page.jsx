import ServiceOrderPayment from "@/components/service-orders/ServiceOrderPayment";

export default async function ServiceOrderPaymentPage({ params }) {
  const { id } = await params;

  return (
    <div className="p-6">
      <ServiceOrderPayment serviceOrderId={id} />
    </div>
  );
}
