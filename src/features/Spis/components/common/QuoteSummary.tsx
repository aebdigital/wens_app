import React from 'react';

interface QuoteSummaryProps {
  isDark: boolean;
  totals: {
    subtotal: number;
    zlava: number;
    afterZlava: number;
  };
  zlavaPercent: number;
  zlavaEur?: number;
  useZlavaPercent?: boolean;
  useZlavaEur?: boolean;
  onZlavaChange: (percent: number) => void;
  onZlavaEurChange?: (eur: number) => void;
  onUseZlavaPercentChange?: (use: boolean) => void;
  onUseZlavaEurChange?: (use: boolean) => void;
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  isDark,
  totals,
  zlavaPercent,
  zlavaEur = 0,
  useZlavaPercent = true,
  useZlavaEur = false,
  onZlavaChange,
  onZlavaEurChange,
  onUseZlavaPercentChange,
  onUseZlavaEurChange
}) => {
  // Calculate total discount based on enabled options
  const percentDiscount = useZlavaPercent ? totals.subtotal * (zlavaPercent / 100) : 0;
  const eurDiscount = useZlavaEur ? zlavaEur : 0;
  const totalDiscount = percentDiscount + eurDiscount;
  const afterDiscount = totals.subtotal - totalDiscount;

  return (
    <div className={`rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} overflow-hidden`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
            <th className="px-4 py-2 text-right font-semibold" colSpan={3}>Cena celkom</th>
          </tr>
        </thead>
        <tbody>
          <tr className={isDark ? 'bg-dark-700' : 'bg-white'}>
            <td className={`px-4 py-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Cena za výrobky a príplatky spolu:
            </td>
            <td className={`px-4 py-2 text-right w-24 text-xs ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>spolu bez DPH</td>
            <td className={`px-4 py-2 text-right font-semibold w-28 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.subtotal.toFixed(2)} €
            </td>
          </tr>
          {/* Percentage discount row */}
          <tr className={isDark ? 'bg-dark-750' : 'bg-gray-50'}>
            <td className={`px-4 py-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center justify-end gap-2">
                <input
                  type="checkbox"
                  checked={useZlavaPercent}
                  onChange={(e) => onUseZlavaPercentChange?.(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span>Zľava (%):</span>
              </div>
            </td>
            <td className={`px-4 py-2 text-right w-20`}>
              <div className="flex items-center justify-end gap-1">
                <input
                  type="number"
                  value={zlavaPercent}
                  onChange={(e) => onZlavaChange(parseFloat(e.target.value) || 0)}
                  disabled={!useZlavaPercent}
                  className={`w-12 px-1 py-0.5 text-xs text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-100 text-gray-800 border-gray-300'} border ${!useZlavaPercent ? 'opacity-50' : ''}`}
                />
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>%</span>
              </div>
            </td>
            <td className={`px-4 py-2 text-right font-semibold w-28 ${isDark ? 'text-white' : 'text-gray-800'} ${!useZlavaPercent ? 'opacity-50' : ''}`}>
              {percentDiscount.toFixed(2)} €
            </td>
          </tr>
          {/* EUR discount row */}
          <tr className={isDark ? 'bg-dark-700' : 'bg-white'}>
            <td className={`px-4 py-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center justify-end gap-2">
                <input
                  type="checkbox"
                  checked={useZlavaEur}
                  onChange={(e) => onUseZlavaEurChange?.(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span>Zľava (€):</span>
              </div>
            </td>
            <td className={`px-4 py-2 text-right w-20`}>
              <div className="flex items-center justify-end gap-1">
                <input
                  type="number"
                  value={zlavaEur}
                  onChange={(e) => onZlavaEurChange?.(parseFloat(e.target.value) || 0)}
                  disabled={!useZlavaEur}
                  className={`w-16 px-1 py-0.5 text-xs text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-100 text-gray-800 border-gray-300'} border ${!useZlavaEur ? 'opacity-50' : ''}`}
                />
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>€</span>
              </div>
            </td>
            <td className={`px-4 py-2 text-right font-semibold w-28 ${isDark ? 'text-white' : 'text-gray-800'} ${!useZlavaEur ? 'opacity-50' : ''}`}>
              {eurDiscount.toFixed(2)} €
            </td>
          </tr>
          <tr className={`${isDark ? 'bg-dark-600' : 'bg-gray-100'}`}>
            <td className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Cena výrobkov a príplatkov po odpočítaní zľavy spolu:
            </td>
            <td className={`px-4 py-2 text-right w-24 text-xs ${isDark ? 'text-gray-200' : 'text-gray-500'}`}>spolu bez DPH</td>
            <td className={`px-4 py-2 text-right font-bold w-28 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {afterDiscount.toFixed(2)} €
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
