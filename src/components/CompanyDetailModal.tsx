import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useProducts } from '../contexts/ProductsContext';

interface Company {
    name: string;
    ulica: string;
    mesto: string;
    tel: string;
    email: string;
    productCount: number;
}

interface CompanyDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
    isOpen,
    onClose,
    company
}) => {
    const { isDark } = useTheme();
    const { products, updateProduct, deleteProduct } = useProducts();

    const [formData, setFormData] = useState({
        name: company.name,
        ulica: company.ulica,
        mesto: company.mesto,
        tel: company.tel,
        email: company.email
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Get all products for this company
    const companyProducts = products.filter(p => p.supplier === company.name);

    useEffect(() => {
        setFormData({
            name: company.name,
            ulica: company.ulica,
            mesto: company.mesto,
            tel: company.tel,
            email: company.email
        });
        setIsEditing(false);
    }, [company, isOpen]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Vyplňte názov firmy.');
            return;
        }

        setIsSaving(true);
        try {
            // Update all products that belong to this company
            for (const product of companyProducts) {
                await updateProduct(product.id, {
                    supplier: formData.name,
                    supplierDetails: {
                        ulica: formData.ulica,
                        mesto: formData.mesto,
                        tel: formData.tel,
                        email: formData.email
                    }
                });
            }
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error('Error saving company:', error);
            alert('Chyba pri ukladaní.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Naozaj chcete vymazať firmu "${company.name}" a všetkých ${companyProducts.length} produktov?`)) {
            return;
        }

        setIsSaving(true);
        try {
            // Delete all products from this company
            for (const product of companyProducts) {
                await deleteProduct(product.id);
            }
            onClose();
        } catch (error) {
            console.error('Error deleting company:', error);
            alert('Chyba pri mazaní.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-2xl overflow-hidden`}>
                {/* Header */}
                <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Detail firmy
                    </h2>
                    <button onClick={onClose} className={`p-2 rounded hover:bg-opacity-10 hover:bg-gray-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Názov firmy *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={!isEditing || isSaving}
                            className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ulica</label>
                            <input
                                type="text"
                                value={formData.ulica}
                                onChange={(e) => setFormData({ ...formData, ulica: e.target.value })}
                                disabled={!isEditing || isSaving}
                                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mesto</label>
                            <input
                                type="text"
                                value={formData.mesto}
                                onChange={(e) => setFormData({ ...formData, mesto: e.target.value })}
                                disabled={!isEditing || isSaving}
                                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Telefón</label>
                            <input
                                type="text"
                                value={formData.tel}
                                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                                disabled={!isEditing || isSaving}
                                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                            <input
                                type="text"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing || isSaving}
                                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300'} disabled:opacity-60`}
                            />
                        </div>
                    </div>

                    {/* Products list */}
                    <div className={`p-4 rounded border ${isDark ? 'border-dark-500 bg-dark-750' : 'border-gray-100 bg-gray-50'}`}>
                        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Produkty ({companyProducts.length})
                        </h3>
                        <div className="max-h-32 overflow-y-auto">
                            {companyProducts.length > 0 ? (
                                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {companyProducts.map(p => (
                                        <li key={p.id} className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#e11b28]"></span>
                                            {p.name} {p.kod && <span className="text-xs text-gray-500">({p.kod})</span>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Žiadne produkty</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex justify-between ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    {isEditing ? (
                        <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                        >
                            Zmazať firmu a produkty
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => {
                                        setFormData({
                                            name: company.name,
                                            ulica: company.ulica,
                                            mesto: company.mesto,
                                            tel: company.tel,
                                            email: company.email
                                        });
                                        setIsEditing(false);
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
