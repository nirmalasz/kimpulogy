// formatQty renders a quantity as an integer when whole, otherwise up to 2
// decimals (e.g. pack quantities like 1.5).
export function formatQty(v: number): string {
  if (!Number.isFinite(v)) return "0";
  const rounded = Math.round(v * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2);
}

export function formatRupiah(value: number): string {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

export function formatComponent(value: number): string {
  const sign = value < 0 ? "-" : "";
  return sign + Math.abs(Math.round(value)).toLocaleString("id-ID");
}