/**
 * Money and Financial Utilities for RAISE
 * All monetary amounts are stored strictly in integer paise (1 INR = 100 paise).
 */

/**
 * Converts integer paise to rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Converts rupees to integer paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Formats integer paise into standard Indian currency representation (e.g. ₹1,00,000)
 */
export function formatInr(paise: number, includeSymbol: boolean = true): string {
  const rupees = paise / 100;
  const isNegative = rupees < 0;
  const absRupees = Math.abs(rupees);

  // Split into integer and decimal parts
  const parts = absRupees.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering system: 3 digits for first thousand, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const formattedValue = decimalPart === '00' ? formattedInteger : `${formattedInteger}.${decimalPart}`;
  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';

  return `${prefix}${symbol}${formattedValue}`;
}

/**
 * Computes Indian Financial Year (April 1 to March 31) string e.g. "2026-27"
 */
export function getFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: Jan=0, Mar=2, Apr=3, Dec=11

  let startYear: number;
  let endYear: number;

  if (month >= 3) {
    // April to December
    startYear = year;
    endYear = year + 1;
  } else {
    // January to March
    startYear = year - 1;
    endYear = year;
  }

  const endYearShort = String(endYear % 100).padStart(2, '0');
  return `${startYear}-${endYearShort}`;
}

/**
 * Validates whether an amount in paise is a valid positive integer
 */
export function isValidPaise(amount: any): boolean {
  return typeof amount === 'number' && Number.isInteger(amount) && amount > 0;
}
