import React, { useRef, useState } from 'react';
import { KovanieData } from '../types';
import { NOTES_KOVANIE } from '../utils/legalTexts';
import { QuoteLayout } from './common/QuoteLayout';
import { QuoteSummary } from './common/QuoteSummary';
import { sortPinnedItems } from '../utils/itemSorting';
import { GenericItemsTable } from './common/GenericItemsTable';
import { calculateKovanieTotals } from '../utils/priceCalculations';
import { useResizableColumns } from '../hooks/useResizableColumns';

interface KovanieFormProps {
    data: KovanieData;
    onChange: (data: KovanieData) => void;
    isDark: boolean;
    headerInfo: {
        customer?: any;
        architect?: any;
        billing?: any;
        vypracoval?: string;
        firma?: string;
        ulica?: string;
        mesto?: string;
        psc?: string;
        telefon?: string;
        email?: string;
        activeSource?: string;
    };
    onRefreshBilling?: () => void;
    usingSnapshot?: boolean;
}

const DEFAULT_PLATBA1 = 60;
const DEFAULT_PLATBA2 = 30;
const DEFAULT_PLATBA3 = 10;

const DEFAULT_WIDTHS = {
    nazov: 40,
    rozmer: 10,
    material: 10,
    poznamka: 10,
    ks: 5,
    cenaKs: 8,
    cenaCelkom: 10
};

