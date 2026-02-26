/**
 * Unit Tests for Price Calculations Module
 *
 * Tests all quote calculation functions to ensure correct financial calculations.
 * These tests are critical as incorrect calculations directly impact invoicing.
 *
 * @module priceCalculations.test
 */

import {
  calculateDvereTotals,
  calculateNabytokTotals,
  calculateSchodyTotals,
  calculatePuzdraTotals,
  clearCalculationCache,
  QuoteTotals,
  PuzdraTotals
} from './priceCalculations';
import { DvereData, NabytokData, SchodyData, PuzdraData } from '../types';

// Slovak VAT rate (must match the module)
const DPH_RATE = 0.23;

// Helper to create minimal valid data objects
const createMinimalDvereData = (overrides: Partial<DvereData> = {}): DvereData => ({
  popisVyrobkov: '',
  dvereTyp: '',
  zarubnaTyp: '',
  specifications: [],
  showCustomerInfo: false,
  showArchitectInfo: false,
  vyrobky: [],
  priplatky: [],
  zlavaPercent: 0,
  kovanie: [],
  montaz: [],
  montazPoznamka: '',
  platnostPonuky: '',
  miestoDodavky: '',
  zameranie: '',
  terminDodania: '',
  platba1Percent: 60,
  platba2Percent: 30,
  platba3Percent: 10,
  ...overrides
});

const createMinimalNabytokData = (overrides: Partial<NabytokData> = {}): NabytokData => ({
  popisVyrobkov: '',
  vyrobkyTyp: '',
  vyrobkyPopis: '',
  showCustomerInfo: false,
  showArchitectInfo: false,
  vyrobky: [],
  priplatky: [],
  zlavaPercent: 0,
  kovanie: [],
  montaz: [],
  platnostPonuky: '',
  miestoDodavky: '',
  zameranie: '',
  terminDodania: '',
  platba1Percent: 60,
  platba2Percent: 30,
  platba3Percent: 10,
  ...overrides
});

const createMinimalSchodyData = (overrides: Partial<SchodyData> = {}): SchodyData => ({
  popisVyrobkov: '',
  vyrobkyTyp: '',
  vyrobkyPopis: '',
  showCustomerInfo: false,
  showArchitectInfo: false,
  vyrobky: [],
  priplatky: [],
  zlavaPercent: 0,
  kovanie: [],
  montaz: [],
  platnostPonuky: '',
  miestoDodavky: '',
  zameranie: '',
  terminDodania: '',
  platba1Percent: 60,
  platba2Percent: 30,
  platba3Percent: 10,
  ...overrides
});

const createMinimalPuzdraData = (overrides: Partial<PuzdraData> = {}): PuzdraData => ({
  dodavatel: {
    nazov: '',
    ulica: '',
    mesto: '',
    tel: '',
    email: '',
    email2: ''
  },
  zakazka: '',
  polozky: [],
  tovarDorucitNaAdresu: {
    firma: '',
    ulica: '',
    mesto: ''
  },
  ...overrides
});

// Clear cache before each test to ensure isolation
beforeEach(() => {
  clearCalculationCache();
});

// =============================================================================
// calculateDvereTotals Tests
// =============================================================================

