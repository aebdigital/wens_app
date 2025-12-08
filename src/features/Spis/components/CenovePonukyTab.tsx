import React from 'react';
import { CenovaPonukaItem } from '../types';

interface CenovePonukyTabProps {
  items: CenovaPonukaItem[];
  onDelete: (index: number) => void;
  onEdit: (item: CenovaPonukaItem) => void;
  onGeneratePDF: (item: CenovaPonukaItem) => void;
  isDark: boolean;
}

export const CenovePonukyTab: React.FC<CenovePonukyTabProps> = ({ 
  items, 
  onDelete, 
  onEdit, 
  onGeneratePDF, 
  isDark 
}) => {
  return (
    <div className="p-2 h-full">
      <div className="h-full overflow-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
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
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr 
                key={item.id} 
                className={`${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} cursor-pointer`}
                onClick={() => onEdit(item)}
              >
                <td className={`border px-3 py-2 ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.cisloCP}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.typ === 'dvere'
                      ? 'bg-blue-100 text-blue-800'
                      : item.typ === 'nabytok'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.typ === 'dvere' ? 'Dvere' : item.typ === 'nabytok' ? 'Nábytok' : 'Púzdra'}
                  </span>
                </td>
                <td className={`border px-3 py-2 text-center ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.verzia}
                </td>
                <td className={`border px-3 py-2 text-right ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.cenaBezDPH > 0 ? `${item.cenaBezDPH.toFixed(2)} €` : '-'}
                </td>
                <td className={`border px-3 py-2 text-right font-semibold ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.cenaSDPH > 0 ? `${item.cenaSDPH.toFixed(2)} €` : '-'}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.odoslane || '-'}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.vytvoril}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}`}>
                  {item.popis}
                </td>
                <td className={`border px-2 py-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
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
                        onDelete(index);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Odstrániť"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className={`border px-3 py-8 text-center ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                  Žiadne cenové ponuky. Kliknite na "Pridať vzor" pre vytvorenie novej cenovej ponuky.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
