const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return inr.format(amount);
}

export function formatCompact(n: number | null | undefined): string {
  if (n == null) return "—";
  return compact.format(n);
}

export function commission(agreedAmount: number | null, pct: number | null): number {
  if (!agreedAmount || !pct) return 0;
  return Math.round((agreedAmount * Number(pct)) / 100);
}