describe('calculateDvereTotals', () => {
  describe('empty data', () => {
    it('should return zero totals for empty data', () => {
      const data = createMinimalDvereData();
      const result = calculateDvereTotals(data);

      expect(result.vyrobkyTotal).toBe(0);
      expect(result.priplatkyTotal).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.zlava).toBe(0);
      expect(result.afterZlava).toBe(0);
      expect(result.kovanieTotal).toBe(0);
      expect(result.montazTotal).toBe(0);
      expect(result.cenaBezDPH).toBe(0);
      expect(result.dph).toBe(0);
      expect(result.cenaSDPH).toBe(0);
    });
  });

  describe('product calculations (vyrobky)', () => {
    it('should calculate dvere price correctly (ks * cenaDvere)', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          { ks: 2, cenaDvere: 500, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.vyrobkyTotal).toBe(1000); // 2 * 500
    });

    it('should calculate zarubna price correctly (ksZarubna * cenaZarubna)', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          { ks: 0, cenaDvere: 0, ksZarubna: 3, cenaZarubna: 200, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.vyrobkyTotal).toBe(600); // 3 * 200
    });

    it('should calculate obklad price correctly (ksObklad * cenaObklad)', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          { ks: 0, cenaDvere: 0, ksZarubna: 0, cenaZarubna: 0, ksObklad: 4, cenaObklad: 150, ksPrazdne: 0, cenaPrazdne: 0 }
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.vyrobkyTotal).toBe(600); // 4 * 150
    });

    it('should calculate prazdne price correctly (ksPrazdne * cenaPrazdne)', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          { ks: 0, cenaDvere: 0, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 5, cenaPrazdne: 100 }
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.vyrobkyTotal).toBe(500); // 5 * 100
    });

    it('should sum all product components correctly', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          { ks: 2, cenaDvere: 500, ksZarubna: 2, cenaZarubna: 200, ksObklad: 1, cenaObklad: 150, ksPrazdne: 1, cenaPrazdne: 100 }
        ]
      });
      const result = calculateDvereTotals(data);

      // 2*500 + 2*200 + 1*150 + 1*100 = 1000 + 400 + 150 + 100 = 1650
      expect(result.vyrobkyTotal).toBe(1650);
    });

    it('should handle multiple products (rooms)', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          { ks: 1, cenaDvere: 500, ksZarubna: 1, cenaZarubna: 200, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 },
          { ks: 1, cenaDvere: 600, ksZarubna: 1, cenaZarubna: 250, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }
        ]
      });
      const result = calculateDvereTotals(data);

      // Room 1: 500 + 200 = 700
      // Room 2: 600 + 250 = 850
      // Total: 1550
      expect(result.vyrobkyTotal).toBe(1550);
    });

    it('should handle null/undefined values gracefully', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          { ks: null, cenaDvere: undefined, ksZarubna: 2, cenaZarubna: 100 } as any
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.vyrobkyTotal).toBe(200); // Only zarubna: 2 * 100
    });
  });

  describe('priplatky (supplements)', () => {
    it('should sum priplatky ks * cenaKs values', () => {
      const data = createMinimalDvereData({
        priplatky: [
          { ks: 1, cenaKs: 100, cenaCelkom: 100 },
          { ks: 1, cenaKs: 200, cenaCelkom: 200 },
          { ks: 1, cenaKs: 50, cenaCelkom: 50 }
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.priplatkyTotal).toBe(350);
    });
  });

  describe('discount (zlava)', () => {
    it('should calculate discount percentage correctly', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        zlavaPercent: 10
      });
      const result = calculateDvereTotals(data);

      expect(result.subtotal).toBe(1000);
      expect(result.zlava).toBe(100); // 10% of 1000
      expect(result.afterZlava).toBe(900);
    });

    it('should apply discount to subtotal (vyrobky + priplatky)', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 800, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        priplatky: [{ ks: 1, cenaKs: 200, cenaCelkom: 200 }],
        zlavaPercent: 20
      });
      const result = calculateDvereTotals(data);

      expect(result.subtotal).toBe(1000); // 800 + 200
      expect(result.zlava).toBe(200); // 20% of 1000
      expect(result.afterZlava).toBe(800);
    });

    it('should handle 0% discount', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        zlavaPercent: 0
      });
      const result = calculateDvereTotals(data);

      expect(result.zlava).toBe(0);
      expect(result.afterZlava).toBe(1000);
    });

    it('should handle 100% discount', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        zlavaPercent: 100
      });
      const result = calculateDvereTotals(data);

      expect(result.zlava).toBe(1000);
      expect(result.afterZlava).toBe(0);
    });
  });

  describe('kovanie (hardware)', () => {
    it('should sum kovanie items', () => {
      const data = createMinimalDvereData({
        kovanie: [
          { ks: 1, cenaKs: 50, cenaCelkom: 50 },
          { ks: 1, cenaKs: 75, cenaCelkom: 75 }
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.kovanieTotal).toBe(125);
    });

    it('should add kovanie after discount', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        zlavaPercent: 10,
        kovanie: [{ ks: 1, cenaKs: 100, cenaCelkom: 100 }]
      });
      const result = calculateDvereTotals(data);

      // afterZlava = 900, kovanie = 100
      // cenaBezDPH = 900 + 100 = 1000
      expect(result.cenaBezDPH).toBe(1000);
    });
  });

  describe('montaz (assembly)', () => {
    it('should sum montaz items', () => {
      const data = createMinimalDvereData({
        montaz: [
          { ks: 1, cenaKs: 200, cenaCelkom: 200 },
          { ks: 1, cenaKs: 150, cenaCelkom: 150 }
        ]
      });
      const result = calculateDvereTotals(data);

      expect(result.montazTotal).toBe(350);
    });

    it('should add montaz after discount', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        montaz: [{ ks: 1, cenaKs: 200, cenaCelkom: 200 }]
      });
      const result = calculateDvereTotals(data);

      expect(result.cenaBezDPH).toBe(1200); // 1000 + 200
    });
  });

  describe('VAT (DPH) calculation', () => {
    it('should calculate 23% VAT correctly', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }]
      });
      const result = calculateDvereTotals(data);

      expect(result.cenaBezDPH).toBe(1000);
      expect(result.dph).toBe(230); // 23% of 1000
      expect(result.cenaSDPH).toBe(1230);
    });

    it('should maintain VAT relationship: cenaSDPH = cenaBezDPH + dph', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 3, cenaDvere: 750, ksZarubna: 2, cenaZarubna: 300, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        priplatky: [{ ks: 1, cenaKs: 150, cenaCelkom: 150 }],
        zlavaPercent: 5,
        kovanie: [{ ks: 1, cenaKs: 80, cenaCelkom: 80 }],
        montaz: [{ ks: 1, cenaKs: 250, cenaCelkom: 250 }]
      });
      const result = calculateDvereTotals(data);

      expect(result.cenaSDPH).toBeCloseTo(result.cenaBezDPH + result.dph, 10);
    });
  });

  describe('manual price override (manualCenaSDPH)', () => {
    it('should use manual price when provided', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        manualCenaSDPH: 1500
      });
      const result = calculateDvereTotals(data);

      expect(result.cenaSDPH).toBe(1500);
    });

    it('should back-calculate cenaBezDPH from manual price', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        manualCenaSDPH: 1230
      });
      const result = calculateDvereTotals(data);

      expect(result.cenaSDPH).toBe(1230);
      expect(result.cenaBezDPH).toBeCloseTo(1000, 2); // 1230 / 1.23 ≈ 1000
      expect(result.dph).toBeCloseTo(230, 2);
    });

    it('should ignore null manualCenaSDPH', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        manualCenaSDPH: null
      });
      const result = calculateDvereTotals(data);

      expect(result.cenaSDPH).toBe(1230); // Normal calculation
    });

    it('should ignore undefined manualCenaSDPH', () => {
      const data = createMinimalDvereData({
        vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
        manualCenaSDPH: undefined
      });
      const result = calculateDvereTotals(data);

      expect(result.cenaSDPH).toBe(1230); // Normal calculation
    });
  });

  describe('complete calculation flow', () => {
    it('should calculate a realistic quote correctly', () => {
      const data = createMinimalDvereData({
        vyrobky: [
          // Room 1: Door + Frame
          { ks: 1, cenaDvere: 850, ksZarubna: 1, cenaZarubna: 320, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 },
          // Room 2: Door + Frame + Cladding
          { ks: 1, cenaDvere: 920, ksZarubna: 1, cenaZarubna: 350, ksObklad: 1, cenaObklad: 180, ksPrazdne: 0, cenaPrazdne: 0 }
        ],
        priplatky: [
          { ks: 1, cenaKs: 75, cenaCelkom: 75 },  // Glass upgrade
          { ks: 1, cenaKs: 45, cenaCelkom: 45 }   // Special finish
        ],
        zlavaPercent: 5,
        kovanie: [
          { ks: 1, cenaKs: 120, cenaCelkom: 120 }  // Handle set
        ],
        montaz: [
          { ks: 1, cenaKs: 280, cenaCelkom: 280 }  // Installation
        ]
      });

      const result = calculateDvereTotals(data);

      // vyrobkyTotal: (850+320) + (920+350+180) = 1170 + 1450 = 2620
      expect(result.vyrobkyTotal).toBe(2620);

      // priplatkyTotal: 75 + 45 = 120
      expect(result.priplatkyTotal).toBe(120);

      // subtotal: 2620 + 120 = 2740
      expect(result.subtotal).toBe(2740);

      // zlava: 5% of 2740 = 137
      expect(result.zlava).toBe(137);

      // afterZlava: 2740 - 137 = 2603
      expect(result.afterZlava).toBe(2603);

      // kovanieTotal: 120
      expect(result.kovanieTotal).toBe(120);

      // montazTotal: 280
      expect(result.montazTotal).toBe(280);

      // cenaBezDPH: 2603 + 120 + 280 = 3003
      expect(result.cenaBezDPH).toBe(3003);

      // dph: 23% of 3003 = 690.69
      expect(result.dph).toBeCloseTo(690.69, 2);

      // cenaSDPH: 3003 + 690.69 = 3693.69
      expect(result.cenaSDPH).toBeCloseTo(3693.69, 2);
    });
  });
});

