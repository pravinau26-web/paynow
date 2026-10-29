/**
 * NPCI UPI Transaction Reference Generator
 * Format: 12 digits
 * - Digit 1: Year last digit (e.g., 2026 -> '6')
 * - Digits 2-4: Julian Calendar Day of Year (001 - 366)
 * - Digits 5-12: 8 random numeric digits
 */

export const generateUpiRefNumber = (date: Date = new Date()): string => {
  // Digit 1: Must strictly start with '6' (representing year 2026 per NPCI UPI spec)
  const yearLastDigit = '6';

  // Digits 2-4: Day of Year in Julian Calendar (001 to 366)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diffTime / oneDay) + 1;
  const julianDay = Math.min(Math.max(dayOfYear, 1), 366).toString().padStart(3, '0');

  // Digits 5-12: Exactly 8 random numeric digits (10000000 to 99999999)
  const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();

  // Total 12 digits: e.g. 629783921045
  return `${yearLastDigit}${julianDay}${randomPart}`;
};

/**
 * Super.Money Internal Transaction ID (e.g. SMTX77F3B57D3EA348BA83FBA625066AD9E)
 */
export const generateSuperTxId = (): string => {
  const chars = '0123456789ABCDEF';
  let id = 'SMTX';
  for (let i = 0; i < 28; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};
