import { DvereData, NabytokData, SchodyData, PuzdraData } from '../types';

// DPH rate constant
const DPH_RATE = 0.23;

// Types for calculation results
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

export interface PuzdraTotals {
  cenaBezDPH: number;
  dph: number;
  cenaSDPH: number;
}

// Simple memoization cache
const calculationCache = new Map<string, { result: QuoteTotals | PuzdraTotals; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache TTL

// Create a stable cache key from data
const createCacheKey = (prefix: string, data: unknown): string => {
  try {
    return prefix + JSON.stringify(data);
  } catch {
    return prefix + Date.now(); // Fallback for circular references
  }
};

// Get cached result or null
const getCached = <T>(key: string): T | null => {
  const cached = calculationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result as T;
  }
  calculationCache.delete(key);
  return null;
};

// Set cache
const setCache = (key: string, result: QuoteTotals | PuzdraTotals): void => {
  // Limit cache size to prevent memory issues
  if (calculationCache.size > 100) {
    const oldestKey = calculationCache.keys().next().value;
    if (oldestKey) calculationCache.delete(oldestKey);
  }
  calculationCache.set(key, { result, timestamp: Date.now() });
};

// Common calculation logic for quotes with vyrobky, priplatky, kovanie, montaz
const calculateCommonTotals = (
  vyrobkyTotal: number,
  priplatkyTotal: number,
  zlavaPercent: number,
  kovanieItems: Array<{ cenaCelkom: number }>,
  montazItems: Array<{ cenaCelkom: number }>,
  manualCenaSDPH?: number | null
): QuoteTotals => {
  const subtotal = vyrobkyTotal + priplatkyTotal;
  const zlava = subtotal * zlavaPercent / 100;
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

  const priplatkyTotal = (data.priplatky || []).reduce((sum, item) => sum + (item.cenaCelkom || 0), 0);

  const result = calculateCommonTotals(
    vyrobkyTotal,
    priplatkyTotal,
    data.zlavaPercent || 0,
    data.kovanie || [],
    data.montaz || [],
    data.manualCenaSDPH
  );

  setCache(cacheKey, result);
  return result;
};

export const calculateNabytokTotals = (data: NabytokData): QuoteTotals => {
  const cacheKey = createCacheKey('nabytok:', data);
  const cached = getCached<QuoteTotals>(cacheKey);
  if (cached) return cached;

  const vyrobkyTotal = (data.vyrobky || []).reduce((sum, item) => sum + (item.cenaCelkom || 0), 0);
  const priplatkyTotal = (data.priplatky || []).reduce((sum, item) => sum + (item.cenaCelkom || 0), 0);

  const result = calculateCommonTotals(
    vyrobkyTotal,
    priplatkyTotal,
    data.zlavaPercent || 0,
    data.kovanie || [],
    data.montaz || [],
    data.manualCenaSDPH
  );

  setCache(cacheKey, result);
  return result;
};

export const calculateSchodyTotals = (data: SchodyData): QuoteTotals => {
  const cacheKey = createCacheKey('schody:', data);
  const cached = getCached<QuoteTotals>(cacheKey);
  if (cached) return cached;

  const vyrobkyTotal = (data.vyrobky || []).reduce((sum, item) => sum + (item.cenaCelkom || 0), 0);
  const priplatkyTotal = (data.priplatky || []).reduce((sum, item) => sum + (item.cenaCelkom || 0), 0);

  const result = calculateCommonTotals(
    vyrobkyTotal,
    priplatkyTotal,
    data.zlavaPercent || 0,
    data.kovanie || [],
    data.montaz || [],
    data.manualCenaSDPH
  );

  setCache(cacheKey, result);
  return result;
};

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

// Hook-friendly memoized calculation
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

// Clear cache (useful for testing or forced recalculation)
export const clearCalculationCache = (): void => {
  calculationCache.clear();
};
