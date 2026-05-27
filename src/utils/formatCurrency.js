/**
 * Formats a number into Indonesian Rupiah currency format.
 * @param {number} value
 * @returns {string}
 */
export function formatIDR(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return 'Rp 0';
  }
  // Round to nearest integer for currency display
  const rounded = Math.round(value);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(rounded);
}
