/**
 * Price Calculations Module
 *
 * Handles all quote price calculations for the WENS DOOR CRM.
 * Includes memoization with TTL cache to optimize repeated calculations.
 *
 * @module priceCalculations
 */

import { DvereData, NabytokData, SchodyData, KovanieData, PuzdraData } from '../types';

/** Slovak VAT (DPH) rate - 23% */
const DPH_RATE = 0.23;

/**
 * Result of quote price calculations for Dvere, Nabytok, and Schody quotes.
 *
 * @property vyrobkyTotal - Total price of all products
 * @property priplatkyTotal - Total price of all supplements/extras
 * @property subtotal - Sum of vyrobkyTotal + priplatkyTotal
 * @property zlava - Discount amount (calculated from percentage)
 * @property afterZlava - Subtotal after discount applied
 * @property kovanieTotal - Total price of hardware items
 * @property montazTotal - Total price of assembly/installation
 * @property cenaBezDPH - Price without VAT
 * @property dph - VAT amount (23%)
 * @property cenaSDPH - Final price with VAT
 */
export interface QuoteTotals {
  vyrobkyTotal: number;
  priplatkyTotal: number;
  subtotal: number;
  zlava: number;
  afterZlava: number;
  kovanieTotal: number;
  montazTotal: number;
  cenaBezDPH: number;
  dph: number;
  cenaSDPH: number;
}

/**
 * Simplified result for Puzdra (frames) quotes.
 * Puzdra quotes have a simpler structure without discounts or hardware.
 */
export interface PuzdraTotals {
  cenaBezDPH: number;
  dph: number;
  cenaSDPH: number;
}

// ============================================================================
// MEMOIZATION CACHE
// ============================================================================

/** Cache storage for calculation results with timestamps */
const calculationCache = new Map<string, { result: QuoteTotals | PuzdraTotals; timestamp: number }>();

/** Cache time-to-live in milliseconds (5 seconds) */
const CACHE_TTL = 5000;

/**
 * Creates a stable cache key from quote data by JSON stringifying it.
 *
 * @param prefix - Type prefix (e.g., 'dvere:', 'nabytok:')
 * @param data - Quote data to hash
 * @returns Cache key string
 */
const createCacheKey = (prefix: string, data: unknown): string => {
  try {
    return prefix + JSON.stringify(data);
  } catch {
    return prefix + Date.now(); // Fallback for circular references
  }
};

/**
 * Retrieves a cached calculation result if it exists and hasn't expired.
 *
 * @param key - Cache key to look up
 * @returns Cached result or null if not found/expired
 */
const getCached = <T>(key: string): T | null => {
  const cached = calculationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result as T;
  }
  calculationCache.delete(key);
  return null;
};

/**
 * Stores a calculation result in the cache.
 * Automatically evicts oldest entry if cache exceeds 100 items.
 *
 * @param key - Cache key
 * @param result - Calculation result to cache
 */
