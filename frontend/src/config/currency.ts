/**
 * Currency Configuration for XOOM
 * Supports multiple currencies for future MENA expansion
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  region: string;
  position: 'before' | 'after';
}

export const CURRENCIES: Record<string, Currency> = {
  PKR: {
    code: 'PKR',
    symbol: 'PKR',
    name: 'Pakistani Rupee',
    region: 'Pakistan',
    position: 'before'
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    region: 'UAE',
    position: 'before'
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    name: 'Saudi Riyal',
    region: 'Saudi Arabia',
    position: 'before'
  },
  KWD: {
    code: 'KWD',
    symbol: 'KWD',
    name: 'Kuwaiti Dinar',
    region: 'Kuwait',
    position: 'before'
  },
  OMR: {
    code: 'OMR',
    symbol: 'OMR',
    name: 'Omani Rial',
    region: 'Oman',
    position: 'before'
  },
  BHD: {
    code: 'BHD',
    symbol: 'BHD',
    name: 'Bahraini Dinar',
    region: 'Bahrain',
    position: 'before'
  },
  QAR: {
    code: 'QAR',
    symbol: 'QAR',
    name: 'Qatari Riyal',
    region: 'Qatar',
    position: 'before'
  },
  // Add more currencies as needed for future expansion
};

// Default currency
export const DEFAULT_CURRENCY = 'PKR';

/**
 * Format currency with proper symbol and position
 * @param amount - The amount to format
 * @param currencyCode - Currency code (defaults to PKR)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string,
  currencyCode: string = DEFAULT_CURRENCY
): string => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formattedAmount = Math.round(numAmount).toLocaleString();
  
  if (currency.position === 'before') {
    return `${currency.symbol} ${formattedAmount}`;
  }
  return `${formattedAmount} ${currency.symbol}`;
};

/**
 * Get current currency (can be extended to read from user settings)
 * @returns Current currency object
 */
export const getCurrentCurrency = (): Currency => {
  // Future: Read from user profile or localStorage
  // For now, always return PKR
  return CURRENCIES[DEFAULT_CURRENCY];
};

/**
 * Get currency symbol only
 * @param currencyCode - Currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currencyCode: string = DEFAULT_CURRENCY): string => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  return currency.symbol;
};

