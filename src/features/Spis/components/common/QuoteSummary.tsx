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
    <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} p-4`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Cena za výrobky a príplatky spolu:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {totals.subtotal.toFixed(2)} €
          </span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Zľava z ceny výrobkov a príplatkov:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={zlavaPercent}
              onChange={(e) => onZlavaChange(parseFloat(e.target.value) || 0)}
              className={`w-16 px-2 py-1 text-xs text-right rounded align-middle ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-100 text-gray-800 border-gray-300'} border`}
            />
            <span className={`align-middle ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>%</span>
            <span className={`font-semibold align-middle ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.zlava.toFixed(2)} €
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Cena výrobkov a príplatkov po odpočítaní zľavy spolu:</span>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {totals.afterZlava.toFixed(2)} €
          </span>
        </div>
      </div>
    </div>
  );
};
