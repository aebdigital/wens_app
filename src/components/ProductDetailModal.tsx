import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useProducts, Product } from '../contexts/ProductsContext';

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
    onUpdate?: (id: string, data: Partial<Product>) => Promise<void> | void;
    onDelete?: (id: string) => Promise<void> | void;
    onAdd?: (data: Omit<Product, 'id'>) => Promise<void> | void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
    isOpen,
    onClose,
    product,
    onUpdate,
    onDelete,
    onAdd
}) => {
    const { isDark } = useTheme();

    const emptyProduct: Omit<Product, 'id'> = React.useMemo(() => ({
        name: '',
        supplier: '',
        supplierDetails: {
            ulica: '',
            mesto: '',
            tel: '',
            email: ''
        }
    }), []);

    const [formData, setFormData] = useState<Omit<Product, 'id'>>(emptyProduct);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

    const { products } = useProducts();
    const uniqueSuppliers = Array.from(new Set(products.map(p => p.supplier).filter(s => s && s.trim().length > 0))).sort();

    const handleSupplierSelect = (supplierName: string) => {
        const sampleProduct = products.find(p => p.supplier === supplierName);
        const newDetails = sampleProduct?.supplierDetails || {};

        setFormData(prev => ({
            ...prev,
            supplier: supplierName,
            supplierDetails: {
                ulica: newDetails.ulica || prev.supplierDetails?.ulica || '',
                mesto: newDetails.mesto || prev.supplierDetails?.mesto || '',
                tel: newDetails.tel || prev.supplierDetails?.tel || '',
                email: newDetails.email || prev.supplierDetails?.email || ''
            }
        }));
        setShowSupplierDropdown(false);
    };

    const isCreating = !product;

    useEffect(() => {
        if (product) {
            setFormData(product);
            setIsEditing(false);
        } else {
            setFormData(emptyProduct);
            setIsEditing(true); // Always editing when creating
        }
    }, [product, isOpen, emptyProduct]);

    const handleSave = async () => {
        if (!formData.name || !formData.supplier) {
            alert('Vyplňte názov produktu a dodávateľa.');
            return;
        }

        setIsSaving(true);
        try {
            if (isCreating) {
                if (onAdd) {
                    await onAdd(formData);
                    onClose();
                }
            } else {
                if (onUpdate && product) {
                    await onUpdate(product.id, formData);
                    setIsEditing(false);
                }
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Chyba pri ukladaní.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (product && onDelete && window.confirm('Naozaj chcete vymazať tento produkt?')) {
            setIsSaving(true);
            try {
                await onDelete(product.id);
                onClose();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Chyba pri mazaní.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-3xl overflow-hidden`}>
                {/* Header */}
                <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isCreating ? 'Nový produkt' : 'Detail produktu'}
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded hover:bg-opacity-10 hover:bg-gray-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Názov produktu *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing || isSaving}
                                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                                placeholder="Napr. Dvere voštinové"
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kód</label>
                            <input
                                type="text"
                                value={formData.kod || ''}
                                onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                                disabled={!isEditing || isSaving}
                                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                            />
                        </div>
                    </div>

                    <div className={`p-4 rounded border ${isDark ? 'border-dark-500 bg-dark-750' : 'border-gray-100 bg-gray-50'}`}>
                        <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Dodávateľ</h3>
                        <div className="space-y-3">
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Názov firmy *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.supplier}
                                        onChange={(e) => {
                                            setFormData({ ...formData, supplier: e.target.value });
                                            setShowSupplierDropdown(true);
                                        }}
                                        onFocus={() => setShowSupplierDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                                        disabled={!isEditing || isSaving}
                                        className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                                        placeholder="Napr. Hormann"
                                    />
                                    {showSupplierDropdown && isEditing && (formData.supplier || '') === '' && uniqueSuppliers.length > 0 && (
                                        <div className={`absolute z-10 left-0 top-full mt-1 w-full max-h-40 overflow-y-auto rounded shadow-lg border ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-white border-gray-300'}`}>
                                            {uniqueSuppliers.map(supplier => (
                                                <div
                                                    key={supplier}
                                                    onClick={() => handleSupplierSelect(supplier)}
                                                    className={`px-3 py-2 cursor-pointer text-sm ${isDark ? 'hover:bg-dark-700 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                                                >
                                                    {supplier}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showSupplierDropdown && isEditing && (formData.supplier || '') !== '' && (
                                        <div className={`absolute z-10 left-0 top-full mt-1 w-full max-h-40 overflow-y-auto rounded shadow-lg border ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-white border-gray-300'}`}>
                                            {uniqueSuppliers
                                                .filter(s => s.toLowerCase().includes(formData.supplier.toLowerCase()))
                                                .map(supplier => (
                                                    <div
                                                        key={supplier}
                                                        onClick={() => handleSupplierSelect(supplier)}
                                                        className={`px-3 py-2 cursor-pointer text-sm ${isDark ? 'hover:bg-dark-700 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                                                    >
                                                        {supplier}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ulica</label>
                                    <input
                                        type="text"
                                        value={formData.supplierDetails?.ulica || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            supplierDetails: { ...(formData.supplierDetails || {}), ulica: e.target.value }
                                        })}
                                        disabled={!isEditing || isSaving}
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
                                            supplierDetails: { ...(formData.supplierDetails || {}), mesto: e.target.value }
                                        })}
                                        disabled={!isEditing || isSaving}
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
                                            supplierDetails: { ...(formData.supplierDetails || {}), tel: e.target.value }
                                        })}
                                        disabled={!isEditing || isSaving}
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
                                            supplierDetails: { ...(formData.supplierDetails || {}), email: e.target.value }
                                        })}
                                        disabled={!isEditing || isSaving}
                                        className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-between ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    {!isCreating ? (
                        <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
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
                                        if (isCreating) {
                                            onClose();
                                        } else {
                                            setFormData(product as Product);
                                            setIsEditing(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className={`px-4 py-2 rounded text-sm font-medium ${isDark ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} disabled:opacity-50`}
                                >
                                    Zrušiť
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className={`px-4 py-2 rounded text-sm font-medium bg-[#e11b28] text-white hover:bg-[#c71325] flex items-center gap-2 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving && (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {isCreating ? 'Vytvoriť produkt' : 'Uložiť zmeny'}
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
