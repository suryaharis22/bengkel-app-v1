import TechnicianServiceOrderDetail from "@/components/technician/service-orders/TechnicianServiceOrderDetail";

export default async function TechnicianServiceOrderDetailPage({ params }) {
  const { id } = await params;

  return <TechnicianServiceOrderDetail id={id} />;
}
