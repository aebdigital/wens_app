import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useProducts } from '../../../contexts/ProductsContext';
import { PuzdraForm } from './PuzdraForm';
import { PuzdraData } from '../types';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PuzdraData) => void;
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
  vypracoval,
  telefon,
  email,
  editingData,
  isLocked = false,
  orderNumber
}) => {
  const { isDark } = useTheme();
  const { addProduct, products } = useProducts();

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
        firma: 'WENS door, s.r.o.',
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

  const handleSave = () => {
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

    onSave(orderData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div
        className={`${isDark ? 'bg-dark-800' : 'bg-gray-100'} rounded-xl shadow-2xl flex flex-col`}
        style={{ width: '98vw', height: '95vh', maxWidth: '1800px' }}
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
        <div className={`flex justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Zrušiť
          </button>
          <button
            onClick={handleSave}
            disabled={isLocked}
            className={`px-6 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg font-semibold hover:from-[#c71325] hover:to-[#9e1019] shadow-lg ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Uložiť
          </button>
        </div>
      </div>
    </div>
  );
};
