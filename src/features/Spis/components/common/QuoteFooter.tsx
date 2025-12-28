import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QuoteFooterProps {
  isDark: boolean;
  data: any;
  onChange: (data: any) => void;
  headerInfo: {
    vypracoval: string;
    telefon: string;
    email: string;
  };
  totals: {
    cenaBezDPH: number;
    dph: number;
    cenaSDPH: number;
  };
}

export const QuoteFooter: React.FC<QuoteFooterProps> = ({ isDark, data, onChange, headerInfo, totals }) => {
  // Local state for euro amount inputs to prevent cursor jumping
  const [localAmount1, setLocalAmount1] = useState<string>('');
  const [localAmount2, setLocalAmount2] = useState<string>('');
  const [localAmount3, setLocalAmount3] = useState<string>('');
  const [editingAmount, setEditingAmount] = useState<1 | 2 | 3 | null>(null);

  // Local state for total price input to prevent cursor jumping
  const [localTotal, setLocalTotal] = useState<string>('');
  const [editingTotal, setEditingTotal] = useState<boolean>(false);

  // Calculate displayed amounts - use manual amount if set, otherwise calculate from percentage
  // When some amounts are manually set, remaining amounts are calculated from remaining total
  const getDisplayAmount = (index: 1 | 2 | 3): number => {
    const total = totals.cenaSDPH;

    // Get fixed amounts (manually set)
    const fixed1 = data.platba1Amount != null ? data.platba1Amount : null;
    const fixed2 = data.platba2Amount != null ? data.platba2Amount : null;
    const fixed3 = data.platba3Amount != null ? data.platba3Amount : null;

    if (index === 1) {
      if (fixed1 != null) return fixed1;
      // If not fixed, calculate from percentage
      return total * data.platba1Percent / 100;
    } else if (index === 2) {
      if (fixed2 != null) return fixed2;
      // Calculate remaining after fixed amounts
      const remaining = total - (fixed1 ?? 0) - (fixed3 ?? 0);
      if (fixed1 != null && fixed3 == null) {
        // Only payment 1 is fixed, distribute remaining between 2 and 3 by ratio
        const ratio = data.platba2Percent / (data.platba2Percent + data.platba3Percent);
        return remaining * ratio;
      } else if (fixed1 != null && fixed3 != null) {
        // Both 1 and 3 are fixed, 2 gets the rest
        return remaining;
      }
      return total * data.platba2Percent / 100;
    } else {
      if (fixed3 != null) return fixed3;
      // Calculate remaining after fixed amounts
      const remaining = total - (fixed1 ?? 0) - (fixed2 ?? 0);
      if (fixed1 != null && fixed2 == null) {
        // Only payment 1 is fixed, distribute remaining between 2 and 3 by ratio
        const ratio = data.platba3Percent / (data.platba2Percent + data.platba3Percent);
        return remaining * ratio;
      } else if (fixed1 != null && fixed2 != null) {
        // Both 1 and 2 are fixed, 3 gets the rest
        return remaining;
      }
      return total * data.platba3Percent / 100;
    }
  };

  // Calculate display percentage - always derived from displayed amount for consistency
  const getDisplayPercent = (index: 1 | 2 | 3): number => {
    const total = totals.cenaSDPH;
    if (total === 0) return index === 1 ? 60 : index === 2 ? 30 : 10;

    // Always calculate percentage from the displayed amount for consistency
    const amount = getDisplayAmount(index);
    return (amount / total) * 100;
  };

  // Handle amount change - store exact amount, recalculate percent for display
  const handleAmountChange = (index: 1 | 2 | 3, newAmount: number) => {
    const total = totals.cenaSDPH;
    if (total === 0) return;

    // Store the exact amount the user entered
    const updates: any = { ...data };

    if (index === 1) {
      updates.platba1Amount = newAmount;
      // Recalculate percentage for display purposes
      updates.platba1Percent = parseFloat(((newAmount / total) * 100).toFixed(2));
    } else if (index === 2) {
      updates.platba2Amount = newAmount;
      updates.platba2Percent = parseFloat(((newAmount / total) * 100).toFixed(2));
    } else {
      updates.platba3Amount = newAmount;
      updates.platba3Percent = parseFloat(((newAmount / total) * 100).toFixed(2));
    }

    onChange(updates);
  };

  const handleTotalChange = (newTotal: number) => {
    // When total changes, clear manual amounts so they recalculate from percentages
    onChange({
        ...data,
        manualCenaSDPH: newTotal,
        platba1Amount: null,
        platba2Amount: null,
        platba3Amount: null
    });
  };

  // Handle percentage change - clear manual amount, update percentage
  const handlePercentageChange = (index: 1 | 2 | 3, newPercent: number) => {
    let p1 = data.platba1Percent;
    let p2 = data.platba2Percent;
    let p3 = data.platba3Percent;

    // Clear manual amounts when percentage is changed
    const updates: any = {
      platba1Amount: index === 1 ? null : data.platba1Amount,
      platba2Amount: index === 2 ? null : data.platba2Amount,
      platba3Amount: index === 3 ? null : data.platba3Amount
    };

    if (index === 1) {
      p1 = newPercent;
      const remaining = 100 - p1;
      if (p2 + p3 === 0) {
         p2 = remaining;
      } else {
         const ratio = p2 / (p2 + p3);
         p2 = remaining * ratio;
         p3 = remaining - p2;
      }
      // Clear all amounts when p1 changes since it affects distribution
      updates.platba2Amount = null;
      updates.platba3Amount = null;
    } else if (index === 2) {
      p2 = newPercent;
      p3 = 100 - p1 - p2;
      if (p3 < 0) {
         p3 = 0;
         p1 = 100 - p2;
         updates.platba1Amount = null;
      }
      updates.platba3Amount = null;
    } else if (index === 3) {
      p3 = newPercent;
      p2 = 100 - p1 - p3;
      if (p2 < 0) {
         p2 = 0;
         p1 = 100 - p3;
         updates.platba1Amount = null;
      }
      updates.platba2Amount = null;
    }

    onChange({
        ...data,
        ...updates,
        platba1Percent: parseFloat(p1.toFixed(2)),
        platba2Percent: parseFloat(p2.toFixed(2)),
        platba3Percent: parseFloat(p3.toFixed(2))
    });
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} p-4`}>
      {/* Left side - delivery info */}
      <div className="space-y-2 text-xs">
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Platnosť ponuky:</span>
          <input
            type="text"
            value={data.platnostPonuky}
            onChange={(e) => onChange({...data, platnostPonuky: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex flex-col gap-1">
            <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Miesto dodávky:</span>
            <input
                type="text"
                value={data.miestoDodavky}
                onChange={(e) => onChange({...data, miestoDodavky: e.target.value})}
                className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
            </div>
            {data.miestoDodavky && (
                <div className="flex justify-end pr-0 mt-2">
                    <div className="p-2 bg-white rounded shadow border border-gray-200">
                        <QRCodeSVG
                            value={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.miestoDodavky)}`}
                            size={100}
                        />
                        <div className="text-[10px] text-center mt-1 text-gray-800">Google Maps</div>
                    </div>
                </div>
            )}
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Zameranie:</span>
          <input
            type="text"
            value={data.zameranie}
            onChange={(e) => onChange({...data, zameranie: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Termín dodania:</span>
          <input
            type="text"
            value={data.terminDodania}
            onChange={(e) => onChange({...data, terminDodania: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Vypracoval:</span>
          <input
            type="text"
            value={data.vypracoval !== undefined ? data.vypracoval : headerInfo.vypracoval}
            onChange={(e) => onChange({...data, vypracoval: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Kontakt:</span>
          <input
            type="text"
            value={data.kontakt !== undefined ? data.kontakt : headerInfo.telefon}
            onChange={(e) => onChange({...data, kontakt: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>E-mail:</span>
          <input
            type="text"
            value={data.emailVypracoval !== undefined ? data.emailVypracoval : headerInfo.email}
            onChange={(e) => onChange({...data, emailVypracoval: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Dátum:</span>
          <input
            type="text"
            value={data.datum !== undefined ? data.datum : new Date().toLocaleDateString('sk-SK')}
            onChange={(e) => onChange({...data, datum: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
      </div>
      {/* Right side - totals and payment */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>Cena bez DPH:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totals.cenaBezDPH.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>DPH 23%:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totals.dph.toFixed(2)} €</span>
        </div>
        <div className={`flex justify-between items-center text-lg p-2 rounded ${isDark ? 'bg-dark-600' : 'bg-gray-100'}`}>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Cena s DPH:</span>
          <div className="flex items-center gap-1">
            <input
                type="text"
                inputMode="decimal"
                value={editingTotal ? localTotal : totals.cenaSDPH.toFixed(2)}
                onFocus={() => {
                  setEditingTotal(true);
                  setLocalTotal(totals.cenaSDPH.toFixed(2));
                }}
                onChange={(e) => setLocalTotal(e.target.value)}
                onBlur={() => {
                  const parsed = parseFloat(localTotal.replace(',', '.')) || 0;
                  handleTotalChange(parsed);
                  setEditingTotal(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseFloat(localTotal.replace(',', '.')) || 0;
                    handleTotalChange(parsed);
                    setEditingTotal(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className={`w-32 px-1 py-0.5 text-right font-bold rounded bg-transparent border-b ${isDark ? 'text-white border-gray-400 focus:border-white' : 'text-gray-800 border-gray-400 focus:border-black'} focus:outline-none`}
            />
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Platby:</p>

          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>1. záloha - pri objednávke</span>
            <div className="flex items-center gap-1 w-16 justify-end">
                <input
                    type="text"
                    inputMode="decimal"
                    value={getDisplayPercent(1).toFixed(0)}
                    onChange={(e) => handlePercentageChange(1, parseFloat(e.target.value.replace(',', '.')) || 0)}
                    className={`w-10 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>%</span>
            </div>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="text"
                    inputMode="decimal"
                    value={editingAmount === 1 ? localAmount1 : getDisplayAmount(1).toFixed(2)}
                    onFocus={() => {
                      setEditingAmount(1);
                      setLocalAmount1(getDisplayAmount(1).toFixed(2));
                    }}
                    onChange={(e) => setLocalAmount1(e.target.value)}
                    onBlur={() => {
                      handleAmountChange(1, parseFloat(localAmount1.replace(',', '.')) || 0);
                      setEditingAmount(null);
                    }}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>2. platba - pred montážou</span>
            <div className="flex items-center gap-1 w-16 justify-end">
                <input
                    type="text"
                    inputMode="decimal"
                    value={getDisplayPercent(2).toFixed(0)}
                    onChange={(e) => handlePercentageChange(2, parseFloat(e.target.value.replace(',', '.')) || 0)}
                    className={`w-10 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>%</span>
            </div>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="text"
                    inputMode="decimal"
                    value={editingAmount === 2 ? localAmount2 : getDisplayAmount(2).toFixed(2)}
                    onFocus={() => {
                      setEditingAmount(2);
                      setLocalAmount2(getDisplayAmount(2).toFixed(2));
                    }}
                    onChange={(e) => setLocalAmount2(e.target.value)}
                    onBlur={() => {
                      handleAmountChange(2, parseFloat(localAmount2.replace(',', '.')) || 0);
                      setEditingAmount(null);
                    }}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>3. platba - po montáži</span>
            <div className="flex items-center gap-1 w-16 justify-end">
                <input
                    type="text"
                    inputMode="decimal"
                    value={getDisplayPercent(3).toFixed(0)}
                    onChange={(e) => handlePercentageChange(3, parseFloat(e.target.value.replace(',', '.')) || 0)}
                    className={`w-10 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>%</span>
            </div>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="text"
                    inputMode="decimal"
                    value={editingAmount === 3 ? localAmount3 : getDisplayAmount(3).toFixed(2)}
                    onFocus={() => {
                      setEditingAmount(3);
                      setLocalAmount3(getDisplayAmount(3).toFixed(2));
                    }}
                    onChange={(e) => setLocalAmount3(e.target.value)}
                    onBlur={() => {
                      handleAmountChange(3, parseFloat(localAmount3.replace(',', '.')) || 0);
                      setEditingAmount(null);
                    }}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