// =============================================================================
// calculateNabytokTotals Tests
// =============================================================================

describe('calculateNabytokTotals', () => {
  it('should return zero totals for empty data', () => {
    const data = createMinimalNabytokData();
    const result = calculateNabytokTotals(data);

    expect(result.vyrobkyTotal).toBe(0);
    expect(result.cenaSDPH).toBe(0);
  });

  it('should sum vyrobky ks * cenaKs values', () => {
    const data = createMinimalNabytokData({
      vyrobky: [
        { ks: 3, cenaKs: 500, cenaCelkom: 1500 },
        { ks: 2, cenaKs: 1100, cenaCelkom: 2200 }
      ]
    });
    const result = calculateNabytokTotals(data);

    expect(result.vyrobkyTotal).toBe(3700);
  });

  it('should calculate complete totals correctly', () => {
    const data = createMinimalNabytokData({
      vyrobky: [{ ks: 5, cenaKs: 1000, cenaCelkom: 5000 }],
      priplatky: [{ ks: 1, cenaKs: 500, cenaCelkom: 500 }],
      zlavaPercent: 10,
      kovanie: [{ ks: 1, cenaKs: 200, cenaCelkom: 200 }],
      montaz: [{ ks: 1, cenaKs: 800, cenaCelkom: 800 }]
    });
    const result = calculateNabytokTotals(data);

    // subtotal: 5000 + 500 = 5500
    // zlava: 10% of 5500 = 550
    // afterZlava: 5500 - 550 = 4950
    // cenaBezDPH: 4950 + 200 + 800 = 5950
    // cenaSDPH: 5950 * 1.23 = 7318.50

    expect(result.subtotal).toBe(5500);
    expect(result.zlava).toBe(550);
    expect(result.afterZlava).toBe(4950);
    expect(result.cenaBezDPH).toBe(5950);
    expect(result.cenaSDPH).toBeCloseTo(7318.50, 2);
  });

  it('should handle manual price override', () => {
    const data = createMinimalNabytokData({
      vyrobky: [{ ks: 5, cenaKs: 1000, cenaCelkom: 5000 }],
      manualCenaSDPH: 10000
    });
    const result = calculateNabytokTotals(data);

    expect(result.cenaSDPH).toBe(10000);
    expect(result.cenaBezDPH).toBeCloseTo(8130.08, 2); // 10000 / 1.23
  });
});

