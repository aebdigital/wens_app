import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Deposit } from '../../types';

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
  defaultLegalText?: string;
}

export const QuoteFooter: React.FC<QuoteFooterProps> = ({ isDark, data, onChange, headerInfo, totals, defaultLegalText }) => {
  // Local state for euro amount inputs to prevent cursor jumping
  const [localAmounts, setLocalAmounts] = useState<Record<string, string>>({});
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);

  // Local state for total price input to prevent cursor jumping
  const [localTotal, setLocalTotal] = useState<string>('');
  const [editingTotal, setEditingTotal] = useState<boolean>(false);

  // Local state for cena dohodou
  const [localCenaDohodou, setLocalCenaDohodou] = useState<string>('');
  const [editingCenaDohodou, setEditingCenaDohodou] = useState<boolean>(false);

  // Get deposits - use dynamic deposits if set (even if empty), otherwise use legacy fixed deposits
  const getDeposits = (): Deposit[] => {
    // If deposits array exists (even if empty), use it - this allows having no deposits
    if (data.deposits !== undefined) {
      return data.deposits;
    }
    // Convert legacy fixed deposits to dynamic format only if deposits was never set
    return [
      { id: '1', label: '1. záloha - pri objednávke', percent: data.platba1Percent || 60, amount: data.platba1Amount },
      { id: '2', label: '2. platba - pred montážou', percent: data.platba2Percent || 30, amount: data.platba2Amount },
      { id: '3', label: '3. platba - po montáži', percent: data.platba3Percent || 10, amount: data.platba3Amount },
    ];
  };

  const deposits = getDeposits();

  // Calculate displayed amount for a deposit
  const getDisplayAmount = (deposit: Deposit, index: number): number => {
    let total = totals.cenaSDPH;

    // Check priorities for base amount
    if (data.cenaDohodou && data.cenaDohodouValue) {
      total = data.cenaDohodouValue;
    } else if (data.prenesenieDP) {
      total = totals.cenaBezDPH;
    }

    if (deposit.amount != null) {
      return deposit.amount;
    }

    // Calculate from percentage
    return total * (deposit.percent / 100);
  };

  // Handle deposit change
  const handleDepositChange = (depositId: string, field: 'label' | 'percent' | 'amount', value: any) => {
    const newDeposits = deposits.map(d => {
      if (d.id === depositId) {
        if (field === 'amount') {
          return { ...d, amount: value };
        } else if (field === 'percent') {
          return { ...d, percent: value, amount: null }; // Clear amount when percent changes
        } else {
          return { ...d, [field]: value };
        }
      }
      return d;
    });

    onChange({ ...data, deposits: newDeposits });
  };

  // Add new deposit
  const handleAddDeposit = () => {
    const newDeposit: Deposit = {
      id: Date.now().toString(),
      label: `${deposits.length + 1}. platba`,
      percent: 0,
      amount: null
    };
    onChange({ ...data, deposits: [...deposits, newDeposit] });
  };

  // Remove deposit
  const handleRemoveDeposit = (depositId: string) => {
    const newDeposits = deposits.filter(d => d.id !== depositId);
    onChange({ ...data, deposits: newDeposits });
  };

  const handleTotalChange = (newTotal: number) => {
    onChange({
      ...data,
      manualCenaSDPH: newTotal,
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
            onChange={(e) => onChange({ ...data, platnostPonuky: e.target.value })}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Miesto dodávky:</span>
            <input
              type="text"
              value={data.miestoDodavky}
              onChange={(e) => onChange({ ...data, miestoDodavky: e.target.value })}
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
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Poznámka k adrese:</span>
          <textarea
            value={data.poznamkaKAdrese || ''}
            onChange={(e) => onChange({ ...data, poznamkaKAdrese: e.target.value })}
            rows={1}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border resize-y min-h-[2.5rem]`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Zameranie:</span>
          <input
            type="text"
            value={data.zameranie}
            onChange={(e) => onChange({ ...data, zameranie: e.target.value })}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Termín dodania:</span>
          <textarea
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
              }
            }}
            value={data.terminDodania}
            onChange={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              onChange({ ...data, terminDodania: e.target.value });
            }}
            rows={1}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border resize-none overflow-hidden min-h-[2.5rem]`}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Vypracoval:</span>
          <input
            type="text"
            value={data.vypracoval !== undefined ? data.vypracoval : headerInfo.vypracoval}
            onChange={(e) => onChange({ ...data, vypracoval: e.target.value })}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Kontakt:</span>
          <input
            type="text"
            value={data.kontakt !== undefined ? data.kontakt : headerInfo.telefon}
            onChange={(e) => onChange({ ...data, kontakt: e.target.value })}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>E-mail:</span>
          <input
            type="text"
            value={data.emailVypracoval !== undefined ? data.emailVypracoval : headerInfo.email}
            onChange={(e) => onChange({ ...data, emailVypracoval: e.target.value })}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
        <div className="flex gap-2">
          <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Dátum:</span>
          <input
            type="text"
            value={data.datum !== undefined ? data.datum : new Date().toLocaleDateString('sk-SK')}
            onChange={(e) => onChange({ ...data, datum: e.target.value })}
            className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
      </div>

      {/* Right side - totals and payment */}
      <div className="space-y-2">
        {/* Cena bez DPH */}
        <div className={`flex justify-between items-center text-lg p-2 rounded font-semibold ${(data.prenesenieDP && !data.cenaDohodou)
          ? (isDark ? 'bg-red-900/30' : 'bg-red-100')
          : (isDark ? 'bg-dark-600' : 'bg-gray-100')
          }`}>
          <span className={isDark ? 'text-white' : 'text-gray-800'}>Cena bez DPH:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {totals.cenaBezDPH.toFixed(2)} €
          </span>
        </div>

        {/* Prenesenie daňovej povinnosti checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="prenesenieDP"
            checked={data.prenesenieDP || false}
            onChange={(e) => {
              const isChecked = e.target.checked;
              let newData = { ...data, prenesenieDP: isChecked };

              // Mutual exclusion: if checking Prenesenie, uncheck Cena dohodou
              if (isChecked) {
                newData.cenaDohodou = false;
              }

              // Reset deposit amounts to force recalculation based on new effective price
              if (newData.deposits) {
                newData.deposits = newData.deposits.map((d: any) => ({ ...d, amount: null }));
              }
              // Also clear legacy fields
              newData.platba1Amount = null;
              newData.platba2Amount = null;
              newData.platba3Amount = null;

              onChange(newData);
            }}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="prenesenieDP" className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
            Prenesenie daňovej povinnosti
          </label>
        </div>

        {/* DPH row - Always visible now */}
        <div className={`flex justify-between items-center text-lg p-2 rounded font-semibold ${isDark ? 'bg-dark-600 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
          <span>DPH 23%:</span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totals.dph.toFixed(2)} €</span>
        </div>

        {/* Cena s DPH - Styles swap based on prenesenieDP */}
        <div className={!data.prenesenieDP
          ? `flex justify-between items-center text-lg p-2 rounded ${(!data.prenesenieDP && !data.cenaDohodou)
            ? (isDark ? 'bg-red-900/30' : 'bg-red-100')
            : (isDark ? 'bg-dark-600' : 'bg-gray-100')
          } ${data.cenaDohodou ? 'opacity-50' : ''}`
          : "flex justify-between text-sm"
        }>
          <span className={!data.prenesenieDP ? `font-bold ${isDark ? 'text-white' : 'text-gray-800'}` : (isDark ? 'text-gray-300' : 'text-gray-800')}>Cena s DPH:</span>

          {/* If Highlighted (!prenesenieDP), show Editable Input. If Normal, show Text */}
          {!data.prenesenieDP ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="decimal"
                value={editingTotal ? localTotal : totals.cenaSDPH.toFixed(2)}
                disabled={data.cenaDohodou}
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
                className={`w-32 px-1 py-0.5 text-right font-bold rounded bg-transparent border-b ${isDark ? 'text-white border-gray-400 focus:border-white' : 'text-gray-800 border-gray-400 focus:border-black'} focus:outline-none ${data.cenaDohodou ? 'cursor-not-allowed' : ''}`}
              />
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          ) : (
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.cenaSDPH.toFixed(2)} €
            </span>
          )}
        </div>

        {/* Cena dohodou checkbox and input */}
        <div className={`flex items-center gap-2 mt-2 ${data.prenesenieDP ? 'opacity-50' : ''}`}>
          <input
            type="checkbox"
            id="cenaDohodou"
            checked={data.cenaDohodou || false}
            onChange={(e) => {
              const isChecked = e.target.checked;
              let newData = {
                ...data,
                cenaDohodou: isChecked,
                cenaDohodouValue: isChecked ? (data.cenaDohodouValue || totals.cenaSDPH) : null
              };

              // Mutual exclusion: if checking Cena dohodou, uncheck Prenesenie DP
              if (isChecked) {
                newData.prenesenieDP = false;
              }

              // Reset deposit amounts to force recalculation based on new effective price
              if (newData.deposits) {
                newData.deposits = newData.deposits.map((d: any) => ({ ...d, amount: null }));
              }
              // Also clear legacy fields
              newData.platba1Amount = null;
              newData.platba2Amount = null;
              newData.platba3Amount = null;

              onChange(newData);
            }}
            className={`w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500`}
          />
          <label htmlFor="cenaDohodou" className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Cena dohodou
          </label>
        </div>

        {data.cenaDohodou && (
          <div className={`flex justify-between items-center text-lg p-2 rounded ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Cena dohodou:</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="decimal"
                value={editingCenaDohodou ? localCenaDohodou : (data.cenaDohodouValue || 0).toFixed(2)}
                onFocus={() => {
                  setEditingCenaDohodou(true);
                  setLocalCenaDohodou((data.cenaDohodouValue || 0).toFixed(2));
                }}
                onChange={(e) => setLocalCenaDohodou(e.target.value)}
                onBlur={() => {
                  const parsed = parseFloat(localCenaDohodou.replace(',', '.')) || 0;

                  let newData = { ...data, cenaDohodouValue: parsed };

                  // Reset deposit amounts on value change too
                  if (newData.deposits) {
                    newData.deposits = newData.deposits.map((d: any) => ({ ...d, amount: null }));
                  }
                  newData.platba1Amount = null;
                  newData.platba2Amount = null;
                  newData.platba3Amount = null;

                  onChange(newData);
                  setEditingCenaDohodou(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseFloat(localCenaDohodou.replace(',', '.')) || 0;

                    let newData = { ...data, cenaDohodouValue: parsed };

                    // Reset deposit amounts on value change too
                    if (newData.deposits) {
                      newData.deposits = newData.deposits.map((d: any) => ({ ...d, amount: null }));
                    }
                    newData.platba1Amount = null;
                    newData.platba2Amount = null;
                    newData.platba3Amount = null;

                    onChange(newData);
                    setEditingCenaDohodou(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className={`w-32 px-1 py-0.5 text-right font-bold rounded bg-transparent border-b ${isDark ? 'text-white border-gray-400 focus:border-white' : 'text-gray-800 border-gray-400 focus:border-black'} focus:outline-none`}
              />
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
            </div>
          </div>
        )}

        {/* Dynamic Deposits */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>Platby:</p>
            <button
              onClick={handleAddDeposit}
              className={`p-1 rounded ${isDark ? 'bg-dark-600 hover:bg-dark-500 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              title="Pridať platbu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {deposits.map((deposit, index) => (
            <div key={deposit.id} className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={deposit.label}
                onChange={(e) => handleDepositChange(deposit.id, 'label', e.target.value)}
                className={`flex-1 min-w-0 px-1 py-0.5 text-xs rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  inputMode="decimal"
                  value={deposit.percent.toFixed(0)}
                  onChange={(e) => handleDepositChange(deposit.id, 'percent', parseFloat(e.target.value.replace(',', '.')) || 0)}
                  className={`w-10 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border focus:outline-none`}
                />
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>%</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  inputMode="decimal"
                  value={editingAmountId === deposit.id ? (localAmounts[deposit.id] || '') : getDisplayAmount(deposit, index).toFixed(2)}
                  onFocus={() => {
                    setEditingAmountId(deposit.id);
                    setLocalAmounts({ ...localAmounts, [deposit.id]: getDisplayAmount(deposit, index).toFixed(2) });
                  }}
                  onChange={(e) => setLocalAmounts({ ...localAmounts, [deposit.id]: e.target.value })}
                  onBlur={() => {
                    const parsed = parseFloat((localAmounts[deposit.id] || '0').replace(',', '.')) || 0;
                    handleDepositChange(deposit.id, 'amount', parsed);
                    setEditingAmountId(null);
                  }}
                  className={`w-20 px-1 py-0.5 text-right rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border focus:outline-none`}
                />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>€</span>
              </div>
              <button
                onClick={() => handleRemoveDeposit(deposit.id)}
                className="p-1 text-red-500 hover:text-red-700 shrink-0"
                title="Odstrániť platbu"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Text Section - Editable */}
      <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
          Text na spodok PDF (editovateľný):
        </label>
        <textarea
          value={data.legalText ?? defaultLegalText ?? "Rozdielna kresba prírodnej dyhy na jednotlivých dverách a zárubniach ani medzi dodaným tovarom a pôvodným už namontovaným, nie je dôvodom na reklamáciu. Povrchové vady sa posudzujú pri bežnom osvetlení pozorované voľným okom z kolmej vzdialenosti 150cm od kontrolovanej plochy. Rovinnosť dverí je v tolerancii +2mm -2mm na 2m dĺžky. Cena diela sa môže meniť vzhľadom k okolnostiam vyplývajúcich z plnenia diela, musí však byť odsúhlasená písomne obidvomi stranami. Tovar až do úplného zaplatenia zostáva majetkom dodávateľa. Zákazník svojim podpisom alebo uhradením zálohy potvrdzuje, že bol s týmito skutočnosťami oboznámený a súhlasí s nimi. Záruka na výrobky je 24 mesiacov. Ako variabilný symbol uvádzajte číslo cenovej ponuky."}
          onChange={(e) => onChange({ ...data, legalText: e.target.value })}
          rows={8}
          className={`w-full px-2 py-1 text-xs rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border resize-y`}
        />
      </div>
    </div>
  );
};
