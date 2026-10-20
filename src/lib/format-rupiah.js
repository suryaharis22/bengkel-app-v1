export function formatRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseRupiahInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  return digits === "" ? 0 : Number(digits);
}

export function formatRupiah(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "Rp 0";

  return `Rp ${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}
