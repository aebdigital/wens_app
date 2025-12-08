import React from 'react';

interface MeranieTabProps {
  isDark: boolean;
  items: any[];
  onUpdate: (items: any[]) => void;
}

export const MeranieTab: React.FC<MeranieTabProps> = ({ isDark, items, onUpdate }) => {
  // Ensure we always have at least 20 rows for the grid look, or items + empty rows
  const displayItems = [...items];
  while (displayItems.length < 20) {
    displayItems.push({ datum: '', popis: '', pridat: '', zodpovedny: '' });
  }

  const handleUpdate = (index: number, field: string, value: string) => {
    const newItems = [...items];
    // If updating an index that doesn't exist in actual items, we need to fill gaps
    if (index >= newItems.length) {
       // fill up to index
       for (let i = newItems.length; i <= index; i++) {
         newItems.push({ datum: '', popis: '', pridat: '', zodpovedny: '' });
       }
    }
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate(newItems);
  };

  return (
    <div className="p-2 h-full">
      <div className="h-full overflow-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Dátum</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Popis</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Pridať</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Zodpovedný</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => (
              <tr key={`row-${index}`} className={isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="text" 
                    value={item.datum || ''}
                    onChange={(e) => handleUpdate(index, 'datum', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="text" 
                    value={item.popis || ''}
                    onChange={(e) => handleUpdate(index, 'popis', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="text" 
                    value={item.pridat || ''}
                    onChange={(e) => handleUpdate(index, 'pridat', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input 
                    type="text" 
                    value={item.zodpovedny || ''}
                    onChange={(e) => handleUpdate(index, 'zodpovedny', e.target.value)}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'}`} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
