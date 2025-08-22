import { BaseCurrency } from '../contexts/CurrencyContext';

/**
 * Convert a price from one currency to another
 * @param price - The price to convert
 * @param fromCurrency - The source currency
 * @param toCurrency - The target currency
 * @returns The converted price
 */
export const convertCurrency = (
  price: number,
  fromCurrency: BaseCurrency,
  toCurrency: BaseCurrency
): number => {
  if (fromCurrency.id === toCurrency.id) {
    return price;
  }

  // Convert to base currency first, then to target currency
  const basePrice = price / fromCurrency.exchangeRate;
  const targetPrice = basePrice * toCurrency.exchangeRate;
  
  return Math.round(targetPrice * 100) / 100; // Round to 2 decimal places
};

/**
 * Format a price with currency symbol
 * @param price - The price to format
 * @param currency - The currency to use for formatting
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: BaseCurrency): string => {
  return `${currency.symbol}${price.toFixed(3)}`;
};

/**
 * Format a price with currency code
 * @param price - The price to format
 * @param currency - The currency to use for formatting
 * @returns Formatted price string
 */
export const formatPriceWithCode = (price: number, currency: BaseCurrency): string => {
  return `${price.toFixed(3)} ${currency.code}`;
};

/**
 * Get the base currency exchange rate for a given currency
 * @param currency - The currency to get the exchange rate for
 * @param baseCurrency - The base currency
 * @returns The exchange rate relative to base currency
 */
export const getExchangeRateToBase = (
  currency: BaseCurrency,
  baseCurrency: BaseCurrency
): number => {
  if (currency.id === baseCurrency.id) {
    return 1;
  }
  return currency.exchangeRate / baseCurrency.exchangeRate;
};

/**
 * Check if a currency is the base currency
 * @param currency - The currency to check
 * @returns True if the currency is the base currency
 */
export const isBaseCurrency = (currency: BaseCurrency): boolean => {
  return currency.isBase;
};

/**
 * Get the most appropriate display format for a currency
 * @param currency - The currency to format
 * @returns The display format (symbol or code)
 */
export const getCurrencyDisplay = (currency: BaseCurrency): string => {
  return currency.symbol || currency.code;
};
