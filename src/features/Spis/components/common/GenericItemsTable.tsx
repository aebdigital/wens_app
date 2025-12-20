import React from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number, onChange: (updated: T) => void) => React.ReactNode;
}

interface GenericItemsTableProps<T extends { id: string | number }> {
  items: T[];
  columns: Column<T>[];
  onChange: (items: T[]) => void;
  onAddItem: () => void;
  isDark: boolean;
  title?: string;
  footerContent?: React.ReactNode;
  mergeFirstTwoHeaders?: boolean; // If true, merge first two column headers into title
}

export const GenericItemsTable = <T extends { id: string | number }>({
  items,
  columns,
  onChange,
  onAddItem,
  isDark,
  title,
  footerContent,
  mergeFirstTwoHeaders = false
}: GenericItemsTableProps<T>) => {
  return (
    <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} overflow-hidden`}>
      {/* Only show title header if not merging into table header */}
      {!mergeFirstTwoHeaders && (
        <div className={`px-4 py-2 ${isDark ? 'bg-gray-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>{title}</h3>
        </div>
      )}
      <div className="overflow-x-visible">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
              {mergeFirstTwoHeaders ? (
                <>
                  {/* First column shows table title instead of column label */}
                  <th
                    className="px-2 py-2 text-left border-r border-white/20 pl-4"
                  >
                    {title?.replace(':', '')}
                  </th>
                  {/* Remaining columns from index 1 onwards */}
                  {columns.slice(1).map((col, idx) => (
                    <th
                      key={String(col.key) + idx}
                      className={`px-2 py-2 text-${col.align || 'left'} border-r border-white/20 ${col.width || ''}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </>
              ) : (
                columns.map((col, idx) => (
                  <th
                    key={String(col.key) + idx}
                    className={`px-2 py-2 text-${col.align || 'left'} border-r border-white/20 ${col.width || ''} ${idx === 0 ? 'pl-4' : ''}`}
                  >
                    {col.label}
                  </th>
                ))
              )}
              <th className="px-2 py-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                {columns.map((col, idx) => (
                  <td key={String(col.key) + idx} className={`px-2 py-1 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} border-r ${isDark ? 'border-gray-600' : 'border-gray-200'} ${idx === 0 ? 'pl-4' : ''}`}>
                    {col.render ? col.render(item, index, (updated) => {
                      const newItems = [...items];
                      newItems[index] = updated;
                      onChange(newItems);
                    }) : (
                      <input
                        type={typeof item[col.key] === 'number' ? 'number' : 'text'}
                        value={item[col.key] as any}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = {
                            ...item,
                            [col.key]: typeof item[col.key] === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                          };
                          onChange(newItems);
                        }}
                        className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                      />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1 text-center align-middle">
                  <button
                    onClick={() => {
                      const newItems = items.filter((_, i) => i !== index);
                      onChange(newItems);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
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
          {footerContent && (
            <tfoot>
              {footerContent}
            </tfoot>
          )}
        </table>
      </div>
      <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <button
          onClick={onAddItem}
          className={`p-1 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
          title="Pridať riadok"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};
