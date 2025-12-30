import React from 'react';
import { SchodyData } from '../types';
import { QuoteLayout } from './common/QuoteLayout';
import { QuoteSummary } from './common/QuoteSummary';
import { GenericItemsTable } from './common/GenericItemsTable';
import { calculateSchodyTotals } from '../utils/priceCalculations';

interface SchodyFormProps {
  data: SchodyData;
  onChange: (data: SchodyData) => void;
  isDark: boolean;
  headerInfo: {
    customer?: {
      firma: string;
      ulica: string;
      mesto: string;
      psc: string;
      telefon: string;
      email: string;
      meno: string;
      priezvisko: string;
    };
    architect?: {
      priezvisko: string;
      meno: string;
      firma: string;
      ulica: string;
      mesto: string;
      psc: string;
      telefon: string;
      email: string;
    };
    vypracoval?: string;
    // Legacy / Flat support
    firma?: string;
    ulica?: string;
    mesto?: string;
    psc?: string;
    telefon?: string;
    email?: string;
  };
}

// Default payment percentages
const DEFAULT_PLATBA1 = 60;
const DEFAULT_PLATBA2 = 30;
const DEFAULT_PLATBA3 = 10;

export const SchodyForm: React.FC<SchodyFormProps> = ({ data, onChange, isDark, headerInfo }) => {
  const totals = calculateSchodyTotals(data);

  // Helper to reset payment overrides when items change
  const onChangeWithPaymentReset = (newData: SchodyData) => {
    onChange({
      ...newData,
      manualCenaSDPH: undefined,
      platba1Percent: DEFAULT_PLATBA1,
      platba2Percent: DEFAULT_PLATBA2,
      platba3Percent: DEFAULT_PLATBA3,
      platba1Amount: null,
      platba2Amount: null,
      platba3Amount: null
    });
  };

  // Helper to create columns with auto-calc logic
  const createColumns = () => [
    { key: 'nazov' as keyof typeof data.priplatky[0], label: 'názov', width: 'min-w-[200px]' },
    {
      key: 'ks' as keyof typeof data.priplatky[0],
      label: 'ks',
      width: 'w-24',
      align: 'center' as const,
      render: (item: any, _idx: number, update: (i: any) => void) => (
        <input
          type="number"
          value={item.ks}
          onChange={(e) => {
            const ks = parseInt(e.target.value) || 0;
            update({ ...item, ks, cenaCelkom: ks * item.cenaKs });
          }}
          className={`w-full px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
        />
      )
    },
    {
      key: 'cenaKs' as keyof typeof data.priplatky[0],
      label: 'cena / ks',
      width: 'w-32',
      align: 'right' as const,
      render: (item: any, _idx: number, update: (i: any) => void) => (
         <div className="flex items-center justify-end">
            <input
              type="number"
              value={item.cenaKs}
              onChange={(e) => {
                const cenaKs = parseFloat(e.target.value) || 0;
                update({ ...item, cenaKs, cenaCelkom: item.ks * cenaKs });
              }}
              className={`w-20 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
            />
            <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
         </div>
      )
    },
    {
      key: 'cenaCelkom' as keyof typeof data.priplatky[0],
      label: 'cena celkom',
      width: 'w-32',
      align: 'right' as const,
      render: (item: any) => <span>{item.cenaCelkom.toFixed(2)} €</span>
    }
  ];

  const commonColumns = createColumns();

  return (
    <QuoteLayout
        isDark={isDark}
        headerInfo={headerInfo}
        data={data}
        onChange={onChange}
        totals={totals}
    >
      {/* Product description */}
      <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} flex items-center gap-4`}>
        <h3 className={`text-sm font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-700'}`}>Popis zakázky:</h3>
        <input
          type="text"
          value={data.popisVyrobkov}
          onChange={(e) => onChange({...data, popisVyrobkov: e.target.value})}
          placeholder="Popis zakázky"
          className={`flex-1 px-3 py-1.5 text-sm font-normal rounded border ${isDark ? 'bg-dark-800 text-white border-gray-500' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-[#e11b28]`}
        />
      </div>

      {/* Výrobky section */}
      <div className={`rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} overflow-hidden`}>
        <div className={`px-4 py-2 ${isDark ? 'bg-dark-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>Výrobky:</h3>
        </div>
        <div className="overflow-x-auto mr-0 md:mr-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-left border-r border-white/20 w-8"></th>
                <th className="px-2 py-2 text-left border-r border-white/20 min-w-[150px]">názov</th>
                <th className="px-2 py-2 text-left border-r border-white/20 min-w-[120px]">rozmer</th>
                <th className="px-2 py-2 text-left border-r border-white/20 min-w-[120px]">materiál</th>
                <th className="px-2 py-2 text-left border-r border-white/20 min-w-[150px]">poznámka</th>
                <th className="px-2 py-2 text-center border-r border-white/20 w-16 min-w-[60px]">ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20 w-24 min-w-[80px]">cena / ks</th>
                <th className="px-2 py-2 text-right w-24 min-w-[90px]">cena celkom</th>
              </tr>
            </thead>
            <tbody>
              {data.vyrobky.map((item, index) => (
                <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')}`}>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>{index + 1}</td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.nazov}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].nazov = e.target.value;
                        onChangeWithPaymentReset({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.rozmer}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].rozmer = e.target.value;
                        onChangeWithPaymentReset({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.material}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].material = e.target.value;
                        onChangeWithPaymentReset({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.poznamka}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].poznamka = e.target.value;
                        onChangeWithPaymentReset({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.ks}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].ks = parseInt(e.target.value) || 0;
                        newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                        onChangeWithPaymentReset({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.cenaKs}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].cenaKs = parseFloat(e.target.value) || 0;
                        newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                        onChangeWithPaymentReset({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
                  </td>
                  <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {item.cenaCelkom.toFixed(2)} €
                  </td>
                  <td className="w-0 p-0 border-none relative">
                    <button
                      onClick={() => {
                        const newVyrobky = data.vyrobky.filter((_, i) => i !== index);
                        onChangeWithPaymentReset({...data, vyrobky: newVyrobky});
                      }}
                      className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm z-10`}
                      title="Odstrániť riadok"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
                <td colSpan={7} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {totals.vyrobkyTotal.toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => {
              const newVyrobok = {
                id: Date.now(),
                nazov: '',
                rozmer: '',
                material: '',
                poznamka: '',
                ks: 0,
                cenaKs: 0,
                cenaCelkom: 0,
              };
              onChangeWithPaymentReset({...data, vyrobky: [...data.vyrobky, newVyrobok]});
            }}
            className={`p-1 rounded-full ${isDark ? 'bg-dark-800 hover:bg-dark-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať riadok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <GenericItemsTable
        title="Príplatky:"
        items={data.priplatky}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => onChangeWithPaymentReset({...data, priplatky: items})}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChangeWithPaymentReset({...data, priplatky: [...data.priplatky, newItem]});
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.priplatkyTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />

      <QuoteSummary
          isDark={isDark}
          totals={totals}
          zlavaPercent={data.zlavaPercent}
          onZlavaChange={(val) => onChange({...data, zlavaPercent: val})}
      />

      <GenericItemsTable
        title="Kovanie:"
        items={data.kovanie}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => onChangeWithPaymentReset({...data, kovanie: items})}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChangeWithPaymentReset({...data, kovanie: [...data.kovanie, newItem]});
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.kovanieTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />

      <GenericItemsTable
        title="Montáž:"
        items={data.montaz}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => onChangeWithPaymentReset({...data, montaz: items})}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChangeWithPaymentReset({...data, montaz: [...data.montaz, newItem]});
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.montazTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />
    </QuoteLayout>
  );
};
