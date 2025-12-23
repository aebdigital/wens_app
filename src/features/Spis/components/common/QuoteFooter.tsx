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
  
  const handleAmountChange = (index: 1 | 2 | 3, newAmount: number) => {
    const total = totals.cenaSDPH;
    if (total === 0) return;

    let p1 = data.platba1Percent;
    let p2 = data.platba2Percent;
    let p3 = data.platba3Percent;

    const currentAmount1 = total * p1 / 100;
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

  const handleTotalChange = (newTotal: number) => {
    // If newTotal is 0 or empty, maybe revert to null (auto)?
    // For now, assume user wants to set a specific price.
    onChange({
        ...data,
        manualCenaSDPH: newTotal
    });
  };

  const handlePercentageChange = (index: 1 | 2 | 3, newPercent: number) => {
    let p1 = data.platba1Percent;
    let p2 = data.platba2Percent;
    let p3 = data.platba3Percent;

    if (index === 1) {
      p1 = newPercent;
      const remaining = 100 - p1;
      // Adjust p2 and p3 to fit remaining
      if (p2 + p3 === 0) {
         p2 = remaining; 
      } else {
         const ratio = p2 / (p2 + p3);
         p2 = remaining * ratio;
         p3 = remaining - p2;
      }
    } else if (index === 2) {
      p2 = newPercent;
      // Adjust p1 and p3. Usually keep p1 fixed if possible?
      // "Higher hierarchy": change only subsequent if possible?
      // Let's adjust p3 first.
      p3 = 100 - p1 - p2;
      if (p3 < 0) {
         // If negative, reduce p1
         p3 = 0;
         p1 = 100 - p2;
      }
    } else if (index === 3) {
      p3 = newPercent;
      p2 = 100 - p1 - p3;
      if (p2 < 0) {
         p2 = 0;
         p1 = 100 - p3;
      }
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
        <div className="flex flex-col gap-1">
            <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Miesto dodávky:</span>
            <input
                type="text"
                value={data.miestoDodavky}
                onChange={(e) => onChange({...data, miestoDodavky: e.target.value})}
                className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
            </div>
            {data.miestoDodavky && (
                <div className="flex justify-end pr-0 mt-2">
                    <div className="p-2 bg-white rounded shadow border border-gray-200">
                        <QRCodeSVG 
                            value={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.miestoDodavky)}`}
                            size={100}
                        />
                        <div className="text-[10px] text-center mt-1 text-gray-500">Google Maps</div>
                    </div>
                </div>
            )}
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
          <input
            type="text"
            value={data.vypracoval !== undefined ? data.vypracoval : headerInfo.vypracoval}
            onChange={(e) => onChange({...data, vypracoval: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kontakt:</span>
          <input
            type="text"
            value={data.kontakt !== undefined ? data.kontakt : headerInfo.telefon}
            onChange={(e) => onChange({...data, kontakt: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>E-mail:</span>
          <input
            type="text"
            value={data.emailVypracoval !== undefined ? data.emailVypracoval : headerInfo.email}
            onChange={(e) => onChange({...data, emailVypracoval: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dátum:</span>
          <input
            type="text"
            value={data.datum !== undefined ? data.datum : new Date().toLocaleDateString('sk-SK')}
            onChange={(e) => onChange({...data, datum: e.target.value})}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
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
        <div className={`flex justify-between items-center text-lg p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Cena s DPH:</span>
          <div className="flex items-center gap-1">
            <input
                type="number"
                value={totals.cenaSDPH.toFixed(2)}
                onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                className={`w-32 px-1 py-0.5 text-right font-bold rounded bg-transparent border-b ${isDark ? 'text-white border-gray-400 focus:border-white' : 'text-gray-800 border-gray-400 focus:border-black'} focus:outline-none`}
            />
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Platby:</p>
          
          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>1. záloha - pri objednávke</span>
            <div className="flex items-center gap-1 w-16 justify-end">
                <input
                    type="number"
                    value={data.platba1Percent.toFixed(0)}
                    onChange={(e) => handlePercentageChange(1, parseFloat(e.target.value) || 0)}
                    className={`w-10 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>%</span>
            </div>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="text"
                    inputMode="decimal"
                    value={editingAmount === 1 ? localAmount1 : (totals.cenaSDPH * data.platba1Percent / 100).toFixed(2)}
                    onFocus={() => {
                      setEditingAmount(1);
                      setLocalAmount1((totals.cenaSDPH * data.platba1Percent / 100).toFixed(2));
                    }}
                    onChange={(e) => setLocalAmount1(e.target.value)}
                    onBlur={() => {
                      handleAmountChange(1, parseFloat(localAmount1) || 0);
                      setEditingAmount(null);
                    }}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>2. platba - pred montážou</span>
            <div className="flex items-center gap-1 w-16 justify-end">
                <input
                    type="number"
                    value={data.platba2Percent.toFixed(0)}
                    onChange={(e) => handlePercentageChange(2, parseFloat(e.target.value) || 0)}
                    className={`w-10 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>%</span>
            </div>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="text"
                    inputMode="decimal"
                    value={editingAmount === 2 ? localAmount2 : (totals.cenaSDPH * data.platba2Percent / 100).toFixed(2)}
                    onFocus={() => {
                      setEditingAmount(2);
                      setLocalAmount2((totals.cenaSDPH * data.platba2Percent / 100).toFixed(2));
                    }}
                    onChange={(e) => setLocalAmount2(e.target.value)}
                    onBlur={() => {
                      handleAmountChange(2, parseFloat(localAmount2) || 0);
                      setEditingAmount(null);
                    }}
                    className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`w-1/3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>3. platba - po montáži</span>
            <div className="flex items-center gap-1 w-16 justify-end">
                <input
                    type="number"
                    value={data.platba3Percent.toFixed(0)}
                    onChange={(e) => handlePercentageChange(3, parseFloat(e.target.value) || 0)}
                    className={`w-10 px-1 py-0.5 text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>%</span>
            </div>
            <div className="flex items-center justify-end gap-1 w-32">
                <input
                    type="text"
                    inputMode="decimal"
                    value={editingAmount === 3 ? localAmount3 : (totals.cenaSDPH * data.platba3Percent / 100).toFixed(2)}
                    onFocus={() => {
                      setEditingAmount(3);
                      setLocalAmount3((totals.cenaSDPH * data.platba3Percent / 100).toFixed(2));
                    }}
                    onChange={(e) => setLocalAmount3(e.target.value)}
                    onBlur={() => {
                      handleAmountChange(3, parseFloat(localAmount3) || 0);
                      setEditingAmount(null);
                    }}
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
