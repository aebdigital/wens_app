import React, { useRef, useState } from 'react';
import { SchodyData } from '../types';
import { NOTES_SCHODY } from '../utils/legalTexts';
import { QuoteLayout } from './common/QuoteLayout';
import { QuoteSummary } from './common/QuoteSummary';
import { sortPinnedItems } from '../utils/itemSorting';
import { GenericItemsTable } from './common/GenericItemsTable';
import { calculateSchodyTotals } from '../utils/priceCalculations';
import { useResizableColumns } from '../hooks/useResizableColumns';

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
    billing?: {
      priezvisko: string;
      meno: string;
      adresa: string;
      ico: string;
      dic: string;
      icDph: string;
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

const DEFAULT_WIDTHS = {
  nazov: 20,
  rozmer: 15,
  material: 15,
  poznamka: 20,
  ks: 5,
  cenaKs: 8,
  cenaCelkom: 10
};

export const SchodyForm: React.FC<SchodyFormProps> = ({ data, onChange, isDark, headerInfo }) => {
  const totals = calculateSchodyTotals(data);
  const tableRef = useRef<HTMLTableElement>(null);

  // Hidden columns logic
  const hiddenColumns = data.hiddenColumns || [];
  const isColumnVisible = (key: string) => !hiddenColumns.includes(key);

  const visibleColumns = [
    'nazov',
    'rozmer',
    'material',
    'poznamka'
  ].filter(isColumnVisible);

  const { columnWidths, startResizing, setColumnWidths } = useResizableColumns({
    defaultWidths: DEFAULT_WIDTHS,
    visibleColumns,
    tableRef,
    savedWidths: data.columnWidths,
    onWidthsChange: (widths) => onChange({ ...data, columnWidths: widths })
  });

  const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState(false);

  const toggleColumnVisibility = (columnKey: string) => {
    const currentHidden = data.hiddenColumns || [];
    const isNowHidden = !currentHidden.includes(columnKey);

    if (isNowHidden) {
      // HIDING LOGIC: Transfer width to elastic column (nazov)
      setColumnWidths(prev => {
        const currentWidth = prev[columnKey] || (DEFAULT_WIDTHS as any)[columnKey] || 0;
        const targetCol = 'nazov';
        const targetWidth = prev[targetCol] || (DEFAULT_WIDTHS as any)[targetCol] || 20;

        const newWidths = {
          ...prev,
          [targetCol]: targetWidth + currentWidth
        };

        // SYNC TO DATA
        onChange({ ...data, hiddenColumns: [...currentHidden, columnKey], columnWidths: newWidths });

        return newWidths;
      });
    } else {
      // SHOWING LOGIC: RESET TO DEFAULTS + REDISTRIBUTE HIDDEN
      const defaultState: any = DEFAULT_WIDTHS;
      const remainingHidden = currentHidden.filter(c => c !== columnKey);
      let extraWidthForTarget = 0;
      remainingHidden.forEach(hiddenKey => {
        extraWidthForTarget += (defaultState[hiddenKey] || 0);
      });

      const newWidths = {
        ...defaultState,
        nazov: defaultState.nazov + extraWidthForTarget
      };

      setColumnWidths(newWidths);

      // SYNC TO DATA
      onChange({ ...data, hiddenColumns: currentHidden.filter(c => c !== columnKey), columnWidths: newWidths });
    }
  };

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
      platba3Amount: null,
      deposits: newData.deposits ? newData.deposits.map(d => ({ ...d, amount: null })) : undefined
    });
  };

  // Helper to reset only payment amounts (forcing recalculation from %) when totals change (e.g. discount)
  const onChangeWithPaymentRecalc = (newData: SchodyData) => {
    onChange({
      ...newData,
      manualCenaSDPH: undefined,
      platba1Amount: null,
      platba2Amount: null,
      platba3Amount: null,
      deposits: newData.deposits ? newData.deposits.map(d => ({ ...d, amount: null })) : undefined
    });
  };

  // Helper to create columns with auto-calc logic
  const createColumns = () => [
    { key: 'nazov' as keyof typeof data.priplatky[0], label: 'názov', width: 'min-w-[280px]' },
    {
      key: 'ks' as keyof typeof data.priplatky[0],
      label: 'ks',
      width: 'w-10',
      align: 'right' as const,
      render: (item: any, _idx: number, update: (i: any) => void) => (
        <input
          type="number"
          value={item.ks}
          onChange={(e) => {
            const ks = parseInt(e.target.value) || 0;
            update({ ...item, ks, cenaCelkom: ks * item.cenaKs });
          }}
          className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
        />
      )
    },
    {
      key: 'cenaKs' as keyof typeof data.priplatky[0],
      label: 'cena / ks',
      width: 'w-14',
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
            className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
          />
          <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
        </div>
      )
    },
    {
      key: 'cenaCelkom' as keyof typeof data.priplatky[0],
      label: 'cena celkom',
      width: 'w-24 min-w-[100px]',
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
      defaultLegalText={NOTES_SCHODY}
    >
      {/* Product description */}
      <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'} `}>Popis zakázky:</h3>
        <div className="mt-1">
          <input
            type="text"
            value={data.popisVyrobkov}
            onChange={(e) => onChange({ ...data, popisVyrobkov: e.target.value })}
            placeholder="Popis zakázky"
            className={`w-full px-3 py-1.5 text-sm font-normal rounded border ${isDark ? 'bg-dark-800 text-white border-gray-500' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-[#e11b28]`}
          />
        </div>
      </div>

      {/* Výrobky section */}
      <div className={`rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} overflow-hidden`}>
        <div className={`px-4 py-2 ${isDark ? 'bg-dark-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'} `}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'} `}>Výrobky:</h3>
        </div>
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="text-xs quote-table table-fixed bg-white isolate w-full"
          >
            <colgroup>
              <col style={{ width: '32px' }} /> {/* Index column */}
              {isColumnVisible('nazov') && <col style={{ width: `${columnWidths.nazov || 20}%` }} />}
              {isColumnVisible('rozmer') && <col style={{ width: `${columnWidths.rozmer || 15}%` }} />}
              {isColumnVisible('material') && <col style={{ width: `${columnWidths.material || 15}%` }} />}
              {isColumnVisible('poznamka') && <col style={{ width: `${columnWidths.poznamka || 20}%` }} />}
              <col style={{ width: '40px' }} /> {/* ks */}
              <col style={{ width: '75px' }} /> {/* cena / ks */}
              <col style={{ width: '100px' }} /> {/* cena celkom */}
              <col style={{ width: '50px' }} /> {/* actions */}
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-center border-r border-white/20 w-8 relative group">
                  {hiddenColumns.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowHiddenColumnsMenu(!showHiddenColumnsMenu)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-xs font-bold mx-auto"
                        title="Zobraziť skryté stĺpce"
                      >
                        +
                      </button>
                      {showHiddenColumnsMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowHiddenColumnsMenu(false)} />
                          <div className={`absolute left-0 top-full mt-1 z-20 w-48 rounded shadow-lg border p-1 ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-white border-gray-200'} `}>
                            {hiddenColumns.map(col => (
                              <button
                                key={col}
                                onClick={() => {
                                  toggleColumnVisibility(col);
                                  if (hiddenColumns.length <= 1) setShowHiddenColumnsMenu(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 ${isDark ? 'text-gray-200 hover:bg-dark-700' : 'text-gray-700 hover:bg-gray-100'} `}
                              >
                                <span className="text-green-500">+</span>
                                {col.charAt(0).toUpperCase() + col.slice(1)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </th>
                {isColumnVisible('nazov') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none">
                    názov
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50" onMouseDown={(e) => startResizing('nazov', e)} />
                  </th>
                )}
                {isColumnVisible('rozmer') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>rozmer</span>
                      <button onClick={() => toggleColumnVisibility('rozmer')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50 z-10" onMouseDown={(e) => startResizing('rozmer', e)} />
                  </th>
                )}
                {isColumnVisible('material') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>materiál</span>
                      <button onClick={() => toggleColumnVisibility('material')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50 z-10" onMouseDown={(e) => startResizing('material', e)} />
                  </th>
                )}
                {isColumnVisible('poznamka') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>poznámka</span>
                      <button onClick={() => toggleColumnVisibility('poznamka')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50 z-10" onMouseDown={(e) => startResizing('poznamka', e)} />
                  </th>
                )}
                <th className="px-2 py-2 text-right border-r border-white/20 w-10">ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20 w-14">cena / ks</th>
                <th className="px-2 py-2 text-right w-24 min-w-[100px]">cena celkom</th>
                <th className="px-2 py-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {data.vyrobky.map((item, index) => (
                <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')} `}>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>{index + 1}</td>
                  {isColumnVisible('nazov') && (
                    <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                      <input
                        type="text"
                        value={item.nazov}
                        onChange={(e) => {
                          const newVyrobky = [...data.vyrobky];
                          newVyrobky[index].nazov = e.target.value;
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                      />
                    </td>
                  )}
                  {isColumnVisible('rozmer') && (
                    <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                      <input
                        type="text"
                        value={item.rozmer}
                        onChange={(e) => {
                          const newVyrobky = [...data.vyrobky];
                          newVyrobky[index].rozmer = e.target.value;
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                      />
                    </td>
                  )}
                  {isColumnVisible('material') && (
                    <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                      <input
                        type="text"
                        value={item.material}
                        onChange={(e) => {
                          const newVyrobky = [...data.vyrobky];
                          newVyrobky[index].material = e.target.value;
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                      />
                    </td>
                  )}
                  {isColumnVisible('poznamka') && (
                    <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                      <input
                        type="text"
                        value={item.poznamka}
                        onChange={(e) => {
                          const newVyrobky = [...data.vyrobky];
                          newVyrobky[index].poznamka = e.target.value;
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                      />
                    </td>
                  )}
                  <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                    <input
                      type="number"
                      value={item.ks}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].ks = parseInt(e.target.value) || 0;
                        newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                        onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                      }}
                      className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                    <input
                      type="number"
                      value={item.cenaKs}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].cenaKs = parseFloat(e.target.value) || 0;
                        newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                        onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                      }}
                      className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
                  </td>
                  <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'} `}>
                    {item.cenaCelkom.toFixed(2)} €
                  </td>
                  <td className="px-1 py-1 text-center align-middle">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          const newVyrobok = { ...item, id: Date.now() + Math.random() };
                          const newVyrobky = [...data.vyrobky];
                          newVyrobky.splice(index + 1, 0, newVyrobok);
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} p-1`}
                        title="Kopírovať riadok"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          const newVyrobky = data.vyrobky.filter((_, i) => i !== index);
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Odstrániť riadok"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
                <td colSpan={3 + visibleColumns.length} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'} `}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>
                  {totals.vyrobkyTotal.toFixed(2)} €
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-dark-700' : 'bg-gray-200'} `}>
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
              onChangeWithPaymentReset({ ...data, vyrobky: [...data.vyrobky, newVyrobok] });
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
        onChange={(items) => onChangeWithPaymentReset({ ...data, priplatky: items })}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChangeWithPaymentReset({ ...data, priplatky: [...data.priplatky, newItem] });
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'} `}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>
              {totals.priplatkyTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />

      <QuoteSummary
        isDark={isDark}
        totals={totals}
        zlavaPercent={data.zlavaPercent}
        zlavaEur={data.zlavaEur || 0}
        useZlavaPercent={data.useZlavaPercent !== false}
        useZlavaEur={data.useZlavaEur || false}
        onZlavaChange={(val) => onChangeWithPaymentRecalc({ ...data, zlavaPercent: val })}
        onZlavaEurChange={(val) => onChangeWithPaymentRecalc({ ...data, zlavaEur: val })}
        onUseZlavaPercentChange={(val) => onChangeWithPaymentRecalc({ ...data, useZlavaPercent: val })}
        onUseZlavaEurChange={(val) => onChangeWithPaymentRecalc({ ...data, useZlavaEur: val })}
      />

      <GenericItemsTable
        title="Kovanie:"
        items={data.kovanie}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => {
          const sorted = sortPinnedItems(items, ['kľučky - doplniť', 'kľučka - doplniť', 'kovanie - doplniť', 'klucky - doplnit', 'klucka - doplnit', 'kovanie - doplnit']);
          onChangeWithPaymentReset({ ...data, kovanie: sorted });
        }}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          const newKovanie = sortPinnedItems([...data.kovanie, newItem], ['kľučky - doplniť', 'kľučka - doplniť', 'kovanie - doplniť', 'klucky - doplnit', 'klucka - doplnit', 'kovanie - doplnit']);
          onChangeWithPaymentReset({ ...data, kovanie: newKovanie });
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'} `}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>
              {totals.kovanieTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />

      <GenericItemsTable
        title={data.montazLabel || "Montáž - Neumožnená kompletná montáž z dôvodu nepripravenosti stavby bude spoplatnená dopravou."}
        onTitleChange={(newTitle) => onChange({ ...data, montazLabel: newTitle })}
        items={data.montaz}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => {
          const sorted = sortPinnedItems(items, ['montáž kľučky', 'montáž kľučiek', 'montaz kluciek', 'montaz klucky', 'vynášanie – doceniť po obhliadke', 'vynášanie - doceniť po obhliadke']);
          onChangeWithPaymentReset({ ...data, montaz: sorted });
        }}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          const newMontaz = sortPinnedItems([...data.montaz, newItem], ['montáž kľučky', 'montáž kľučiek', 'montaz kluciek', 'montaz klucky', 'vynášanie – doceniť po obhliadke', 'vynášanie - doceniť po obhliadke']);
          onChangeWithPaymentReset({ ...data, montaz: newMontaz });
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'} `}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'} `}>
              {totals.montazTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />
    </QuoteLayout>
  );
};
