import TechnicianBookingDetail from "@/components/technician/bookings/TechnicianBookingDetail";

export default async function TechnicianBookingDetailPage({ params }) {
  const { id } = await params;

  return <TechnicianBookingDetail id={id} />;
}
