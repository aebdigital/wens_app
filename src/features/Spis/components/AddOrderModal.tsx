import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useProducts } from '../../../contexts/ProductsContext';
import { PuzdraForm } from './PuzdraForm';
import { PuzdraData } from '../types';
import { generateOrderPDF, OrderPDFData } from '../utils/pdfGenerator';
import { PDFPreviewModal } from '../../../components/common/PDFPreviewModal';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PuzdraData) => void;
  onDelete?: () => void;
  // Props for header info
  vypracoval: string;
  telefon: string;
  email: string;
  // Initial data for editing
  editingData?: PuzdraData;
  isLocked?: boolean;
  orderNumber?: string;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  vypracoval,
  telefon,
  email,
  editingData,
  isLocked = false,
  orderNumber
}) => {
  const { isDark } = useTheme();
  const { addProduct, products } = useProducts();
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state with default values or editing data
  const [orderData, setOrderData] = useState<PuzdraData>(() => {
    if (editingData) {
      return editingData;
    }
    return {
      dodavatel: {
        nazov: '',
        ulica: '',
        mesto: '',
        tel: '',
        email: '',
        email2: '',
      },
      zakazka: '',
      polozky: [
        { id: 1, nazov: '', mnozstvo: 1 },
      ],
      tovarDorucitNaAdresu: {
        firma: 'WENS DOOR s.r.o.',
        ulica: 'Vápenická 12',
        mesto: 'Prievidza 971 01',
      },
    };
  });

  // Update data if editingData changes
  useEffect(() => {
    if (editingData) {
      setOrderData(editingData);
    }
  }, [editingData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save new products
      if (orderData.dodavatel?.nazov) {
        orderData.polozky.forEach(item => {
          if (item.nazov && item.nazov.trim() !== '') {
            addProduct({
              name: item.nazov,
              kod: item.kod, // Save the code
              supplier: orderData.dodavatel.nazov,
              supplierDetails: {
                ulica: orderData.dodavatel.ulica,
                mesto: orderData.dodavatel.mesto,
                tel: orderData.dodavatel.tel,
                email: orderData.dodavatel.email
              }
            });
          }
        });
      }

      await onSave(orderData);
      // Don't close the modal after saving
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Auto-save before generating preview
      if (orderData.dodavatel?.nazov) {
        orderData.polozky.forEach(item => {
          if (item.nazov && item.nazov.trim() !== '') {
            addProduct({
              name: item.nazov,
              kod: item.kod,
              supplier: orderData.dodavatel.nazov,
              supplierDetails: {
                ulica: orderData.dodavatel.ulica,
                mesto: orderData.dodavatel.mesto,
                tel: orderData.dodavatel.tel,
                email: orderData.dodavatel.email
              }
            });
          }
        });
      }
      await onSave(orderData);

      const pdfData: OrderPDFData = {
        orderNumber: orderNumber || 'PREVIEW',
        nazov: orderData.zakazka || '',
        data: orderData,
        headerInfo: {
          vypracoval,
          telefon,
          email
        }
      };

      const blobUrl = await generateOrderPDF(pdfData);
      setPdfPreview({
        url: blobUrl,
        filename: `Objednavka_${orderNumber || 'PREVIEW'}.pdf`
      });
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Nepodarilo sa vygenerovať náhľad PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleClosePdfPreview = () => {
    if (pdfPreview?.url) {
      URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 md:p-4">
      <div
        className={`${isDark ? 'bg-dark-800' : 'bg-gray-100'} rounded-xl shadow-2xl flex flex-col w-full h-full md:w-[95vw] md:h-[90vh] md:max-w-[1400px]`}
      >
        {/* Header with WENS DOOR logo */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <div className="flex items-center gap-8">
            <div className="bg-white rounded-lg p-2 inline-block shadow-sm">
              <img
                src="/logo.png"
                alt="WENS door"
                className="h-8"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              OBJEDNÁVKA <span className="font-semibold">#{orderNumber || '...'}</span>
            </span>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          <PuzdraForm
            data={orderData}
            onChange={setOrderData}
            isDark={isDark}
            headerInfo={{
              vypracoval,
              telefon,
              email
            }}
            availableProducts={products}
          />
        </div>

        {/* Footer buttons */}
        <div className={`flex justify-between px-6 py-4 border-t ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviewPDF}
              disabled={isGeneratingPDF}
              className={`flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors ${isGeneratingPDF ? 'opacity-50' : ''}`}
            >
              {isGeneratingPDF ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
              Náhľad
            </button>
            {editingData && onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Naozaj chcete vymazať túto objednávku?')) {
                    onDelete();
                  }
                }}
                disabled={isLocked}
                className={`text-red-600 hover:text-red-700 font-semibold text-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Zmazať objednávku
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Zrušiť
            </button>
            <button
              onClick={handleSave}
              disabled={isLocked || isSaving}
              className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg font-semibold hover:from-[#c71325] hover:to-[#9e1019] shadow-lg ${isLocked || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving && (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSaving ? 'Ukladám...' : 'Uložiť'}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PDFPreviewModal
          isOpen={true}
          onClose={handleClosePdfPreview}
          pdfUrl={pdfPreview.url}
          filename={pdfPreview.filename}
          isDark={isDark}
        />
      )}
    </div>
  );
};