// =============================================================================
// calculateSchodyTotals Tests
// =============================================================================

describe('calculateSchodyTotals', () => {
  it('should return zero totals for empty data', () => {
    const data = createMinimalSchodyData();
    const result = calculateSchodyTotals(data);

    expect(result.vyrobkyTotal).toBe(0);
    expect(result.cenaSDPH).toBe(0);
  });

  it('should calculate staircase quote correctly', () => {
    const data = createMinimalSchodyData({
      vyrobky: [
        { ks: 1, cenaKs: 8500, cenaCelkom: 8500 }, // Main staircase
        { ks: 1, cenaKs: 1200, cenaCelkom: 1200 }  // Railing
      ],
      priplatky: [{ ks: 1, cenaKs: 350, cenaCelkom: 350 }], // Special wood treatment
      zlavaPercent: 8,
      montaz: [{ ks: 1, cenaKs: 1500, cenaCelkom: 1500 }]
    });
    const result = calculateSchodyTotals(data);

    // vyrobky: 8500 + 1200 = 9700
    // priplatky: 350
    // subtotal: 10050
    // zlava: 8% of 10050 = 804
    // afterZlava: 10050 - 804 = 9246
    // cenaBezDPH: 9246 + 1500 = 10746
    // cenaSDPH: 10746 * 1.23 = 13217.58

    expect(result.vyrobkyTotal).toBe(9700);
    expect(result.subtotal).toBe(10050);
    expect(result.zlava).toBe(804);
    expect(result.cenaBezDPH).toBe(10746);
    expect(result.cenaSDPH).toBeCloseTo(13217.58, 2);
  });
});

// =============================================================================
// calculatePuzdraTotals Tests
// =============================================================================

