import React from 'react';

interface QuoteSummaryProps {
  isDark: boolean;
  totals: {
    subtotal: number;
    zlava: number;
    afterZlava: number;
  };
  zlavaPercent: number;
  onZlavaChange: (percent: number) => void;
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  isDark,
  totals,
  zlavaPercent,
  onZlavaChange
}) => {
  return (
    <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} overflow-hidden`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
            <th className="px-4 py-2 text-right font-semibold" colSpan={3}>Cena celkom</th>
          </tr>
        </thead>
        <tbody>
          <tr className={isDark ? 'bg-gray-700' : 'bg-white'}>
            <td className={`px-4 py-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Cena za výrobky a príplatky spolu:
            </td>
            <td className={`px-4 py-2 text-right w-24 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>spolu bez DPH</td>
            <td className={`px-4 py-2 text-right font-semibold w-28 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.subtotal.toFixed(2)} €
            </td>
          </tr>
          <tr className={isDark ? 'bg-gray-750' : 'bg-gray-50'}>
            <td className={`px-4 py-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Zľava z ceny výrobkov a príplatkov:
            </td>
            <td className={`px-4 py-2 text-right w-20`}>
              <div className="flex items-center justify-end gap-1">
                <input
                  type="number"
                  value={zlavaPercent}
                  onChange={(e) => onZlavaChange(parseFloat(e.target.value) || 0)}
                  className={`w-12 px-1 py-0.5 text-xs text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-100 text-gray-800 border-gray-300'} border`}
                />
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>%</span>
              </div>
            </td>
            <td className={`px-4 py-2 text-right font-semibold w-28 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.zlava.toFixed(2)} €
            </td>
          </tr>
          <tr className={`${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
            <td className={`px-4 py-2 text-right font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Cena výrobkov a príplatkov po odpočítaní zľavy spolu:
            </td>
            <td className={`px-4 py-2 text-right w-24 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>spolu bez DPH</td>
            <td className={`px-4 py-2 text-right font-bold w-28 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.afterZlava.toFixed(2)} €
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
