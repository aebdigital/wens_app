import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Product } from '../contexts/ProductsContext';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdate: (id: string, data: Partial<Product>) => void;
  onDelete: (id: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdate,
  onDelete
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Product>(product);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFormData(product);
  }, [product]);

  const handleSave = () => {
    onUpdate(product.id, formData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Naozaj chcete vymazať tento produkt?')) {
        onDelete(product.id);
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
       <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg overflow-hidden`}>
           {/* Header */}
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Detail produktu</h2>
                <button onClick={onClose} className={`p-2 rounded hover:bg-opacity-10 hover:bg-gray-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Názov produktu</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            disabled={!isEditing}
                            className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kód</label>
                        <input
                            type="text"
                            value={formData.kod || ''}
                            onChange={(e) => setFormData({...formData, kod: e.target.value})}
                            disabled={!isEditing}
                            className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                        />
                    </div>
                </div>

                <div className={`p-4 rounded border ${isDark ? 'border-dark-500 bg-dark-750' : 'border-gray-100 bg-gray-50'}`}>
                     <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Dodávateľ</h3>
                     <div className="space-y-3">
                         <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Názov firmy</label>
                            <input
                                type="text"
                                value={formData.supplier}
                                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                                disabled={!isEditing}
                                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ulica</label>
                                <input
                                    type="text"
                                    value={formData.supplierDetails?.ulica || ''}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        supplierDetails: {...(formData.supplierDetails || {}), ulica: e.target.value}
                                    })}
                                    disabled={!isEditing}
                                    className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mesto</label>
                                <input
                                    type="text"
                                    value={formData.supplierDetails?.mesto || ''}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        supplierDetails: {...(formData.supplierDetails || {}), mesto: e.target.value}
                                    })}
                                    disabled={!isEditing}
                                    className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                                />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Telefón</label>
                                <input
                                    type="text"
                                    value={formData.supplierDetails?.tel || ''}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        supplierDetails: {...(formData.supplierDetails || {}), tel: e.target.value}
                                    })}
                                    disabled={!isEditing}
                                    className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                                <input
                                    type="text"
                                    value={formData.supplierDetails?.email || ''}
                                    onChange={(e) => setFormData({
                                        ...formData, 
                                        supplierDetails: {...(formData.supplierDetails || {}), email: e.target.value}
                                    })}
                                    disabled={!isEditing}
                                    className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                                />
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex justify-between ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                {isEditing ? (
                     <button 
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                     >
                        Zmazať produkt
                     </button>
                ) : (
                    <div></div> 
                )}
                
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                             <button 
                                onClick={() => {
                                    setFormData(product);
                                    setIsEditing(false);
                                }}
                                className={`px-4 py-2 rounded text-sm font-medium ${isDark ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                             >
                                Zrušiť
                             </button>
                             <button 
                                onClick={handleSave}
                                className="px-4 py-2 rounded text-sm font-medium bg-[#e11b28] text-white hover:bg-[#c71325]"
                             >
                                Uložiť zmeny
                             </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className={`px-4 py-2 rounded text-sm font-medium ${isDark ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                        >
                            Upraviť
                        </button>
                    )}
                </div>
            </div>
       </div>
    </div>
  );
};