describe('calculatePuzdraTotals', () => {
  it('should return zero totals for empty data', () => {
    const data = createMinimalPuzdraData();
    const result = calculatePuzdraTotals(data);

    expect(result.cenaBezDPH).toBe(0);
    expect(result.dph).toBe(0);
    expect(result.cenaSDPH).toBe(0);
  });

  it('should sum polozky with cena field', () => {
    const data = createMinimalPuzdraData({
      polozky: [
        { id: 1, nazov: 'Puzdro 1', mnozstvo: 1, cena: 500 } as any,
        { id: 2, nazov: 'Puzdro 2', mnozstvo: 2, cena: 300 } as any
      ]
    });
    const result = calculatePuzdraTotals(data);

    expect(result.cenaBezDPH).toBe(800); // 500 + 300
    expect(result.dph).toBeCloseTo(184, 2); // 23% of 800
    expect(result.cenaSDPH).toBeCloseTo(984, 2); // 800 * 1.23
  });

  it('should handle items without cena field', () => {
    const data = createMinimalPuzdraData({
      polozky: [
        { id: 1, nazov: 'Puzdro', mnozstvo: 5 }
      ]
    });
    const result = calculatePuzdraTotals(data);

    expect(result.cenaBezDPH).toBe(0);
    expect(result.cenaSDPH).toBe(0);
  });
});

// =============================================================================
// Cache Tests
// =============================================================================

describe('calculation caching', () => {
  it('should return same result for identical input', () => {
    const data = createMinimalDvereData({
      vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }]
    });

    const result1 = calculateDvereTotals(data);
    const result2 = calculateDvereTotals(data);

    expect(result1).toBe(result2); // Same reference (cached)
  });

  it('should recalculate for different input', () => {
    const data1 = createMinimalDvereData({
      vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }]
    });
    const data2 = createMinimalDvereData({
      vyrobky: [{ ks: 2, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }]
    });

    const result1 = calculateDvereTotals(data1);
    const result2 = calculateDvereTotals(data2);

    expect(result1.vyrobkyTotal).toBe(1000);
    expect(result2.vyrobkyTotal).toBe(2000);
  });

  it('clearCalculationCache should force recalculation', () => {
    const data = createMinimalDvereData({
      vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }]
    });

    const result1 = calculateDvereTotals(data);
    clearCalculationCache();
    const result2 = calculateDvereTotals(data);

    // Different object references after cache clear
    expect(result1).not.toBe(result2);
    // But same values
    expect(result1.cenaSDPH).toBe(result2.cenaSDPH);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  it('should handle very large numbers', () => {
    const data = createMinimalDvereData({
      vyrobky: [{ ks: 1000, cenaDvere: 99999, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }]
    });
    const result = calculateDvereTotals(data);

    expect(result.vyrobkyTotal).toBe(99999000);
    expect(result.cenaSDPH).toBeCloseTo(99999000 * 1.23, 2);
  });

  it('should handle decimal prices', () => {
    const data = createMinimalDvereData({
      vyrobky: [{ ks: 1, cenaDvere: 999.99, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }]
    });
    const result = calculateDvereTotals(data);

    expect(result.vyrobkyTotal).toBe(999.99);
  });

  it('should handle negative prices (credits/refunds)', () => {
    const data = createMinimalDvereData({
      vyrobky: [{ ks: 1, cenaDvere: 1000, ksZarubna: 0, cenaZarubna: 0, ksObklad: 0, cenaObklad: 0, ksPrazdne: 0, cenaPrazdne: 0 }],
      priplatky: [{ ks: 1, cenaKs: -200, cenaCelkom: -200 }] // Credit/refund
    });
    const result = calculateDvereTotals(data);

    expect(result.subtotal).toBe(800); // 1000 - 200
  });

  it('should handle empty arrays in data', () => {
    const data = createMinimalDvereData({
      vyrobky: [],
      priplatky: [],
      kovanie: [],
      montaz: []
    });
    const result = calculateDvereTotals(data);

    expect(result.cenaSDPH).toBe(0);
  });

  it('should handle undefined arrays in data', () => {
    const data = {
      popisVyrobkov: '',
      dvereTyp: '',
      zarubnaTyp: '',
      specifications: [],
      showCustomerInfo: false,
      showArchitectInfo: false,
      vyrobky: undefined,
      priplatky: undefined,
      zlavaPercent: 0,
      kovanie: undefined,
      montaz: undefined,
      montazPoznamka: '',
      platnostPonuky: '',
      miestoDodavky: '',
      zameranie: '',
      terminDodania: '',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10
    } as any as DvereData;

    const result = calculateDvereTotals(data);

    expect(result.cenaSDPH).toBe(0);
  });
});
