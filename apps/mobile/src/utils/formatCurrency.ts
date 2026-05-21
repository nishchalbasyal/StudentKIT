export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("en-DE", {
    style: "currency",
    currency
  }).format(Number.isFinite(value) ? value : 0);
}