export const KovanieForm: React.FC<KovanieFormProps> = ({ data, onChange, isDark, headerInfo, onRefreshBilling, usingSnapshot }) => {
    const totals = calculateKovanieTotals(data);
    const tableRef = useRef<HTMLTableElement>(null);

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
            setColumnWidths(prev => {
                const currentWidth = prev[columnKey] || (DEFAULT_WIDTHS as any)[columnKey] || 0;
                const targetCol = 'nazov';
                const targetWidth = prev[targetCol] || (DEFAULT_WIDTHS as any)[targetCol] || 40;

                const newWidths = {
                    ...prev,
                    [targetCol]: targetWidth + currentWidth
                };
                onChange({ ...data, hiddenColumns: [...currentHidden, columnKey], columnWidths: newWidths });
                return newWidths;
            });
        } else {
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
            onChange({ ...data, hiddenColumns: remainingHidden, columnWidths: newWidths });
        }
    };

    const onChangeWithPaymentReset = (newData: KovanieData) => {
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

    const onChangeWithPaymentRecalc = (newData: KovanieData) => {
        onChange({
            ...newData,
            manualCenaSDPH: undefined,
            platba1Amount: null,
            platba2Amount: null,
            platba3Amount: null,
            deposits: newData.deposits ? newData.deposits.map(d => ({ ...d, amount: null })) : undefined
        });
    };

    const commonColumns = [
        { key: 'nazov' as const, label: 'názov', width: 'min-w-[280px]' },
        {
            key: 'ks' as const,
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
            key: 'cenaKs' as const,
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
            key: 'cenaCelkom' as const,
            label: 'cena celkom',
            width: 'w-24 min-w-[100px]',
            align: 'right' as const,
            render: (item: any) => <span>{(item.ks * item.cenaKs).toFixed(2)} €</span>
        }
    ];

    return (
        <QuoteLayout
            isDark={isDark}
            headerInfo={headerInfo}
            data={data}
            onChange={onChange}
            totals={totals}
            defaultLegalText={NOTES_KOVANIE}
            onRefreshBilling={onRefreshBilling}
            usingSnapshot={usingSnapshot}
        >
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

            <div className={`rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} overflow-hidden`}>
                <div className={`px-4 py-2 ${isDark ? 'bg-dark-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'} `}>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'} `}>Kovanie (Výrobky):</h3>
                </div>
                <div className="overflow-x-auto">
                    <table ref={tableRef} className="text-xs quote-table table-fixed bg-white isolate w-full">
                        <colgroup>
                            <col style={{ width: '32px' }} />
                            {isColumnVisible('nazov') && <col style={{ width: `${columnWidths.nazov || 40}%` }} />}
                            {isColumnVisible('rozmer') && <col style={{ width: `${columnWidths.rozmer || 10}%` }} />}
                            {isColumnVisible('material') && <col style={{ width: `${columnWidths.material || 10}%` }} />}
                            {isColumnVisible('poznamka') && <col style={{ width: `${columnWidths.poznamka || 10}%` }} />}
                            <col style={{ width: '40px' }} />
                            <col style={{ width: '75px' }} />
                            <col style={{ width: '100px' }} />
                            <col style={{ width: '50px' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                                <th className="px-2 py-2 text-center border-r border-white/20 w-8 relative group">
                                    {hiddenColumns.length > 0 && (
                                        <button
                                            onClick={() => setShowHiddenColumnsMenu(!showHiddenColumnsMenu)}
                                            className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-xs font-bold mx-auto"
                                        >+</button>
                                    )}
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
                                                        {col}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </th>
                                {isColumnVisible('nazov') && <th className="relative px-2 py-2 text-left border-r border-white/20 select-none">názov<div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50" onMouseDown={(e) => startResizing('nazov', e)} /></th>}
                                {isColumnVisible('rozmer') && <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group"><span>rozmer</span><div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50 z-10" onMouseDown={(e) => startResizing('rozmer', e)} /></th>}
                                {isColumnVisible('material') && <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group"><span>materiál</span><div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50 z-10" onMouseDown={(e) => startResizing('material', e)} /></th>}
                                {isColumnVisible('poznamka') && <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group"><span>poznámka</span><div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50 z-10" onMouseDown={(e) => startResizing('poznamka', e)} /></th>}
                                <th className="px-2 py-2 text-right border-r border-white/20 w-10">ks</th>
                                <th className="px-2 py-2 text-right border-r border-white/20 w-14">cena / ks</th>
                                <th className="px-2 py-2 text-right w-24">cena celkom</th>
                                <th className="px-2 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.vyrobky.map((item, index) => (
                                <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')} `}>
                                    <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>{index + 1}</td>
                                    {isColumnVisible('nazov') && (
                                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                                            <input type="text" value={item.nazov} onChange={(e) => {
                                                const newVyrobky = [...data.vyrobky];
                                                newVyrobky[index].nazov = e.target.value;
                                                onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                            }} className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`} />
                                        </td>
                                    )}
                                    {isColumnVisible('rozmer') && (
                                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                                            <input type="text" value={item.rozmer} onChange={(e) => {
                                                const newVyrobky = [...data.vyrobky];
                                                newVyrobky[index].rozmer = e.target.value;
                                                onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                            }} className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`} />
                                        </td>
                                    )}
                                    {isColumnVisible('material') && (
                                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                                            <input type="text" value={item.material} onChange={(e) => {
                                                const newVyrobky = [...data.vyrobky];
                                                newVyrobky[index].material = e.target.value;
                                                onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                            }} className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`} />
                                        </td>
                                    )}
                                    {isColumnVisible('poznamka') && (
                                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                                            <input type="text" value={item.poznamka} onChange={(e) => {
                                                const newVyrobky = [...data.vyrobky];
                                                newVyrobky[index].poznamka = e.target.value;
                                                onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                            }} className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`} />
                                        </td>
                                    )}
                                    <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                                        <input type="number" value={item.ks} onChange={(e) => {
                                            const newVyrobky = [...data.vyrobky];
                                            newVyrobky[index].ks = parseInt(e.target.value) || 0;
                                            newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                        }} className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`} />
                                    </td>
                                    <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} `}>
                                        <input type="number" value={item.cenaKs} onChange={(e) => {
                                            const newVyrobky = [...data.vyrobky];
                                            newVyrobky[index].cenaKs = parseFloat(e.target.value) || 0;
                                            newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                        }} className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`} />
                                        <span> €</span>
                                    </td>
                                    <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'} `}>{(item.ks * item.cenaKs).toFixed(2)} €</td>
                                    <td className="px-1 py-1 text-center align-middle flex items-center gap-0.5">
                                        <button onClick={() => {
                                            const newVyrobok = { ...item, id: Date.now() + Math.random() };
                                            const newVyrobky = [...data.vyrobky];
                                            newVyrobky.splice(index + 1, 0, newVyrobok);
                                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                        }} className="p-1"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                                        <button onClick={() => {
                                            const newVyrobky = data.vyrobky.filter((_, i) => i !== index);
                                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                                        }} className="text-red-500 p-1"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
                                <td colSpan={3 + visibleColumns.length} className="px-2 py-2 text-right font-semibold">Spolu bez DPH:</td>
                                <td className="px-2 py-2 text-right font-bold">{totals.vyrobkyTotal.toFixed(2)} €</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div className={`flex justify-center p-2 ${isDark ? 'bg-dark-700' : 'bg-gray-200'} `}>
                    <button onClick={() => {
                        const newVyrobok = { id: Date.now(), nazov: '', rozmer: '', material: '', poznamka: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
                        onChangeWithPaymentReset({ ...data, vyrobky: [...data.vyrobky, newVyrobok] });
                    }} className="p-1 rounded-full bg-white shadow-sm text-gray-800"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
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
                footerContent={<tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}><td colSpan={3} className="px-2 py-2 text-right font-semibold">Spolu bez DPH:</td><td className="px-2 py-2 text-right font-bold">{totals.priplatkyTotal.toFixed(2)} €</td></tr>}
            />

            <GenericItemsTable
                title="Kovanie:"
                items={data.kovanie}
                columns={commonColumns}
                isDark={isDark}
                onChange={(items) => {
                    const sorted = sortPinnedItems(items, ['vynášanie – doceniť po obhliadke', 'vynášanie - doceniť po obhliadke']);
                    onChangeWithPaymentReset({ ...data, kovanie: sorted });
                }}
                onAddItem={() => {
                    const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
                    const newKovanie = sortPinnedItems([...data.kovanie, newItem], ['vynášanie – doceniť po obhliadke', 'vynášanie - doceniť po obhliadke']);
                    onChangeWithPaymentReset({ ...data, kovanie: newKovanie });
                }}
                mergeFirstTwoHeaders={true}
                footerContent={<tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}><td colSpan={3} className="px-2 py-2 text-right font-semibold">Spolu bez DPH:</td><td className="px-2 py-2 text-right font-bold">{totals.kovanieTotal.toFixed(2)} €</td></tr>}
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
                footerContent={<tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}><td colSpan={3} className="px-2 py-2 text-right font-semibold">Spolu bez DPH:</td><td className="px-2 py-2 text-right font-bold">{totals.montazTotal.toFixed(2)} €</td></tr>}
            />
        </QuoteLayout>
    );
};
