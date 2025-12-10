import React from 'react';

interface ObjednavkyTabProps {
  items: any[];
  onUpdate: (items: any[]) => void;
  isDark: boolean;
  user: any;
  entries: any[];
  selectedOrderIndex: number | null;
  isLocked?: boolean;
  onAddVzor: () => void;
  onEdit?: (item: any) => void;
}

export const ObjednavkyTab: React.FC<ObjednavkyTabProps> = ({
  items,
  onUpdate,
  isDark,
  user,
  entries,
  selectedOrderIndex,
  isLocked = false,
  onAddVzor,
  onEdit
}) => {
  return (
    <div className="p-2 h-full">
      <div className="mb-4 flex gap-2">
        <button
          onClick={onAddVzor}
          disabled={isLocked}
          className={`px-3 py-1 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded text-xs hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pridať objednávku
        </button>
      </div>
      <div className="h-full overflow-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Názov</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Vytvoril</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Dátum</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Popis</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Číslo objednávky</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Doručené</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              // Check if this is the highlighted order from navigation
              const isHighlighted = selectedOrderIndex === index;

              return (
                <tr 
                  key={item.id || `objednavka-${index}`} 
                  className={`${isHighlighted ? 'bg-yellow-100 border-yellow-400' : (isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50')} ${onEdit ? 'cursor-pointer' : ''}`}
                  onClick={() => onEdit && onEdit(item)}
                >
                  <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="text"
                      value={item.nazov}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].nazov = e.target.value;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      onClick={(e) => e.stopPropagation()} // Prevent row click when editing inline
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="text"
                      value={item.vypracoval}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].vypracoval = e.target.value;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="date"
                      value={item.datum}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].datum = e.target.value;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="text"
                      value={item.popis}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].popis = e.target.value;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="text"
                      value={item.cisloObjednavky}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].cisloObjednavky = e.target.value;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="text"
                      value={item.dorucene}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].dorucene = e.target.value;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className="border border-gray-300 px-1 py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLocked) return;
                        const updated = items.filter((_, i) => i !== index);
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      className={`px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Odstrániť
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Žiadne objednávky. Kliknite "Pridať objednávku" pre vytvorenie novej.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
