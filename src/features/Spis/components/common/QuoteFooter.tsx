import React from 'react';

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
  
  const handleAmountChange = (index: 1 | 2 | 3, newAmount: number) => {
    const total = totals.cenaSDPH;
    if (total === 0) return;

    let p1 = data.platba1Percent;
    let p2 = data.platba2Percent;
    let p3 = data.platba3Percent;

    const currentAmount1 = total * p1 / 100;
    const currentAmount2 = total * p2 / 100;
    const currentAmount3 = total * p3 / 100;

    if (index === 1) {
      // Changing Zaloha
      const amount1 = Math.max(0, Math.min(total, newAmount));
      const remaining = total - amount1;
      
      // Try to keep Amount 3 constant, adjust Amount 2
      let amount3 = currentAmount3;
      if (amount3 > remaining) {
        amount3 = remaining;
      }
      const amount2 = remaining - amount3;
      
      p1 = (amount1 / total) * 100;
      p2 = (amount2 / total) * 100;
      p3 = (amount3 / total) * 100;

    } else if (index === 2) {
      // Changing 2. platba
      // "IF they also change the 2 platba then only change doplatok"
      // So Amount 1 stays constant. Amount 3 adjusts.
      const amount1 = currentAmount1;
      const maxAmount2 = total - amount1;
      const amount2 = Math.max(0, Math.min(maxAmount2, newAmount));
      const amount3 = maxAmount2 - amount2;
      
      p2 = (amount2 / total) * 100;
      p3 = (amount3 / total) * 100;

    } else if (index === 3) {
      // Changing Doplatok (3. platba)
      // Implicitly adjust 2. platba? Or 1?
      // Usually adjust the previous one (2. platba)
      const amount1 = currentAmount1;
      const maxAmount3 = total - amount1;
      const amount3 = Math.max(0, Math.min(maxAmount3, newAmount));
      const amount2 = maxAmount3 - amount3;

      p2 = (amount2 / total) * 100;
      p3 = (amount3 / total) * 100;
    }

    onChange({
        ...data,
        platba1Percent: parseFloat(p1.toFixed(2)),
        platba2Percent: parseFloat(p2.toFixed(2)),
        platba3Percent: parseFloat(p3.toFixed(2))
    });
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} p-4`}>
      {/* Left side - delivery info */}
      <div className="space-y-2 text-xs">
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Platnosť ponuky:</span>
          <input
            type="text"
            value={data.platnostPonuky}
            onChange={(e) => onChange({...data, platnostPonuky: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Miesto dodávky:</span>
          <input
            type="text"
            value={data.miestoDodavky}
            onChange={(e) => onChange({...data, miestoDodavky: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Zameranie:</span>
          <input
            type="text"
            value={data.zameranie}
            onChange={(e) => onChange({...data, zameranie: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Termín dodania:</span>
          <input
            type="text"
            value={data.terminDodania}
            onChange={(e) => onChange({...data, terminDodania: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vypracoval:</span>
          <span className={isDark ? 'text-white' : 'text-gray-800'}>{headerInfo.vypracoval}</span>
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kontakt:</span>
          <span className={isDark ? 'text-white' : 'text-gray-800'}>{headerInfo.telefon}</span>
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>E-mail:</span>
          <span className={isDark ? 'text-white' : 'text-gray-800'}>{headerInfo.email}</span>
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dátum:</span>
          <span className={isDark ? 'text-white' : 'text-gray-800'}>{new Date().toLocaleDateString('sk-SK')}</span>
        </div>
      </div>
      {/* Right side - totals and payment */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Cena bez DPH:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totals.cenaBezDPH.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>DPH 23%:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totals.dph.toFixed(2)} €</span>
        </div>
        <div className={`flex justify-between text-lg p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Cena s DPH:</span>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totals.cenaSDPH.toFixed(2)} €</span>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Platby:</p>
          
          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>1. záloha - pri objednávke</span>
            <span className={`w-12 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{data.platba1Percent.toFixed(0)}%</span>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="number"
                    value={(totals.cenaSDPH * data.platba1Percent / 100).toFixed(2)}
                    onChange={(e) => handleAmountChange(1, parseFloat(e.target.value) || 0)}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>2. platba - pred montážou</span>
            <span className={`w-12 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{data.platba2Percent.toFixed(0)}%</span>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="number"
                    value={(totals.cenaSDPH * data.platba2Percent / 100).toFixed(2)}
                    onChange={(e) => handleAmountChange(2, parseFloat(e.target.value) || 0)}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>3. platba - po montáži</span>
            <span className={`w-12 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{data.platba3Percent.toFixed(0)}%</span>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="number"
                    value={(totals.cenaSDPH * data.platba3Percent / 100).toFixed(2)}
                    onChange={(e) => handleAmountChange(3, parseFloat(e.target.value) || 0)}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
