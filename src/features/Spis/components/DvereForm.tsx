import React, { useState } from 'react';
import { DvereData } from '../types';
import { QuoteLayout } from './common/QuoteLayout';
import { QuoteSummary } from './common/QuoteSummary';
import { GenericItemsTable } from './common/GenericItemsTable';
import { calculateDvereTotals } from '../utils/priceCalculations';

interface DvereFormProps {
  data: DvereData;
  onChange: (data: DvereData) => void;
  isDark: boolean;
  headerInfo: {
    firma: string;
    ulica: string;
    mesto: string;
    psc: string;
    telefon: string;
    email: string;
    vypracoval: string;
  };
}

export const DvereForm: React.FC<DvereFormProps> = ({ data, onChange, isDark, headerInfo }) => {
  const totals = calculateDvereTotals(data);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Helper to create columns with auto-calc logic
  const createColumns = () => [
    { key: 'nazov' as keyof typeof data.priplatky[0], label: 'názov' },
    { 
      key: 'ks' as keyof typeof data.priplatky[0], 
      label: 'ks', 
      width: 'w-16', 
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
      width: 'w-24', 
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
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
         </div>
      )
    },
    { 
      key: 'cenaCelkom' as keyof typeof data.priplatky[0], 
      label: 'cena celkom', 
      width: 'w-24', 
      align: 'right' as const,
      render: (item: any) => <span>{item.cenaCelkom.toFixed(2)} €</span>
    }
  ];

  const commonColumns = createColumns();

  const handleAddSpecification = (type: 'dvere' | 'zarubna' | 'obklad') => {
    const newSpec = {
      id: Date.now(),
      type,
      value: ''
    };
    // Ensure specifications array exists
    const specs = data.specifications || [];
    onChange({ ...data, specifications: [...specs, newSpec] });
  };

  const handleRemoveSpecification = (index: number) => {
    const specs = [...(data.specifications || [])];
    specs.splice(index, 1);
    onChange({ ...data, specifications: specs });
  };

  const handleUpdateSpecification = (index: number, value: string) => {
    const specs = [...(data.specifications || [])];
    specs[index].value = value;
    onChange({ ...data, specifications: specs });
  };

  const handleAddProduct = (type: 'dvere' | 'zarubna' | 'obklad' | 'empty') => {
    const newVyrobok = {
      id: Date.now(),
      miestnost: 'Miestnosť',
      dvereTypRozmer: '',
      dvereOtvor: '',
      pL: 'P dnu',
      zamok: 'BB',
      sklo: '',
      povrch: '',
      povrchZarubna: '',
      povrchObklad: '',
      poznamkaDvere: '',
      poznamkaZarubna: '',
      poznamkaObklad: '',
      typObklad: '',
      ks: 0,
      ksZarubna: 0,
      ksObklad: 0,
      cenaDvere: 0,
      cenaZarubna: 0,
      cenaObklad: 0,
      hasDvere: type === 'dvere',
      hasZarubna: type === 'zarubna',
      hasObklad: type === 'obklad',
      // If empty, allow generic usage, but specific flags false initially
    };
    if (type === 'empty') {
        newVyrobok.hasDvere = false;
        newVyrobok.hasZarubna = false;
        newVyrobok.hasObklad = false;
    }
    onChange({...data, vyrobky: [...data.vyrobky, newVyrobok]});
    setShowAddMenu(false);
  };

  // Toggle parts of an existing item
  const toggleItemPart = (index: number, part: 'hasDvere' | 'hasZarubna' | 'hasObklad') => {
    const newVyrobky = [...data.vyrobky];
    newVyrobky[index][part] = !newVyrobky[index][part];
    onChange({...data, vyrobky: newVyrobky});
  };

  return (
    <QuoteLayout 
        isDark={isDark} 
        headerInfo={headerInfo} 
        data={data} 
        onChange={onChange}
        totals={totals}
    >
      {/* Product description */}
      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} flex items-center gap-4`}>
        <h3 className={`text-sm font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-700'}`}>Popis zakázky:</h3>
        <input
          type="text"
          value={data.popisVyrobkov}
          onChange={(e) => onChange({...data, popisVyrobkov: e.target.value})}
          placeholder="Popis zakázky"
          className={`flex-1 px-3 py-1.5 text-sm font-normal rounded border ${isDark ? 'bg-gray-800 text-white border-gray-500' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-[#e11b28]`}
        />
      </div>

      {/* Specifications Section */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} p-4`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>Výrobky:</h3>
        <div className="space-y-2">
          {(data.specifications || []).map((spec, index) => (
            <div key={spec.id} className="flex items-center gap-2">
              <span className={`w-20 text-xs text-right capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{spec.type}:</span>
              <input
                type="text"
                value={spec.value}
                onChange={(e) => handleUpdateSpecification(index, e.target.value)}
                className={`flex-1 px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-white border-gray-500' : 'bg-white text-gray-800 border-gray-300'} border`}
              />
              <button
                onClick={() => handleRemoveSpecification(index)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          
          <div className="relative inline-block">
             {/* Add Spec Menu */}
             <div className="flex gap-2 mt-2 ml-20">
                <button onClick={() => handleAddSpecification('dvere')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+ Dvere</button>
                <button onClick={() => handleAddSpecification('zarubna')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+ Zárubňa</button>
                <button onClick={() => handleAddSpecification('obklad')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+ Obklad</button>
             </div>
          </div>
        </div>
      </div>

      {/* Výrobky Table */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} overflow-hidden`}>
        <div className="overflow-x-visible">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-left border-r border-white/20 w-8"></th>
                <th className="px-2 py-2 text-left border-r border-white/20">miestnosť</th>
                <th className="px-2 py-2 text-left border-r border-white/20">položka</th>
                <th className="px-2 py-2 text-left border-r border-white/20">typ / rozmer</th>
                <th className="px-2 py-2 text-center border-r border-white/20">P / Ľ</th>
                <th className="px-2 py-2 text-center border-r border-white/20">zámok</th>
                <th className="px-2 py-2 text-center border-r border-white/20">sklo</th>
                <th className="px-2 py-2 text-left border-r border-white/20">povrch</th>
                <th className="px-2 py-2 text-left border-r border-white/20">poznámka</th>
                <th className="px-2 py-2 text-center border-r border-white/20">ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20">cena / ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20">cena celkom</th>
                <th className="px-2 py-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody>
              {data.vyrobky.map((item, index) => {
                const rows = [];
                // Determine row span based on visible parts
                let rowSpan = 0;
                if (item.hasDvere) rowSpan++;
                if (item.hasZarubna) rowSpan++;
                if (item.hasObklad) rowSpan++;
                if (rowSpan === 0) rowSpan = 1; // Empty row

                // Helper to render shared cells (Miestnost)
                const renderMiestnostCell = (rowIndex: number) => {
                    if (rowIndex === 0) {
                        return (
                            <>
                                <td rowSpan={rowSpan} className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'} font-medium`}>{index + 1}</td>
                                <td rowSpan={rowSpan} className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'} align-top`}>
                                <input
                                    type="text"
                                    value={item.miestnost}
                                    onChange={(e) => {
                                    const newVyrobky = [...data.vyrobky];
                                    newVyrobky[index].miestnost = e.target.value;
                                    onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none focus:bg-gray-100`}
                                />
                                {/* Add controls to add sub-items to this room */}
                                <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                                    {!item.hasDvere && <button onClick={() => toggleItemPart(index, 'hasDvere')} title="Pridať Dvere" className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded hover:bg-blue-200">+D</button>}
                                    {!item.hasZarubna && <button onClick={() => toggleItemPart(index, 'hasZarubna')} title="Pridať Zárubňu" className="text-[10px] bg-green-100 text-green-700 px-1 rounded hover:bg-green-200">+Z</button>}
                                    {!item.hasObklad && <button onClick={() => toggleItemPart(index, 'hasObklad')} title="Pridať Obklad" className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded hover:bg-yellow-200">+O</button>}
                                </div>
                                </td>
                            </>
                        );
                    }
                    return null;
                };

                const deleteButton = (
                    <td rowSpan={rowSpan} className={`px-1 py-1 text-center align-middle border-l ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <button
                            onClick={() => {
                                const newVyrobky = data.vyrobky.filter((_, i) => i !== index);
                                onChange({...data, vyrobky: newVyrobky});
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </td>
                );

                let currentRow = 0;

                // DVERE ROW
                if (item.hasDvere) {
                    rows.push(
                        <tr key={`${item.id}-dvere`} className={`group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-gray-700' : 'bg-white') : (isDark ? 'bg-gray-750' : 'bg-gray-50')}`}>
                            {renderMiestnostCell(currentRow)}
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                <div className="flex justify-between items-center group/cell">
                                    <span>dvere</span>
                                    <button onClick={() => toggleItemPart(index, 'hasDvere')} className="text-red-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100" title="Odstrániť Dvere">×</button>
                                </div>
                            </td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.dvereTypRozmer}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].dvereTypRozmer = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <select
                                    value={item.pL}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].pL = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} border-none focus:outline-none`}
                                >
                                    <option value="P dnu">P dnu</option>
                                    <option value="Ľ dnu">Ľ dnu</option>
                                    <option value="P von">P von</option>
                                    <option value="Ľ von">Ľ von</option>
                                </select>
                            </td>
                            <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <select
                                    value={item.zamok}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].zamok = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} border-none focus:outline-none`}
                                >
                                    <option value="BB">BB</option>
                                    <option value="WC">WC</option>
                                    <option value="PZ">PZ</option>
                                    <option value="magnet">magnet</option>
                                </select>
                            </td>
                            <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.sklo}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].sklo = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.povrch}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].povrch = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.poznamkaDvere}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].poznamkaDvere = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="number"
                                    value={item.ks}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].ks = parseInt(e.target.value) || 0;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="number"
                                    value={item.cenaDvere}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].cenaDvere = parseFloat(e.target.value) || 0;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-20 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
                            </td>
                            <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {((item.ks || 0) * (item.cenaDvere || 0)).toFixed(2)} €
                            </td>
                            {currentRow === 0 && deleteButton}
                        </tr>
                    );
                    currentRow++;
                }

                // ZARUBNA ROW
                if (item.hasZarubna) {
                    rows.push(
                        <tr key={`${item.id}-zarubna`} className={`group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-gray-700' : 'bg-white') : (isDark ? 'bg-gray-750' : 'bg-gray-50')}`}>
                            {renderMiestnostCell(currentRow)}
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                <div className="flex justify-between items-center group/cell">
                                    <span>zárubňa</span>
                                    <button onClick={() => toggleItemPart(index, 'hasZarubna')} className="text-red-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100" title="Odstrániť Zárubňu">×</button>
                                </div>
                            </td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.dvereOtvor}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].dvereOtvor = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    placeholder="otvor"
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td colSpan={3} className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}></td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.povrchZarubna || ''}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].povrchZarubna = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    placeholder="povrch"
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.poznamkaZarubna}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].poznamkaZarubna = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="number"
                                    value={item.ksZarubna}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].ksZarubna = parseInt(e.target.value) || 0;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="number"
                                    value={item.cenaZarubna}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].cenaZarubna = parseFloat(e.target.value) || 0;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-20 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
                            </td>
                            <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {((item.ksZarubna || 0) * (item.cenaZarubna || 0)).toFixed(2)} €
                            </td>
                            {currentRow === 0 && deleteButton}
                        </tr>
                    );
                    currentRow++;
                }

                // OBKLAD ROW
                if (item.hasObklad) {
                    rows.push(
                        <tr key={`${item.id}-obklad`} className={`group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-gray-700' : 'bg-white') : (isDark ? 'bg-gray-750' : 'bg-gray-50')}`}>
                            {renderMiestnostCell(currentRow)}
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                <div className="flex justify-between items-center group/cell">
                                    <span>obklad</span>
                                    <button onClick={() => toggleItemPart(index, 'hasObklad')} className="text-red-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100" title="Odstrániť Obklad">×</button>
                                </div>
                            </td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.typObklad || ''}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].typObklad = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    placeholder="typ/rozmer"
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td colSpan={3} className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}></td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.povrchObklad || ''}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].povrchObklad = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    placeholder="povrch"
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.poznamkaObklad || ''}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].poznamkaObklad = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="number"
                                    value={item.ksObklad}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].ksObklad = parseInt(e.target.value) || 0;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                            </td>
                            <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="number"
                                    value={item.cenaObklad}
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].cenaObklad = parseFloat(e.target.value) || 0;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    className={`w-20 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                                />
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
                            </td>
                            <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {((item.ksObklad || 0) * (item.cenaObklad || 0)).toFixed(2)} €
                            </td>
                            {currentRow === 0 && deleteButton}
                        </tr>
                    );
                    currentRow++;
                }

                // EMPTY ROW (if nothing selected)
                if (rowSpan === 1 && !item.hasDvere && !item.hasZarubna && !item.hasObklad) {
                     rows.push(
                        <tr key={`${item.id}-empty`} className={`group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-gray-700' : 'bg-white') : (isDark ? 'bg-gray-750' : 'bg-gray-50')}`}>
                            {renderMiestnostCell(0)}
                            <td colSpan={10} className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                <input
                                    type="text"
                                    value={item.poznamkaDvere || ''} // Reusing poznamkaDvere as generic text container for empty row
                                    onChange={(e) => {
                                        const newVyrobky = [...data.vyrobky];
                                        newVyrobky[index].poznamkaDvere = e.target.value;
                                        onChange({...data, vyrobky: newVyrobky});
                                    }}
                                    placeholder="Vlastný text..."
                                    className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none italic`}
                                />
                            </td>
                             {deleteButton}
                        </tr>
                     );
                }

                return rows;
              })}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                <td colSpan={11} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {totals.vyrobkyTotal.toFixed(2)} €
                </td>
                <td className={isDark ? 'bg-gray-600' : 'bg-gray-100'}></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Add Product Button with Menu */}
        <div className={`flex justify-center p-2 transition-all relative ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`p-1 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať riadok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showAddMenu && (
             <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 z-10 flex flex-col">
                <button onClick={() => handleAddProduct('dvere')} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm whitespace-nowrap">Dvere</button>
                <button onClick={() => handleAddProduct('zarubna')} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm whitespace-nowrap">Zárubňa</button>
                <button onClick={() => handleAddProduct('obklad')} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm whitespace-nowrap">Obklad</button>
                <button onClick={() => handleAddProduct('empty')} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm whitespace-nowrap border-t">Prázdny riadok</button>
             </div>
          )}
        </div>
      </div>

      <GenericItemsTable
        title="Príplatky:"
        items={data.priplatky}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => onChange({...data, priplatky: items})}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChange({...data, priplatky: [...data.priplatky, newItem]});
        }}
        footerContent={
          <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
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
        onChange={(items) => onChange({...data, kovanie: items})}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChange({...data, kovanie: [...data.kovanie, newItem]});
        }}
        footerContent={
          <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
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
        onChange={(items) => onChange({...data, montaz: items})}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChange({...data, montaz: [...data.montaz, newItem]});
        }}
        footerContent={
          <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
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