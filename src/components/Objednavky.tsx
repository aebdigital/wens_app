import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Objednavky = () => {
  const { isDark } = useTheme();
  const [filters, setFilters] = useState({
    cisloObjednavky: '',
    cisloZakazky: '',
    zakaznik: '',
    firma: '',
    odoslane: '',
    dorucene: '',
    limitRadkov: '200'
  });

  const [objednavkyData] = useState(() => {
    const saved = localStorage.getItem('objednavkyData');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({});

  const handleOrderClick = (order: any) => {
    // Store the clicked order info for navigation
    localStorage.setItem('selectedOrder', JSON.stringify(order));
    // Navigate to Spis page
    window.location.href = '/spis';
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  const getSortedAndFilteredOrders = () => {
    let filteredOrders = [...objednavkyData];
    
    // Apply column filters
    Object.keys(columnFilters).forEach(column => {
      const filterValue = columnFilters[column];
      if (filterValue) {
        filteredOrders = filteredOrders.filter(order => {
          const value = order[column] || '';
          return value.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filteredOrders.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredOrders;
  };

  return (
    <div className={`h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Objednávky</h1>
      </div>


      {/* Table Section */}
      <div className={`rounded-lg shadow-md overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <table className="w-full text-xs">
          <thead className={`sticky top-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <tr>
              {[
                { key: 'cisloObjednavky', label: 'Číslo objednávky' },
                { key: 'cisloZakazky', label: 'Číslo zakázky' },
                { key: 'menoZakaznika', label: 'Meno zákazníka' },
                { key: 'firma', label: 'Firma' },
                { key: 'odoslane', label: 'Odoslané' },
                { key: 'dorucene', label: 'Doručené' },
                { key: 'popis', label: 'Popis' }
              ].map((column, index, array) => (
                <th
                  key={column.key}
                  className={`px-2 py-1 text-left text-xs font-medium cursor-pointer ${
                    isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                  } ${index < array.length - 1 ? (isDark ? 'border-r border-gray-600' : 'border-r border-gray-200') : ''}`}
                >
                  <div className="space-y-1">
                    <div
                      onClick={() => handleSort(column.key)}
                      className="flex items-center justify-between"
                    >
                      <span>{column.label}</span>
                      <span>
                        {sortConfig?.key === column.key
                          ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                          : '▼'
                        }
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder={`Filter ${column.label}...`}
                      value={columnFilters[column.key] || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleColumnFilter(column.key, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full text-xs px-1 py-1 border rounded focus:outline-none focus:border-blue-500 ${
                        isDark ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getSortedAndFilteredOrders().map((order: any, index: number) => (
              <tr
                key={index}
                className={`border-b cursor-pointer transition-colors ${
                  isDark ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' : 'border-gray-200 bg-white hover:bg-gray-50 hover:bg-blue-50'
                }`}
                onClick={() => handleOrderClick(order)}
              >
                <td className={`px-2 py-1 text-xs font-medium text-[#e11b28] ${isDark ? 'border-r border-gray-700' : 'border-r border-gray-200'}`}>{order.cisloObjednavky}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{order.cisloZakazky || order.zakazka || ''}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{order.menoZakaznika || order.zakaznik || ''}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{order.firma || order.realizator || ''}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{order.odoslane || order.datum || ''}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{order.dorucene || '-'}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300' : ''}`}>{order.popis || order.poznamka || ''}</td>
              </tr>
            ))}
            {getSortedAndFilteredOrders().length === 0 && (
              <tr>
                <td colSpan={7} className={`px-2 py-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Žiadne objednávky. Vytvorte objednávky v Spis → Objednávky tab.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Objednavky;