import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProducts, Product } from '../contexts/ProductsContext';
import { SortableTable, Column } from './common/SortableTable';
import { ProductDetailModal } from './ProductDetailModal';

const Objednavky = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, updateProduct, deleteProduct } = useProducts();

  // Tab State
  const [activeTab, setActiveTab] = useState<'objednavky' | 'produkty'>('objednavky');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // --- Objednávky Logic ---
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

  const orderColumns: Column<typeof tableData[0]>[] = [
    {
      key: 'cisloObjednavky',
      label: 'Číslo objednávky',
      render: (val) => <span className="font-medium text-[#e11b28]">{val}</span>
    },
    { key: 'cisloZakazkyDisplay', label: 'Číslo zakázky' },
    { key: 'menoZakaznikaDisplay', label: 'Meno zákazníka' },
    { key: 'firmaDisplay', label: 'Firma' },
    { key: 'odoslaneDisplay', label: 'Odoslané', isDate: true },
    { key: 'doruceneDisplay', label: 'Doručené', isDate: true },
    { key: 'popisDisplay', label: 'Popis' }
  ];

  // --- Produkty Logic ---
  const productColumns: Column<Product>[] = [
    { 
      key: 'name', 
      label: 'Názov produktu', 
      render: (val) => <span className="font-medium text-[#e11b28]">{val}</span> 
    },
    { 
      key: 'kod', 
      label: 'Kód', 
      render: (val) => <span className="text-xs text-gray-500">{val || '-'}</span> 
    },
    { key: 'supplier', label: 'Dodávateľ' },
    { 
      key: 'supplierDetails', 
      label: 'Kontakt dodávateľa', 
      render: (val, item) => (
         <div className="text-xs text-gray-500">
             {item.supplierDetails?.tel && <div>Tel: {item.supplierDetails.tel}</div>}
             {item.supplierDetails?.email && <div>Email: {item.supplierDetails.email}</div>}
         </div>
      )
    }
  ];

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title & Tabs */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Objednávky</h1>
        
         {/* Tabs */}
        <div className={`flex gap-2 p-1 rounded-lg self-start ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <button
                onClick={() => setActiveTab('objednavky')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'objednavky'
                    ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow'
                    : isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
                }`}
            >
                Objednávky
            </button>
            <button
                onClick={() => setActiveTab('produkty')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'produkty'
                    ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow'
                    : isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
                }`}
            >
                Produkty
            </button>
        </div>
      </div>

      {/* --- Objednávky Tab --- */}
      {activeTab === 'objednavky' && (
        <>
            <SortableTable
                columns={orderColumns}
                data={tableData}
                onRowClick={(item) => handleOrderClick(item.rawOrder)}
            />
            {objednavkyData.length === 0 && (
                <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Žiadne objednávky. Vytvorte objednávky v Spis → Objednávky tab.
                </div>
            )}
        </>
      )}

      {/* --- Produkty Tab --- */}
      {activeTab === 'produkty' && (
          <>
            <SortableTable
                columns={productColumns}
                data={products}
                onRowClick={(item) => setSelectedProduct(item)}
            />
             {products.length === 0 && (
                <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Žiadne uložené produkty. Produkty sa ukladajú automaticky pri vytvorení objednávky.
                </div>
            )}
          </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
          <ProductDetailModal
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            product={selectedProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
          />
      )}

    </div>
  );
};

export default Objednavky;
