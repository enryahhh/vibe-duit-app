/**
 * Formats a numeric value into a localized currency string.
 * Defaults to Indonesian Rupiah (IDR).
 */
export function formatCurrency(amount: number, currencyCode: string = 'IDR'): string {
  const num = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  const curr = (currencyCode || 'IDR').toUpperCase();

  try {
    if (curr === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${curr} ${num.toLocaleString()}`;
  }
}
