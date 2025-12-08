import React from 'react';

interface ObjednavkyTabProps {
  items: any[];
  onUpdate: (items: any[]) => void;
  isDark: boolean;
  user: any;
  entries: any[];
  selectedOrderIndex: number | null;
}

export const ObjednavkyTab: React.FC<ObjednavkyTabProps> = ({
  items,
  onUpdate,
  isDark,
  user,
  entries,
  selectedOrderIndex
}) => {
  return (
    <div className="p-2 h-full">
      <div className="mb-4">
        <button
          onClick={() => {
            // Calculate next ID based on ALL entries and current form items
            const allGlobalOrders = entries.flatMap(e => e.fullFormData?.objednavkyItems || []);
            const allIds = [...allGlobalOrders, ...items].map((o: any) => o.cisloObjednavky);
            
            const maxId = allIds.reduce((max, id) => {
                // Ensure we handle potential undefined or non-string IDs gracefully
                if (!id) return max;
                const num = parseInt(id, 10);
                return !isNaN(num) && num > max ? num : max;
            }, 0);
            const nextId = (maxId + 1).toString().padStart(6, '0');

            const newItem = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              nazov: '',
              vypracoval: user ? `${user.firstName} ${user.lastName}` : '',
              datum: new Date().toISOString().split('T')[0],
              popis: '',
              cisloObjednavky: nextId,
              dorucene: ''
            };
            onUpdate([...items, newItem]);
          }}
          className="px-3 py-1 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded text-xs hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
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
                <tr key={item.id || `objednavka-${index}`} className={`${isHighlighted ? 'bg-yellow-100 border-yellow-400' : (isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50')}`}>
                  <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="text"
                      value={item.nazov}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].nazov = e.target.value;
                        onUpdate(updated);
                      }}
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''}`}
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
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''}`}
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
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''}`}
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
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''}`}
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
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''}`}
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
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''}`}
                    />
                  </td>
                  <td className="border border-gray-300 px-1 py-1">
                    <button
                      onClick={() => {
                        const updated = items.filter((_, i) => i !== index);
                        onUpdate(updated);
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold"
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
