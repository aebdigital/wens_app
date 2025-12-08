import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SortableTable, Column } from './common/SortableTable';

const Objednavky = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [spisEntries, setSpisEntries] = useState<any[]>(() => {
    try {
      const storageKey = user ? `spisEntries_${user.id}` : 'spisEntries';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse spisEntries from localStorage:', error);
      return [];
    }
  });

  // Reload entries when user changes
  useEffect(() => {
    if (user) {
      try {
        const storageKey = `spisEntries_${user.id}`;
        const saved = localStorage.getItem(storageKey);
        setSpisEntries(saved ? JSON.parse(saved) : []);
      } catch (error) {
        console.error('Failed to reload entries for user:', error);
        setSpisEntries([]);
      }
    }
  }, [user]);

  const objednavkyData = useMemo(() => {
    return spisEntries.flatMap(entry => {
      // Filter out the problematic parent entry if it somehow still exists in the loop
      if (entry.cisloCP === 'CP2025/0367') return [];

      // Safely access nested items
      const items = entry.fullFormData?.objednavkyItems || [];
      return items.map((order: any) => ({
        ...order,
        // Add context from the parent project
        parentSpisId: entry.cisloCP,
        cisloZakazkyDisplay: entry.cisloZakazky,
        menoZakaznikaDisplay: entry.kontaktnaOsoba,
        firmaDisplay: entry.firma,
        // Map order specific fields
        odoslaneDisplay: order.datum ? new Date(order.datum).toLocaleDateString('sk-SK') : '',
        doruceneDisplay: order.dorucene || '-',
        popisDisplay: order.popis || '',
        // Keep raw data
        rawOrder: { ...order, parentSpisId: entry.cisloCP }
      }));
    });
  }, [spisEntries]);

  const handleOrderClick = (order: any) => {
    // Store the clicked order info for navigation
    localStorage.setItem('selectedOrder', JSON.stringify(order));
    // Navigate to Spis page using React Router
    navigate('/spis');
  };

  const tableData = useMemo(() => {
    return [...objednavkyData].reverse();
  }, [objednavkyData]);

  const columns: Column<typeof tableData[0]>[] = [
    { 
      key: 'cisloObjednavky', 
      label: 'Číslo objednávky',
      render: (val) => <span className="font-medium text-[#e11b28]">{val}</span>
    },
    { key: 'cisloZakazkyDisplay', label: 'Číslo zakázky' },
    { key: 'menoZakaznikaDisplay', label: 'Meno zákazníka' },
    { key: 'firmaDisplay', label: 'Firma' },
    { key: 'odoslaneDisplay', label: 'Odoslané' },
    { key: 'doruceneDisplay', label: 'Doručené' },
    { key: 'popisDisplay', label: 'Popis' }
  ];

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Objednávky</h1>
      </div>

      {/* Table Section */}
      <SortableTable
        columns={columns}
        data={tableData}
        onRowClick={(item) => handleOrderClick(item.rawOrder)}
      />
      
      {objednavkyData.length === 0 && (
        <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Žiadne objednávky. Vytvorte objednávky v Spis → Objednávky tab.
        </div>
      )}
    </div>
  );
};

export default Objednavky;