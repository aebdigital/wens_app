import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { CustomDatePicker } from './CustomDatePicker';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  isDate?: boolean; // Mark column as date type for date range filtering
}

interface DateRangeFilter {
  from: string;
  to: string;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T, index: number) => void;
  highlightedIds?: string[];
  highlightKey?: keyof T; // key to match against highlightedIds
  rowClassName?: (item: T) => string;
}

// Helper to parse Slovak date format (d.m.yyyy or dd.mm.yyyy) to Date object
const parseSlovakDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // Handle both d.m.yyyy and yyyy-mm-dd formats
  if (dateStr.includes('-')) {
    // ISO format yyyy-mm-dd
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }
  // Slovak format d.m.yyyy
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
};

export const SortableTable = <T extends { [key: string]: any }>({
  columns,
  data,
  onRowClick,
  highlightedIds = [],
  highlightKey,
  rowClassName
}: SortableTableProps<T>) => {
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<{[key: string]: DateRangeFilter}>({});
  const [activeSearchColumn, setActiveSearchColumn] = useState<string | null>(null);
  const highlightedRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

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

  const handleDateRangeFilter = (column: string, field: 'from' | 'to', value: string) => {
    setDateRangeFilters(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        [field]: value
      }
    }));
  };

  const clearDateRangeFilter = (column: string) => {
    setDateRangeFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
    setActiveSearchColumn(null);
  };

  const isDateFilterActive = (column: string): boolean => {
    const filter = dateRangeFilters[column];
    return filter ? !!(filter.from || filter.to) : false;
  };

  const getSortedAndFilteredData = () => {
    let filteredData = [...data];

    // Apply text column filters
    Object.keys(columnFilters).forEach(column => {
      const filterValue = columnFilters[column];
      if (filterValue) {
        filteredData = filteredData.filter(item => {
          const value = item[column] || '';
          return value.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply date range filters
    Object.keys(dateRangeFilters).forEach(column => {
      const range = dateRangeFilters[column];
      if (range && (range.from || range.to)) {
        const fromDate = range.from ? new Date(range.from) : null;
        const toDate = range.to ? new Date(range.to) : null;

        // Set toDate to end of day
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
        }

        filteredData = filteredData.filter(item => {
          const valueStr = item[column] || '';
          const itemDate = parseSlovakDate(valueStr);

          if (!itemDate) return false; // Skip items without valid dates

          if (fromDate && itemDate < fromDate) return false;
          if (toDate && itemDate > toDate) return false;

          return true;
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filteredData.sort((a, b) => {
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

    return filteredData;
  };

  const sortedData = getSortedAndFilteredData();

  // Scroll to first highlighted row
  useEffect(() => {
    if (highlightedIds.length > 0 && highlightKey) {
      const timer = setTimeout(() => {
        const firstId = highlightedIds[0];
        const rowElement = highlightedRowRefs.current[firstId];
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedIds, highlightKey]);

  return (
    <div
      className={`rounded-lg overflow-x-auto ${isDark ? 'bg-dark-800' : 'bg-white'}`}
      style={{
        boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
      }}
    >
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
          <tr>
            {columns.map((column, index) => {
              const colKey = String(column.key);
              const isDateColumn = column.isDate;
              const dateFilter = dateRangeFilters[colKey];

              return (
                <th
                  key={colKey}
                  className={`px-2 py-2 text-left text-xs font-medium transition-all text-white ${index < columns.length - 1 ? 'border-r border-white/20' : ''}`}
                >
                  {activeSearchColumn === colKey ? (
                    isDateColumn ? (
                      // Date range filter UI
                      <div className="flex flex-col gap-1" style={{ animation: 'slideIn 0.2s ease-out' }}>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 flex-shrink-0 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-white/80 text-[10px]">Od dátumu:</span>
                          <button
                            onClick={() => clearDateRangeFilter(colKey)}
                            className="ml-auto flex-shrink-0 text-white/70 hover:text-white"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <CustomDatePicker
                          value={dateFilter?.from || ''}
                          onChange={(val) => handleDateRangeFilter(colKey, 'from', val)}
                          placeholder="Od..."
                          compact
                          className="w-full text-xs px-2 py-1 border border-white/30 rounded focus:outline-none focus:ring-2 focus:ring-white/50 transition-all bg-white/20 text-white placeholder-white/60"
                        />
                        <span className="text-white/80 text-[10px]">Do dátumu:</span>
                        <CustomDatePicker
                          value={dateFilter?.to || ''}
                          onChange={(val) => handleDateRangeFilter(colKey, 'to', val)}
                          placeholder="Do..."
                          compact
                          className="w-full text-xs px-2 py-1 border border-white/30 rounded focus:outline-none focus:ring-2 focus:ring-white/50 transition-all bg-white/20 text-white placeholder-white/60"
                        />
                      </div>
                    ) : (
                      // Text search UI (existing)
                      <div className="flex items-center gap-2" style={{ animation: 'slideIn 0.2s ease-out' }}>
                        <svg className="w-4 h-4 flex-shrink-0 text-white/70" style={{ animation: 'fadeIn 0.3s ease-out' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder={`Vyhľadať...`}
                          value={columnFilters[colKey] || ''}
                          onChange={(e) => handleColumnFilter(colKey, e.target.value)}
                          onBlur={() => {
                            if (!columnFilters[colKey]) {
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
                        {columnFilters[colKey] && (
                          <button
                            onClick={() => {
                              handleColumnFilter(colKey, '');
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
                    )
                  ) : (
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => handleSort(colKey)}
                        className="cursor-pointer hover:text-white/80 transition-colors"
                      >
                        {column.label}
                        {sortConfig?.key === colKey && (
                          <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                      <button
                        onClick={() => setActiveSearchColumn(colKey)}
                        className={`ml-2 p-1 rounded hover:bg-white/20 transition-colors ${
                          isDateColumn
                            ? isDateFilterActive(colKey) ? 'text-white' : 'text-white/70'
                            : columnFilters[colKey] ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        {isDateColumn ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => {
            const itemId = highlightKey ? item[highlightKey] : undefined;
            const isHighlighted = highlightKey && itemId !== undefined && highlightedIds.includes(String(itemId));
            
            return (
              <tr
                key={itemId || index}
                ref={(el) => {
                  if (el && highlightKey && itemId) highlightedRowRefs.current[itemId] = el;
                }}
                className={`border-b cursor-pointer transition-colors ${
                  isDark
                    ? 'border-dark-500 hover:bg-dark-700'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${isHighlighted ? 'ring-2 ring-red-500 ring-inset' : ''} ${rowClassName ? rowClassName(item) : ''}`}
                onClick={() => onRowClick && onRowClick(item, index)}
              >
                {columns.map((column, colIndex) => {
                  const value = item[column.key as string];
                  return (
                    <td
                      key={String(column.key)}
                      className={`px-2 py-1 text-xs ${isDark ? 'border-r border-dark-500 text-gray-300' : 'border-r border-gray-200'} ${
                        // Apply specific styling for specific columns if needed, but keep it generic mostly
                        // Or allow column to define className
                        ''
                      }`}
                    >
                      {column.render ? column.render(value, item) : value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
