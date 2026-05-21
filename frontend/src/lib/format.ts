export function formatPrice(value: number, currency: string = "RUB") {
  const symbols: Record<string, string> = { RUB: "₽", USD: "$", EUR: "€", USDT: "₮" };
  const num = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
  return `${num} ${symbols[currency] ?? currency}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function formatPct(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}
