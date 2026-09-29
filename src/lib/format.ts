/** Rounds to whole dinars: .49 and below rounds down, .50 and above rounds up. */
export function roundDinars(amount: number): number {
  return Math.round(amount);
}

export function formatCurrency(amount: number): string {
  return roundDinars(amount).toLocaleString('sr-Latn-RS', {
    style: 'currency',
    currency: 'RSD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function isInMonth(isoDate: string, key: string): boolean {
  return isoDate.startsWith(key);
}
