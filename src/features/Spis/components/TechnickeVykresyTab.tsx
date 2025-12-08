import React from 'react';

interface TechnickeVykresyTabProps {
  isDark: boolean;
  items: any[];
  onUpdate: (items: any[]) => void;
}

export const TechnickeVykresyTab: React.FC<TechnickeVykresyTabProps> = ({ isDark, items, onUpdate }) => {
  // We'll provide an "add new" row for user input if they want to add custom technical drawings.
  // Otherwise, if items is empty, it will just show the header and the "no data" message.
  
  const handleUpdate = (index: number, field: string, value: string) => {
    const newItems = [...items];
    if (!newItems[index]) {
      newItems[index] = { nazov: '', datum: '', kategoria: '', dodavatel: '' };
    }
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate(newItems);
  };

  const handleAddItem = () => {
    onUpdate([...items, { nazov: '', datum: '', kategoria: '', dodavatel: '' }]);
  };

  const handleDeleteItem = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <div className="p-2 h-full flex flex-col">
      <div className="mb-4">
        <button
          onClick={handleAddItem}
          className="px-3 py-1 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded text-xs hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          Pridať riadok
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Názov</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Dátum</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Kategória</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Dodávateľ</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`tech-row-${index}`} className={isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="text" 
                    value={item.nazov || ''}
                    onChange={(e) => handleUpdate(index, 'nazov', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="date" 
                    value={item.datum || ''}
                    onChange={(e) => handleUpdate(index, 'datum', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="text" 
                    value={item.kategoria || ''}
                    onChange={(e) => handleUpdate(index, 'kategoria', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="text" 
                    value={item.dodavatel || ''}
                    onChange={(e) => handleUpdate(index, 'dodavatel', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-semibold"
                  >
                    Odstrániť
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Žiadne technické výkresy. Kliknite "Pridať riadok" pre pridanie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
