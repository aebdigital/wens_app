import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Objednavky = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [objednavkyData, setObjednavkyData] = useState(() => {
    try {
      const storageKey = user ? `objednavkyData_${user.id}` : 'objednavkyData';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse objednavkyData from localStorage:', error);
      return [];
    }
  });

  // Reload orders when user changes
  useEffect(() => {
    if (user) {
      try {
        const storageKey = `objednavkyData_${user.id}`;
        const saved = localStorage.getItem(storageKey);
        setObjednavkyData(saved ? JSON.parse(saved) : []);
      } catch (error) {
        console.error('Failed to reload orders for user:', error);
        setObjednavkyData([]);
      }
    }
  }, [user]);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({});
  const [activeSearchColumn, setActiveSearchColumn] = useState<string | null>(null);

  const handleOrderClick = (order: any) => {
    // Store the clicked order info for navigation
    localStorage.setItem('selectedOrder', JSON.stringify(order));
    // Navigate to Spis page using React Router
    navigate('/spis');
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
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Objednávky</h1>
      </div>


      {/* Table Section */}
      <div
        className={`rounded-lg overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        style={{
          boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
        }}
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
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
                  className={`px-2 py-2 text-left text-xs font-medium transition-all text-white ${index < array.length - 1 ? 'border-r border-white/20' : ''}`}
                >
                  {activeSearchColumn === column.key ? (
                    <div className="flex items-center gap-2" style={{ animation: 'slideIn 0.2s ease-out' }}>
                      <svg className="w-4 h-4 flex-shrink-0 text-white/70" style={{ animation: 'fadeIn 0.3s ease-out' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder={`Vyhľadať...`}
                        value={columnFilters[column.key] || ''}
                        onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                        onBlur={() => {
                          if (!columnFilters[column.key]) {
                            setActiveSearchColumn(null);
                          }
                        }}
                        autoFocus
                        style={{
                          animation: 'expandWidth 0.25s ease-out',
                          boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
                        }}
                        className="w-full text-xs px-2 py-1 border border-white/30 rounded focus:outline-none focus:ring-2 focus:ring-white/50 transition-all bg-white/20 text-white placeholder-white/60"
                      />
                      {columnFilters[column.key] && (
                        <button
                          onClick={() => {
                            handleColumnFilter(column.key, '');
                            setActiveSearchColumn(null);
                          }}
                          className="flex-shrink-0 text-white/70 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => handleSort(column.key)}
                        className="cursor-pointer hover:text-white/80 transition-colors"
                      >
                        {column.label}
                        {sortConfig?.key === column.key && (
                          <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                      <button
                        onClick={() => setActiveSearchColumn(column.key)}
                        className={`ml-2 p-1 rounded hover:bg-white/20 transition-colors ${
                          columnFilters[column.key] ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getSortedAndFilteredOrders().map((order: any) => (
              <tr
                key={order.cisloObjednavky || `order-${order.cisloZakazky}-${order.datum}`}
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