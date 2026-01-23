import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { calculateNextOrderNumber } from '../features/Spis/utils/orderNumbering';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user ? `${user.firstName} ${user.lastName}` : '';
  const userEmail = user?.email || '';
  const { entries, isLoading, addEntry, updateEntry } = useSpis();
  const { products, updateProduct, deleteProduct, addProduct } = useProducts();

  // Tab State
  const [activeTab, setActiveTab] = useState<'objednavky' | 'produkty'>('objednavky');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // New states for Standalone Orders
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<{ order: ObjednavkaItem, parentSpisId: string } | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const objednavkyData = useMemo(() => {
    return entries.flatMap(entry => {
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
  }, [entries]);

  const handleOrderClick = (order: any) => {
    // Navigate to Spis page - the highlighting is handled via location state
    if (order.parentSpisId === 'GENERAL') {
      // For general orders, we might want to open them in editing mode directly
      setEditingOrder({ order, parentSpisId: 'GENERAL' });
      setIsAddOrderModalOpen(true);
      return;
    }
    navigate('/spis', { state: { highlightProjectIds: [order.parentSpisId] } });
  };

  const handleUpdateOrderDate = async (order: any, newDate: string) => {
    try {
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

  const handleGeneratePDF = async (order: any) => {
    setIsGeneratingPDF(true);
    try {
      const entry = entries.find(e => e.cisloCP === order.parentSpisId);
      if (!entry || !entry.fullFormData) {
        toast.error('Nepodarilo sa nájsť dáta spisu');
        return;
      }

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

  const handleSaveStandaloneOrder = async (puzdraData: PuzdraData) => {
    try {
      let generalSpis = entries.find(e => e.cisloCP === 'GENERAL');

      if (!generalSpis) {
        // Create GENERAL spis first
        const newSpis: SpisEntry = {
          cisloCP: 'GENERAL',
          cisloZakazky: 'GENERAL',
          stav: 'Zakázka',
          datum: new Date().toISOString(),
          kontaktnaOsoba: 'Všeobecné',
          firma: 'WENS general',
          architekt: '',
          realizator: '',
          popis: 'Kontajner pre samostatné objednávky',
          spracovatel: userName,
          kategoria: 'Všeobecné',
          terminDodania: '',
          color: 'white',
          fullFormData: {
            predmet: 'Všeobecné objednávky',
            cisloZakazky: 'GENERAL',
            stav: 'Zakázka',
            firma: 'WENS general',
            vypracoval: userName,
            kategoria: 'Všeobecné',
            vybavene: false,
            terminDokoncenia: '',
            priezvisko: 'Všeobecné',
            meno: 'Objednávky',
            telefon: '',
            email: '',
            ulica: '',
            ico: '',
            mesto: '',
            psc: '',
            icDph: '',
            dic: '',
            popisProjektu: '',
            fakturaciaTyp: 'Súkromná osoba',
            fakturaciaPriezvisko: '',
            fakturaciaMeno: '',
            fakturaciaAdresa: '',
            popisItems: [],
            cenovePonukyItems: [],
            objednavkyItems: [],
            emailKomu: '',
            emailKomuText: '',
            emailPredmet: '',
            emailText: '',
            emailItems: [],
            meranieItems: [],
            vyrobneVykresy: [],
            fotky: [],
            technickeItems: [],
            odsuhlesenaKS1: '',
            odsuhlesenaKS2: '',
            ochranaDatum: '',
            sprostredkovatel: '',
            provizia: '',
            cena: '',
            zaloha1: '',
            zaloha1Datum: '',
            zaloha2: '',
            zaloha2Datum: '',
            doplatok: '',
            doplatokDatum: '',
            architektonickyPriezvisko: '',
            architektonickeMeno: '',
            architektonickyTelefon: '',
            architektonickyEmail: '',
            architektonickyUlica: '',
            architektonickyIco: '',
            architektonickyMesto: '',
            architektonickyPsc: '',
            architektonickyIcDph: '',
            architektonickyDic: '',
            realizatorPriezvisko: '',
            realizatorMeno: '',
            realizatorTelefon: '',
            realizatorEmail: '',
            realizatorUlica: '',
            realizatorIco: '',
            realizatorMesto: '',
            realizatorPsc: '',
            realizatorIcDph: '',
            realizatorDic: '',
            kontaktnaPriezvisko: '',
            kontaktnaMeno: '',
            kontaktnaTelefon: '',
            kontaktnaEmail: '',
            fakturaciaK10: false
          }
        };
        generalSpis = await addEntry(newSpis);
      }

      if (!generalSpis || !generalSpis.fullFormData) return;

      const isNewOrder = !editingOrder;
      let orderNumber = editingOrder?.order?.cisloObjednavky;

      if (isNewOrder) {
        orderNumber = calculateNextOrderNumber(entries);
      }

      const newItem: ObjednavkaItem = {
        id: editingOrder?.order?.id || crypto.randomUUID(),
        nazov: puzdraData.zakazka || 'Samostatná objednávka',
        vypracoval: userName,
        datum: new Date().toISOString(),
        popis: puzdraData.zakazka || '',
        cisloObjednavky: orderNumber!,
        dorucene: editingOrder?.order?.dorucene || '',
        puzdraData: puzdraData
      };

      let newItems = [...generalSpis.fullFormData.objednavkyItems];
      if (isNewOrder) {
        newItems.push(newItem);
      } else {
        newItems = newItems.map(item => item.cisloObjednavky === orderNumber ? newItem : item);
      }

      const updatedEntry: SpisEntry = {
        ...generalSpis,
        fullFormData: {
          ...generalSpis.fullFormData,
          objednavkyItems: newItems
        }
      };

      await updateEntry(updatedEntry);
      toast.success(isNewOrder ? 'Objednávka vytvorená' : 'Objednávka aktualizovaná');
      setIsAddOrderModalOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error saving standalone order:', error);
      toast.error('Chyba pri ukladaní objednávky');
    }
  };

  const tableData = useMemo(() => {
    return [...objednavkyData].sort((a, b) => b.cisloObjednavky.localeCompare(a.cisloObjednavky));
  }, [objednavkyData]);

  const nextOrderNumber = useMemo(() => {
    return calculateNextOrderNumber(entries);
  }, [entries]);

  const orderColumns: Column<typeof tableData[0]>[] = [
    {
      key: 'cisloObjednavky',
      label: 'Číslo objednávky',
      render: (val) => (
        <span className="font-medium text-[#e11b28]">
          {val}
        </span>
      )
    },
    { key: 'cisloZakazkyDisplay', label: 'Číslo zakázky' },
    { key: 'menoZakaznikaDisplay', label: 'Meno zákazníka' },
    { key: 'firmaDisplay', label: 'Firma' },
    {
      key: 'odoslaneDisplay',
      label: 'Odoslané',
      isDate: true,
      render: (val, item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <CustomDatePicker
            value={item.datum || ''}
            onChange={(newDate) => handleUpdateOrderSentDate(item, newDate)}
            placeholder="Odoslané..."
            compact
            className={`w-28 text-xs ${isDark ? 'bg-dark-700 text-gray-300 pointer-events-auto' : 'bg-white text-gray-800'}`}
          />
        </div>
      )
    },
    {
      key: 'doruceneDisplay',
      label: 'Doručené',
      isDate: true,
      render: (val, item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <CustomDatePicker
            value={item.dorucene || ''}
            onChange={(newDate) => handleUpdateOrderDate(item, newDate)}
            compact
            className={`w-28 text-xs ${isDark ? 'bg-dark-700 text-gray-300 pointer-events-auto' : 'bg-white text-gray-800'}`}
          />
        </div>
      )
    },
    { key: 'popisDisplay', label: 'Popis' },
    {
      key: 'akcie',
      label: 'Akcie',
      render: (_, item) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleGeneratePDF(item)}
            disabled={isGeneratingPDF}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-500 text-blue-400' : 'hover:bg-blue-100 text-blue-600'}`}
            title="Generovať PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
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
              item.parentSpisId === 'GENERAL'
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
