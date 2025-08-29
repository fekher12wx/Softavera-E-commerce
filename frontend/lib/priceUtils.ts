/**
 * Standardized Price Calculation Utilities
 * 
 * This file provides consistent price calculation methods across the application
 * to prevent discrepancies between cart, home page, and invoice totals.
 */

export interface PriceBreakdown {
  basePrice: number;
  taxAmount: number;
  totalWithTax: number;
  taxRate: number;
}

export interface CartItemPrice {
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalWithTax: number;
}

/**
 * Calculate tax for a single item
 */
export function calculateItemTax(basePrice: number, taxRate: number): number {
  return basePrice * (taxRate / 100);
}

/**
 * Calculate total with tax for a single item
 */
export function calculateItemTotalWithTax(basePrice: number, taxRate: number): number {
  const taxAmount = calculateItemTax(basePrice, taxRate);
  return basePrice + taxAmount;
}

/**
 * Calculate cart totals with consistent tax calculation
 */
export function calculateCartTotals(
  cart: Array<{ product: { id: string; price: number; name: string }; quantity: number }>,
  taxRates: Record<string, number>,
  defaultTaxRate: number = 0
): {
  subtotal: number;
  totalTax: number;
  totalWithTax: number;
  itemBreakdown: CartItemPrice[];
} {
  let subtotal = 0;
  let totalTax = 0;
  let totalWithTax = 0;
  const itemBreakdown: CartItemPrice[] = [];

  for (const item of cart) {
    const itemSubtotal = item.product.price * item.quantity;
    const itemTaxRate = taxRates[item.product.id] || defaultTaxRate;
    const itemTaxAmount = calculateItemTax(itemSubtotal, itemTaxRate);
    const itemTotalWithTax = itemSubtotal + itemTaxAmount;

    subtotal += itemSubtotal;
    totalTax += itemTaxAmount;
    totalWithTax += itemTotalWithTax;

    itemBreakdown.push({
      productId: item.product.id,
      productName: item.product.name,
      basePrice: item.product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      taxRate: itemTaxRate,
      taxAmount: itemTaxAmount,
      totalWithTax: itemTotalWithTax
    });
  }

  return {
    subtotal,
    totalTax,
    totalWithTax,
    itemBreakdown
  };
}

/**
 * Format price for display with currency
 */
export function formatPrice(price: number, currencySymbol: string): string {
  return `${price.toFixed(3)} ${currencySymbol}`;
}

/**
 * Convert price to cents (for payment processing)
 */
export function convertToCents(price: number): number {
  return Math.round(price * 100);
}

/**
 * Validate price calculations for consistency
 */
export function validatePriceCalculation(
  basePrice: number,
  taxRate: number,
  expectedTotal: number,
  tolerance: number = 0.01
): boolean {
  const calculatedTotal = calculateItemTotalWithTax(basePrice, taxRate);
  const difference = Math.abs(calculatedTotal - expectedTotal);
  return difference <= tolerance;
}

/**
 * Debug logging for price calculations
 */
export function logPriceCalculation(
  context: string,
  breakdown: PriceBreakdown | ReturnType<typeof calculateCartTotals>
): void {
}

/**
 * Convert product price from base currency to selected currency
 * This function should be used in components that need to display prices
 * @param price - The price in base currency
 * @param exchangeRate - The exchange rate from base to selected currency
 * @returns The converted price
 */
export function convertProductPrice(price: number, exchangeRate: number): number {
  return Math.round(price * exchangeRate * 100) / 100;
}

/**
 * Calculate price with tax and convert to selected currency
 * @param basePrice - The base price in base currency
 * @param taxRate - The tax rate percentage
 * @param exchangeRate - The exchange rate from base to selected currency
 * @returns Object with converted prices
 */
export function calculatePriceWithTaxAndCurrency(
  basePrice: number,
  taxRate: number,
  exchangeRate: number
): {
  convertedBasePrice: number;
  convertedTaxAmount: number;
  convertedTotalWithTax: number;
} {
  const convertedBasePrice = convertProductPrice(basePrice, exchangeRate);
  const convertedTaxAmount = convertProductPrice(basePrice * (taxRate / 100), exchangeRate);
  const convertedTotalWithTax = convertedBasePrice + convertedTaxAmount;
  
  return {
    convertedBasePrice,
    convertedTaxAmount,
    convertedTotalWithTax
  };
}
