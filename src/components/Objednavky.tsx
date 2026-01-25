import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSpis } from '../contexts/SpisContext';
import { useProducts, Product } from '../contexts/ProductsContext';
import { SortableTable, Column } from './common/SortableTable';
import { ProductDetailModal } from './ProductDetailModal';
import { CompanyDetailModal } from './CompanyDetailModal';
import { useAuth } from '../contexts/AuthContext';
import { AddOrderModal } from '../features/Spis/components/AddOrderModal';
import { CustomDatePicker } from './common/CustomDatePicker';
import { generateOrderPDF, OrderPDFData } from '../features/Spis/utils/pdfGenerator';
import { PDFPreviewModal } from './common/PDFPreviewModal';
import { toast } from 'react-hot-toast';
import { ObjednavkaItem, PuzdraData, SpisEntry } from '../features/Spis/types';
import { supabase, DbStandaloneOrder } from '../lib/supabase';

interface Company {
  name: string;
  ulica: string;
  mesto: string;
  tel: string;
  email: string;
  productCount: number;
}

const Objednavky = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const userName = user ? `${user.firstName} ${user.lastName}` : '';
  const userEmail = user?.email || '';
  const { entries, isLoading, updateEntry } = useSpis();
  const { products, updateProduct, deleteProduct, addProduct } = useProducts();

  // Tab State
  const [activeTab, setActiveTab] = useState<'objednavky' | 'produkty'>('objednavky');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // New states for Standalone Orders
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<{ order: ObjednavkaItem, parentSpisId: string, isStandalone?: boolean } | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [standaloneOrders, setStandaloneOrders] = useState<DbStandaloneOrder[]>([]);

  // Load standalone orders from database
  const loadStandaloneOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('standalone_orders')
        .select('*')
        .order('cislo_objednavky', { ascending: false });

      if (error) throw error;
      setStandaloneOrders(data || []);
    } catch (error) {
      console.error('Error loading standalone orders:', error);
    }
  }, []);

  useEffect(() => {
    loadStandaloneOrders();
  }, [loadStandaloneOrders]);

  const objednavkyData = useMemo(() => {
    // Orders from spis entries (exclude GENERAL since we now use standalone_orders table)
    const spisOrders = entries.flatMap(entry => {
      // Filter out GENERAL and problematic entries
      if (entry.cisloCP === 'GENERAL' || entry.cisloCP === 'CP2025/0367') return [];

      // Safely access nested items
      const items = entry.fullFormData?.objednavkyItems || [];
      return items.map((order: any) => ({
        ...order,
        // Add context from the parent project
        parentSpisId: entry.cisloCP,
        isStandalone: false,
        cisloZakazkyDisplay: entry.cisloZakazky,
        menoZakaznikaDisplay: entry.kontaktnaOsoba,
        // Show dodavatel from order, not firma from entry
        firmaDisplay: order.puzdraData?.dodavatel?.nazov || '',
        // Map order specific fields
        odoslaneDisplay: order.datum ? new Date(order.datum).toLocaleDateString('sk-SK') : '',
        doruceneDisplay: order.dorucene || '-',
        popisDisplay: order.popis || '',
        // Keep raw data
        rawOrder: { ...order, parentSpisId: entry.cisloCP }
      }));
    });

    // Standalone orders from the new table
    const standaloneOrdersMapped = standaloneOrders.map(order => ({
      id: order.id,
      cisloObjednavky: order.cislo_objednavky,
      nazov: order.nazov || '',
      vypracoval: order.vypracoval || '',
      datum: order.datum,
      popis: order.popis || '',
      dorucene: order.dorucene || '',
      puzdraData: order.puzda_data,
      // Standalone order specific fields
      parentSpisId: 'STANDALONE',
      isStandalone: true,
      cisloZakazkyDisplay: '',
      menoZakaznikaDisplay: '',
      firmaDisplay: order.puzda_data?.dodavatel?.nazov || '',
      odoslaneDisplay: order.datum ? new Date(order.datum).toLocaleDateString('sk-SK') : '',
      doruceneDisplay: order.dorucene || '-',
      popisDisplay: order.popis || '',
      rawOrder: { ...order, parentSpisId: 'STANDALONE', isStandalone: true }
    }));

    return [...spisOrders, ...standaloneOrdersMapped];
  }, [entries, standaloneOrders]);

  const handleOrderClick = (order: any) => {
    // Always open the order for editing directly, regardless of parent spis
    setEditingOrder({ order, parentSpisId: order.parentSpisId, isStandalone: order.isStandalone });
    setIsAddOrderModalOpen(true);
  };

  const handleUpdateOrderDate = async (order: any, newDate: string) => {
    try {
      // Handle standalone orders
      if (order.isStandalone) {
        const { error } = await supabase
          .from('standalone_orders')
          .update({ dorucene: newDate })
          .eq('id', order.id);
        if (error) throw error;
        await loadStandaloneOrders();
        toast.success('Dátum doručenia aktualizovaný');
        return;
      }

      // Handle spis orders
      const entry = entries.find(e => e.cisloCP === order.parentSpisId);
      if (!entry || !entry.fullFormData) return;

      const updatedItems = entry.fullFormData.objednavkyItems.map((item: ObjednavkaItem) =>
        item.cisloObjednavky === order.cisloObjednavky ? { ...item, dorucene: newDate } : item
      );

      const updatedEntry: SpisEntry = {
        ...entry,
        fullFormData: {
          ...entry.fullFormData,
          objednavkyItems: updatedItems
        }
      };

      await updateEntry(updatedEntry);
      toast.success('Dátum doručenia aktualizovaný');
    } catch (error) {
      console.error('Error updating order date:', error);
      toast.error('Chyba pri aktualizácii dátumu');
    }
  };

  const handleUpdateOrderSentDate = async (order: any, newDate: string) => {
    try {
      // Handle standalone orders
      if (order.isStandalone) {
        const { error } = await supabase
          .from('standalone_orders')
          .update({ datum: newDate })
          .eq('id', order.id);
        if (error) throw error;
        await loadStandaloneOrders();
        toast.success('Dátum odoslania aktualizovaný');
        return;
      }

      // Handle spis orders
      const entry = entries.find(e => e.cisloCP === order.parentSpisId);
      if (!entry || !entry.fullFormData) return;

      const updatedItems = entry.fullFormData.objednavkyItems.map((item: ObjednavkaItem) =>
        item.cisloObjednavky === order.cisloObjednavky ? { ...item, datum: newDate } : item
      );

      const updatedEntry: SpisEntry = {
        ...entry,
        fullFormData: {
          ...entry.fullFormData,
          objednavkyItems: updatedItems
        }
      };

      await updateEntry(updatedEntry);
      toast.success('Dátum odoslania aktualizovaný');
    } catch (error) {
      console.error('Error updating order sent date:', error);
      toast.error('Chyba pri aktualizácii dátumu');
    }
  };

  const handleUpdateOrderPopis = async (order: any, newPopis: string) => {
    try {
      // Handle standalone orders
      if (order.isStandalone) {
        const { error } = await supabase
          .from('standalone_orders')
          .update({ popis: newPopis })
          .eq('id', order.id);
        if (error) throw error;
        await loadStandaloneOrders();
        return;
      }

      // Handle spis orders
      const entry = entries.find(e => e.cisloCP === order.parentSpisId);
      if (!entry || !entry.fullFormData) return;

      const updatedItems = entry.fullFormData.objednavkyItems.map((item: ObjednavkaItem) =>
        item.cisloObjednavky === order.cisloObjednavky ? { ...item, popis: newPopis } : item
      );

      const updatedEntry: SpisEntry = {
        ...entry,
        fullFormData: {
          ...entry.fullFormData,
          objednavkyItems: updatedItems
        }
      };

      await updateEntry(updatedEntry);
    } catch (error) {
      console.error('Error updating order popis:', error);
      toast.error('Chyba pri aktualizácii popisu');
    }
  };

  const handleGeneratePDF = async (order: any) => {
    setIsGeneratingPDF(true);
    try {
      // For standalone orders, we have the data directly
      // For spis orders, we might need to look up entry but puzdraData should be on order anyway
      const puzdraData: PuzdraData = order.puzdraData || {
        dodavatel: { nazov: '', ulica: '', mesto: '', tel: '', email: '', email2: '' },
        zakazka: order.popis || '',
        polozky: [],
        tovarDorucitNaAdresu: { firma: 'WENS door, s.r.o.', ulica: 'Vápenická 12', mesto: 'Prievidza 971 01' },
      };

      const pdfData: OrderPDFData = {
        orderNumber: order.cisloObjednavky,
        nazov: puzdraData.zakazka || order.nazov || '',
        data: puzdraData,
        headerInfo: {
          vypracoval: userName,
          telefon: '',
          email: userEmail
        }
      };

      const blobUrl = await generateOrderPDF(pdfData);
      setPdfPreview({
        url: blobUrl,
        filename: `Objednavka_${order.cisloObjednavky}.pdf`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Chyba pri generovaní PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calculate next order number considering both spis orders and standalone orders
  const getNextOrderNumber = useCallback(() => {
    // Get all order numbers from spis entries
    const spisOrderNumbers = entries.flatMap(entry =>
      (entry.fullFormData?.objednavkyItems || []).map((o: any) => o.cisloObjednavky)
    );
    // Get all order numbers from standalone orders
    const standaloneOrderNumbers = standaloneOrders.map(o => o.cislo_objednavky);

    const allNumbers = [...spisOrderNumbers, ...standaloneOrderNumbers];

    if (allNumbers.length === 0) return '0001';

    const maxNum = Math.max(...allNumbers.map(n => parseInt(n, 10) || 0));
    return (maxNum + 1).toString().padStart(4, '0');
  }, [entries, standaloneOrders]);

  const handleSaveStandaloneOrder = async (puzdraData: PuzdraData) => {
    try {
      const isNewOrder = !editingOrder;
      const isStandalone = editingOrder?.isStandalone ?? true; // New orders are standalone by default
      const parentSpisId = editingOrder?.parentSpisId;

      // CASE 1: New standalone order - save to standalone_orders table
      if (isNewOrder) {
        const orderNumber = getNextOrderNumber();

        const { error } = await supabase
          .from('standalone_orders')
          .insert({
            cislo_objednavky: orderNumber,
            nazov: puzdraData.zakazka || 'Samostatná objednávka',
            vypracoval: userName,
            datum: new Date().toISOString(),
            popis: puzdraData.zakazka || '',
            dorucene: '',
            puzda_data: puzdraData
          });

        if (error) throw error;

        await loadStandaloneOrders();
        toast.success('Objednávka vytvorená');
        setIsAddOrderModalOpen(false);
        setEditingOrder(null);
        return;
      }

      // CASE 2: Editing standalone order - update in standalone_orders table
      if (isStandalone) {
        const { error } = await supabase
          .from('standalone_orders')
          .update({
            nazov: puzdraData.zakazka || 'Samostatná objednávka',
            popis: puzdraData.zakazka || '',
            puzda_data: puzdraData
          })
          .eq('id', editingOrder.order.id);

        if (error) throw error;

        await loadStandaloneOrders();
        toast.success('Objednávka aktualizovaná');
        setIsAddOrderModalOpen(false);
        setEditingOrder(null);
        return;
      }

      // CASE 3: Editing spis order - update in spis entry
      const targetSpis = entries.find(e => e.cisloCP === parentSpisId);
      if (!targetSpis || !targetSpis.fullFormData) {
        toast.error('Nepodarilo sa nájsť spis');
        return;
      }

      const orderNumber = editingOrder.order.cisloObjednavky;
      const newItem: ObjednavkaItem = {
        id: editingOrder.order.id,
        nazov: puzdraData.zakazka || editingOrder.order.nazov,
        vypracoval: editingOrder.order.vypracoval || userName,
        datum: editingOrder.order.datum,
        popis: puzdraData.zakazka || '',
        cisloObjednavky: orderNumber,
        dorucene: editingOrder.order.dorucene || '',
        puzdraData: puzdraData
      };

      const newItems = targetSpis.fullFormData.objednavkyItems.map((item: ObjednavkaItem) =>
        item.cisloObjednavky === orderNumber ? newItem : item
      );

      const updatedEntry: SpisEntry = {
        ...targetSpis,
        fullFormData: {
          ...targetSpis.fullFormData,
          objednavkyItems: newItems
        }
      };

      await updateEntry(updatedEntry);
      toast.success('Objednávka aktualizovaná');
      setIsAddOrderModalOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Chyba pri ukladaní objednávky');
    }
  };

  const tableData = useMemo(() => {
    return [...objednavkyData].sort((a, b) => b.cisloObjednavky.localeCompare(a.cisloObjednavky));
  }, [objednavkyData]);

  const nextOrderNumber = useMemo(() => {
    return getNextOrderNumber();
  }, [getNextOrderNumber]);

  const orderColumns: Column<typeof tableData[0]>[] = [
    {
      key: 'cisloObjednavky',
      label: 'Č. obj.',
      width: '96px',
      render: (val) => (
        <span className="font-medium text-[#e11b28]">
          {val}
        </span>
      )
    },
    { key: 'cisloZakazkyDisplay', label: 'Č. zák.', width: '96px' },
    { key: 'menoZakaznikaDisplay', label: 'Zákazník', width: '120px' },
    { key: 'firmaDisplay', label: 'Dodávateľ', width: '140px' },
    {
      key: 'odoslaneDisplay',
      label: 'Odosl.',
      isDate: true,
      width: '90px',
      render: (val, item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <CustomDatePicker
            value={item.datum || ''}
            onChange={(newDate) => handleUpdateOrderSentDate(item, newDate)}
            placeholder="..."
            compact
            className={`w-full text-xs py-1 ${isDark ? 'bg-transparent text-gray-300 pointer-events-auto' : 'bg-transparent text-gray-800'}`}
          />
        </div>
      )
    },
    {
      key: 'doruceneDisplay',
      label: 'Doruč.',
      isDate: true,
      width: '90px',
      render: (val, item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <CustomDatePicker
            value={item.dorucene || ''}
            onChange={(newDate) => handleUpdateOrderDate(item, newDate)}
            placeholder="..."
            compact
            className={`w-full text-xs py-1 ${isDark ? 'bg-transparent text-gray-300 pointer-events-auto' : 'bg-transparent text-gray-800'}`}
          />
        </div>
      )
    },
    {
      key: 'popisDisplay',
      label: 'Popis',
      render: (val, item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            defaultValue={val}
            onBlur={(e) => {
              if (e.target.value !== val) {
                handleUpdateOrderPopis(item, e.target.value);
              }
            }}
            className={`w-full px-2 py-1 text-xs rounded border ${isDark ? 'bg-transparent text-white border-dark-500' : 'bg-transparent text-gray-800 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-[#e11b28]`}
          />
        </div>
      )
    },
    {
      key: 'akcie',
      label: 'Akcie',
      width: '80px',
      render: (_, item) => (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleGeneratePDF(item)}
            disabled={isGeneratingPDF}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            title="Zobraziť PDF"
          >
            {isGeneratingPDF ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            PDF
          </button>
        </div>
      )
    }
  ];

  // --- Companies (Firmy) Logic ---
  const companies = useMemo(() => {
    const companyMap = new Map<string, Company>();

    products.forEach(product => {
      if (!product.supplier || !product.supplier.trim()) return;

      const existing = companyMap.get(product.supplier);
      if (existing) {
        existing.productCount += 1;
        // Update details if current product has more info
        if (!existing.ulica && product.supplierDetails?.ulica) existing.ulica = product.supplierDetails.ulica;
        if (!existing.mesto && product.supplierDetails?.mesto) existing.mesto = product.supplierDetails.mesto;
        if (!existing.tel && product.supplierDetails?.tel) existing.tel = product.supplierDetails.tel;
        if (!existing.email && product.supplierDetails?.email) existing.email = product.supplierDetails.email;
      } else {
        companyMap.set(product.supplier, {
          name: product.supplier,
          ulica: product.supplierDetails?.ulica || '',
          mesto: product.supplierDetails?.mesto || '',
          tel: product.supplierDetails?.tel || '',
          email: product.supplierDetails?.email || '',
          productCount: 1
        });
      }
    });

    return Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const companyColumns: Column<Company>[] = [
    {
      key: 'name',
      label: 'Názov firmy',
      render: (val) => <span className="font-medium text-[#e11b28]">{val}</span>
    },
    { key: 'ulica', label: 'Ulica' },
    { key: 'mesto', label: 'Mesto' },
    { key: 'tel', label: 'Telefón' },
    { key: 'email', label: 'Email' },
    {
      key: 'productCount',
      label: 'Počet produktov',
      render: (val) => <span className="text-sm text-gray-500">{val}</span>
    }
  ];

  // --- Produkty Logic ---
  // Group products by company (supplier)
  const productsByCompany = useMemo(() => {
    const grouped = new Map<string, Product[]>();

    products.forEach(product => {
      const supplier = product.supplier || 'Bez dodávateľa';
      const existing = grouped.get(supplier);
      if (existing) {
        existing.push(product);
      } else {
        grouped.set(supplier, [product]);
      }
    });

    // Sort companies alphabetically and products within each company by name
    const sortedEntries = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([supplier, prods]) => ({
        supplier,
        products: prods.sort((a, b) => a.name.localeCompare(b.name))
      }));

    return sortedEntries;
  }, [products]);

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

  if (isLoading) {
    return (
      <div className={`min-h-full p-4 flex items-center justify-center ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28]"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title & Tabs */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Objednávky</h1>

        {/* Tabs */}
        <div className={`flex gap-2 p-1 rounded-lg self-start ${isDark ? 'bg-dark-800' : 'bg-gray-200'}`}>
          <button
            onClick={() => setActiveTab('objednavky')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'objednavky'
              ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow'
              : isDark
                ? 'text-gray-300 hover:text-white hover:bg-dark-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
              }`}
          >
            Objednávky
          </button>
          <button
            onClick={() => setActiveTab('produkty')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'produkty'
              ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow'
              : isDark
                ? 'text-gray-300 hover:text-white hover:bg-dark-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
              }`}
          >
            Produkty
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {activeTab === 'objednavky' && (
            <button
              onClick={() => {
                setEditingOrder(null);
                setIsAddOrderModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Pridať objednávku
            </button>
          )}
          {activeTab === 'produkty' && (
            <button
              onClick={() => setIsCreatingProduct(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Pridať produkt
            </button>
          )}
        </div>
      </div>

      {/* --- Objednávky Tab --- */}
      {activeTab === 'objednavky' && (
        <>
          <SortableTable
            columns={orderColumns}
            data={tableData}
            onRowClick={(item) => handleOrderClick(item.rawOrder)}
            rowClassName={(item) =>
              item.isStandalone
                ? isDark
                  ? 'bg-red-900/20 hover:bg-red-900/30'
                  : 'bg-red-50 hover:bg-red-100'
                : ''
            }
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
          {/* Companies Table */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Firmy
            </h2>
            <SortableTable
              columns={companyColumns}
              data={companies}
              onRowClick={(item) => setSelectedCompany(item)}
            />
            {companies.length === 0 && (
              <div className={`text-center py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Žiadne firmy. Firmy sa vytvárajú automaticky z dodávateľov produktov.
              </div>
            )}
          </div>

          {/* Products Table - Grouped by Company */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Produkty
            </h2>
            {products.length === 0 ? (
              <div className={`text-center py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Žiadne uložené produkty. Produkty sa ukladajú automaticky pri vytvorení objednávky.
              </div>
            ) : (
              <div className="space-y-6">
                {productsByCompany.map(({ supplier, products: companyProducts }) => (
                  <div key={supplier}>
                    <h3 className={`text-base font-semibold mb-2 px-2 py-1 rounded ${isDark ? 'text-white bg-dark-700' : 'text-gray-800 bg-gray-100'}`}>
                      {supplier} <span className={`text-sm font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({companyProducts.length})</span>
                    </h3>
                    <SortableTable
                      columns={productColumns}
                      data={companyProducts}
                      onRowClick={(item) => setSelectedProduct(item)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
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

      {/* Product Creation Modal */}
      {isCreatingProduct && (
        <ProductDetailModal
          isOpen={isCreatingProduct}
          onClose={() => setIsCreatingProduct(false)}
          onAdd={addProduct}
        />
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailModal
          isOpen={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
          company={selectedCompany}
        />
      )}

      {/* Add Order Modal for Standalone Orders */}
      {isAddOrderModalOpen && (
        <AddOrderModal
          isOpen={isAddOrderModalOpen}
          onClose={() => {
            setIsAddOrderModalOpen(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveStandaloneOrder}
          vypracoval={userName}
          telefon=""
          email={userEmail}
          editingData={editingOrder?.order?.puzdraData as any}
          orderNumber={editingOrder ? editingOrder.order.cisloObjednavky : nextOrderNumber}
        />
      )}

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PDFPreviewModal
          isOpen={true}
          onClose={() => setPdfPreview(null)}
          pdfUrl={pdfPreview.url}
          filename={pdfPreview.filename}
          isDark={isDark}
        />
      )}

    </div>
  );
};

export default Objednavky;