const setCache = (key: string, result: QuoteTotals | PuzdraTotals): void => {
  // Limit cache size to prevent memory issues
  if (calculationCache.size > 100) {
    const oldestKey = calculationCache.keys().next().value;
    if (oldestKey) calculationCache.delete(oldestKey);
  }
  calculationCache.set(key, { result, timestamp: Date.now() });
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Common calculation logic shared by Dvere, Nabytok, and Schody quote types.
 *
 * Formula:
 * 1. subtotal = vyrobkyTotal + priplatkyTotal
 * 2. zlava = subtotal * zlavaPercent / 100
 * 3. afterZlava = subtotal - zlava
 * 4. cenaBezDPH = afterZlava + kovanieTotal + montazTotal
 * 5. dph = cenaBezDPH * 0.23
 * 6. cenaSDPH = cenaBezDPH + dph
 *
 * If manualCenaSDPH is provided, it overrides the calculated total and
 * back-calculates cenaBezDPH and dph from it.
 *
 * @param vyrobkyTotal - Sum of all product prices
 * @param priplatkyTotal - Sum of all supplement prices
 * @param zlavaPercent - Discount percentage (0-100)
 * @param kovanieItems - Array of hardware items with cenaCelkom
 * @param montazItems - Array of assembly items with cenaCelkom
 * @param manualCenaSDPH - Optional manual price override
 * @returns Complete quote totals breakdown
 */
const calculateCommonTotals = (
  vyrobkyTotal: number,
  priplatkyTotal: number,
  zlavaPercent: number,
  zlavaEur: number,
  useZlavaPercent: boolean,
  useZlavaEur: boolean,
  kovanieItems: Array<{ cenaCelkom: number }>,
  montazItems: Array<{ cenaCelkom: number }>,
  manualCenaSDPH?: number | null
): QuoteTotals => {
  const subtotal = vyrobkyTotal + priplatkyTotal;

  const percentDiscount = useZlavaPercent ? subtotal * (zlavaPercent / 100) : 0;
  const eurDiscount = useZlavaEur ? zlavaEur : 0;
  const zlava = percentDiscount + eurDiscount;

  const afterZlava = subtotal - zlava;
  const kovanieTotal = kovanieItems.reduce((sum, item) => sum + (item.cenaCelkom || 0), 0);
  const montazTotal = montazItems.reduce((sum, item) => sum + (item.cenaCelkom || 0), 0);

  const cenaBezDPH_calculated = afterZlava + kovanieTotal + montazTotal;
  const dph_calculated = cenaBezDPH_calculated * DPH_RATE;
  const cenaSDPH_calculated = cenaBezDPH_calculated + dph_calculated;

  // Handle manual override
  const hasManualOverride = manualCenaSDPH !== undefined && manualCenaSDPH !== null;
  const cenaSDPH = hasManualOverride ? manualCenaSDPH : cenaSDPH_calculated;
  const cenaBezDPH = hasManualOverride ? cenaSDPH / (1 + DPH_RATE) : cenaBezDPH_calculated;
  const dph = hasManualOverride ? cenaSDPH - cenaBezDPH : dph_calculated;

  return {
    vyrobkyTotal,
    priplatkyTotal,
    subtotal,
    zlava,
    afterZlava,
    kovanieTotal,
    montazTotal,
    cenaBezDPH,
    dph,
    cenaSDPH
  };
};

/**
 * Calculates price totals for a Dvere (doors) quote.
 *
 * Dvere products have multiple components:
 * - dvere (doors): ks * cenaDvere
 * - zarubna (frames): ksZarubna * cenaZarubna
 * - obklad (cladding): ksObklad * cenaObklad
 * - prazdne (blanks): ksPrazdne * cenaPrazdne
 *
 * Results are cached for 5 seconds to optimize repeated renders.
 *
 * @param data - Complete Dvere quote data
 * @returns Calculated totals with VAT breakdown
 *
 * @example
 * const totals = calculateDvereTotals(dvereQuote);
 * console.log(`Total with VAT: ${totals.cenaSDPH}€`);
 */
export const calculateDvereTotals = (data: DvereData): QuoteTotals => {
  const cacheKey = createCacheKey('dvere:', data);
  const cached = getCached<QuoteTotals>(cacheKey);
  if (cached) return cached;

  const vyrobkyTotal = (data.vyrobky || []).reduce((sum, item) => {
    const dverePrice = (item.ks || 0) * (item.cenaDvere || 0);
    const zarubnaPrice = (item.ksZarubna || 0) * (item.cenaZarubna || 0);
    const obkladPrice = (item.ksObklad || 0) * (item.cenaObklad || 0);
    const prazdnePrice = (item.ksPrazdne || 0) * (item.cenaPrazdne || 0);
    return sum + dverePrice + zarubnaPrice + obkladPrice + prazdnePrice;
  }, 0);

  const priplatkyTotal = (data.priplatky || []).reduce((sum, item) => sum + ((item.ks || 0) * (item.cenaKs || 0)), 0);

  const result = calculateCommonTotals(
    vyrobkyTotal,
    priplatkyTotal,
    data.zlavaPercent || 0,
    data.zlavaEur || 0,
    data.useZlavaPercent !== false, // Default to true if undefined
    data.useZlavaEur || false,
    data.kovanie || [],
    data.montaz || [],
    data.manualCenaSDPH
  );

  setCache(cacheKey, result);
  return result;
};

/**
 * Calculates price totals for a Nabytok (furniture) quote.
 *
 * Furniture products use a simpler cenaCelkom (total price) per item.
 * Results are cached for 5 seconds.
 *
 * @param data - Complete Nabytok quote data
 * @returns Calculated totals with VAT breakdown
 */
export const calculateNabytokTotals = (data: NabytokData): QuoteTotals => {
  const cacheKey = createCacheKey('nabytok:', data);
  const cached = getCached<QuoteTotals>(cacheKey);
  if (cached) return cached;

  const vyrobkyTotal = (data.vyrobky || []).reduce((sum, item) => sum + ((item.ks || 0) * (item.cenaKs || 0)), 0);
  const priplatkyTotal = (data.priplatky || []).reduce((sum, item) => sum + ((item.ks || 0) * (item.cenaKs || 0)), 0);

  const result = calculateCommonTotals(
    vyrobkyTotal,
    priplatkyTotal,
    data.zlavaPercent || 0,
    data.zlavaEur || 0,
    data.useZlavaPercent !== false,
    data.useZlavaEur || false,
    data.kovanie || [],
    data.montaz || [],
    data.manualCenaSDPH
  );

  setCache(cacheKey, result);
  return result;
};

/**
 * Calculates price totals for a Schody (stairs) quote.
 *
 * Stairs products use the same structure as furniture (cenaCelkom per item).
 * Results are cached for 5 seconds.
 *
 * @param data - Complete Schody quote data
 * @returns Calculated totals with VAT breakdown
 */
export const calculateSchodyTotals = (data: SchodyData): QuoteTotals => {
  const cacheKey = createCacheKey('schody:', data);
  const cached = getCached<QuoteTotals>(cacheKey);
  if (cached) return cached;

  const vyrobkyTotal = (data.vyrobky || []).reduce((sum, item) => sum + ((item.ks || 0) * (item.cenaKs || 0)), 0);
  const priplatkyTotal = (data.priplatky || []).reduce((sum, item) => sum + ((item.ks || 0) * (item.cenaKs || 0)), 0);

  const result = calculateCommonTotals(
    vyrobkyTotal,
    priplatkyTotal,
    data.zlavaPercent || 0,
    data.zlavaEur || 0,
    data.useZlavaPercent !== false,
    data.useZlavaEur || false,
    data.kovanie || [],
    data.montaz || [],
    data.manualCenaSDPH
  );

  setCache(cacheKey, result);
  return result;
};

/**
 * Calculates price totals for a Kovanie (hardware) quote.
 */
export const calculateKovanieTotals = (data: KovanieData): QuoteTotals => {
  const cacheKey = createCacheKey('kovanie:', data);
  const cached = getCached<QuoteTotals>(cacheKey);
  if (cached) return cached;

  const vyrobkyTotal = (data.vyrobky || []).reduce((sum, item) => sum + ((item.ks || 0) * (item.cenaKs || 0)), 0);
  const priplatkyTotal = (data.priplatky || []).reduce((sum, item) => sum + ((item.ks || 0) * (item.cenaKs || 0)), 0);

  const result = calculateCommonTotals(
    vyrobkyTotal,
    priplatkyTotal,
    data.zlavaPercent || 0,
    data.zlavaEur || 0,
    data.useZlavaPercent !== false,
    data.useZlavaEur || false,
    data.kovanie || [],
    data.montaz || [],
    data.manualCenaSDPH
  );

  setCache(cacheKey, result);
  return result;
};

/**
 * Calculates price totals for a Puzdra (frames) quote.
 *
 * Puzdra has a simpler structure - just items with optional prices.
 * No discounts, hardware, or assembly sections.
 * Results are cached for 5 seconds.
 *
 * @param data - Complete Puzdra quote data
 * @returns Simplified totals (cenaBezDPH, dph, cenaSDPH)
 */
export const calculatePuzdraTotals = (data: PuzdraData): PuzdraTotals => {
  const cacheKey = createCacheKey('puzdra:', data);
  const cached = getCached<PuzdraTotals>(cacheKey);
  if (cached) return cached;

  // Puzdra has simple items sum logic - no individual prices usually
  const itemsTotal = (data.polozky || []).reduce((sum, item) => {
    // Puzdra items typically don't have prices in current schema
    return sum + ((item as any).cena || 0);
  }, 0);

  const result = {
    cenaBezDPH: itemsTotal,
    dph: itemsTotal * DPH_RATE,
    cenaSDPH: itemsTotal * (1 + DPH_RATE)
  };

  setCache(cacheKey, result);
  return result;
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Hook-friendly wrapper for memoized calculations.
 *
 * Use this in React components when you need to calculate totals
 * based on changing dependencies. The result is cached based on deps.
 *
 * @param calculateFn - Function that performs the calculation
 * @param deps - Dependencies array (like useMemo deps)
 * @returns Cached or freshly calculated result
 *
 * @example
 * const totals = useMemoizedCalculation(
 *   () => calculateDvereTotals(quoteData),
 *   [quoteData]
 * );
 */
export const useMemoizedCalculation = <T extends QuoteTotals | PuzdraTotals>(
  calculateFn: () => T,
  deps: unknown[]
): T => {
  const cacheKey = createCacheKey('hook:', deps);
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const result = calculateFn();
  setCache(cacheKey, result);
  return result;
};

/**
 * Clears the entire calculation cache.
 *
 * Useful for:
 * - Testing (reset state between tests)
 * - Forcing recalculation after data schema changes
 * - Memory management in long-running sessions
 */
export const clearCalculationCache = (): void => {
  calculationCache.clear();
};
