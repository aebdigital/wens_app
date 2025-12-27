import React from 'react';
import { CenovaPonukaItem } from '../types';

interface CenovePonukyTabProps {
  items: CenovaPonukaItem[];
  onDelete: (index: number) => void;
  onEdit: (item: CenovaPonukaItem) => void;
  onGeneratePDF: (item: CenovaPonukaItem) => void;
  isDark: boolean;
  isLocked?: boolean;
  onAddVzor: () => void;
  onToggleSelect: (item: CenovaPonukaItem) => void;
  onUpdate: (items: CenovaPonukaItem[]) => void;
}

export const CenovePonukyTab: React.FC<CenovePonukyTabProps> = ({
  items,
  onDelete,
  onEdit,
  onGeneratePDF,
  isDark,
  isLocked = false,
  onAddVzor,
  onToggleSelect,
  onUpdate
}) => {
  return (
    <div className="p-2 h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Číslo CP</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Typ</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Verzia</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Cena bez DPH</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Cena s DPH</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Odoslané</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Vytvoril</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Popis</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-20">Akcie</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-24">Schválené</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className={`${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} cursor-pointer`}
                onClick={() => onEdit(item)}
              >
                <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.cisloCP}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.typ === 'dvere'
                      ? 'bg-blue-100 text-blue-800'
                      : item.typ === 'nabytok'
                      ? 'bg-green-100 text-green-800'
                      : item.typ === 'schody'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.typ === 'dvere' ? 'Dvere' : item.typ === 'nabytok' ? 'Nábytok' : item.typ === 'schody' ? 'Schody' : 'Púzdra'}
                  </span>
                </td>
                <td className={`border px-3 py-2 text-center ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.verzia}
                </td>
                <td className={`border px-3 py-2 text-right ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.cenaBezDPH > 0 ? `${item.cenaBezDPH.toFixed(2)} €` : '-'}
                </td>
                <td className={`border px-3 py-2 text-right font-semibold ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.cenaSDPH > 0 ? `${item.cenaSDPH.toFixed(2)} €` : '-'}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.odoslane || '-'}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.vytvoril}
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                  <input
                    type="text"
                    value={item.popis}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...newItems[index], popis: e.target.value };
                      onUpdate(newItems);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLocked}
                    className={`w-full text-xs border-0 bg-transparent px-2 py-1 focus:ring-0 ${isDark ? 'text-gray-300' : 'text-gray-600'} ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className={`border px-2 py-2 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGeneratePDF(item);
                      }}
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Stiahnuť PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) onDelete(index);
                      }}
                      disabled={isLocked}
                      className={`p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Odstrániť"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td
                  className={`border px-3 py-2 text-center cursor-pointer ${isDark ? 'border-dark-500' : 'border-gray-300'} ${isLocked ? 'cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) onToggleSelect(item);
                  }}
                >
                  <input
                    type="radio"
                    checked={item.selected || false}
                    onChange={() => {}}
                    disabled={isLocked}
                    className="cursor-pointer pointer-events-none"
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={10} className={`border px-3 py-8 text-center ${isDark ? 'border-dark-500 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                  Žiadne cenové ponuky. Kliknite na "Pridať cenovú ponuku" pre vytvorenie novej cenovej ponuky.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-start">
        <button
          onClick={onAddVzor}
          disabled={isLocked}
          className={`px-6 py-3 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg text-sm hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pridať cenovú ponuku
        </button>
      </div>
    </div>
  );
};
