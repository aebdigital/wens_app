import React, { useState } from 'react';
import { CenovaPonukaItem } from '../types';
import { PDFPreviewModal } from '../../../components/common/PDFPreviewModal';
import { CustomDatePicker } from '../../../components/common/CustomDatePicker';

interface CenovePonukyTabProps {
  items: CenovaPonukaItem[];
  onDelete: (index: number) => void;
  onEdit: (item: CenovaPonukaItem) => void;
  onGeneratePDF: (item: CenovaPonukaItem) => Promise<string>;
  onDownloadPDF?: (item: CenovaPonukaItem) => Promise<void>; // For downloading PDF without QR code
  isDark: boolean;
  isLocked?: boolean;
  onAddVzor: () => void;
  onToggleSelect: (item: CenovaPonukaItem) => void;
  onUpdate: (items: CenovaPonukaItem[]) => void;
  onSave?: () => void;
  predmet?: string;
}

export const CenovePonukyTab: React.FC<CenovePonukyTabProps> = ({
  items,
  onDelete,
  onEdit,
  onGeneratePDF,
  onDownloadPDF,
  isDark,
  isLocked = false,
  onAddVzor,
  onToggleSelect,
  onUpdate,
  onSave,
  predmet = ''
}) => {
  // Helper to get full cisloCP - prepends predmet if cisloCP starts with '-'
  const getFullCisloCP = (cisloCP: string) => {
    if (cisloCP.startsWith('-') && predmet) {
      return predmet + cisloCP;
    }
    return cisloCP;
  };
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string; item: CenovaPonukaItem } | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const handlePreviewPDF = async (item: CenovaPonukaItem) => {
    setIsGenerating(item.id);
    try {
      // Auto-save before generating PDF to ensure data is not empty
      if (onSave) {
        onSave();
        // Small delay to allow save to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      const blobUrl = await onGeneratePDF(item);
      setPdfPreview({
        url: blobUrl,
        filename: `CP_${getFullCisloCP(item.cisloCP)}.pdf`,
        item: item
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Nepodarilo sa vygenerovať PDF');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleClosePreview = () => {
    if (pdfPreview?.url) {
      URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview(null);
  };

  return (
    <div className="p-2 flex flex-col">
      <div className="overflow-x-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Číslo CP</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Typ</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Číslo zakázky</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">CENA</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Odoslané</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Vytvoril</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Popis</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-20">Akcie</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-24">Schválené</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className={`cursor-pointer ${item.selected
                  ? (isDark ? 'bg-red-900/30 hover:bg-red-900/40' : 'bg-red-100 hover:bg-red-200')
                  : (isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50')
                  }`}
                onClick={() => onEdit(item)}
              >
                <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {getFullCisloCP(item.cisloCP)}
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${item.typ === 'dvere'
                    ? 'bg-blue-100 text-blue-800'
                    : item.typ === 'nabytok'
                      ? 'bg-green-100 text-green-800'
                      : item.typ === 'schody'
                        ? 'bg-purple-100 text-purple-800'
                        : item.typ === 'kovanie'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {item.typ === 'dvere' ? 'Dvere' : item.typ === 'nabytok' ? 'Nábytok' : item.typ === 'schody' ? 'Schody' : item.typ === 'kovanie' ? 'Kovanie' : 'Púzdra'}
                  </span>
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={item.cisloZakazky || ''}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = {
                        ...newItems[index],
                        cisloZakazky: e.target.value.replace(/[^a-zA-Z0-9/]/g, '')
                      };
                      onUpdate(newItems);
                    }}
                    disabled={isLocked}
                    placeholder="-"
                    className={`w-full text-xs border-0 bg-transparent px-2 py-1 focus:ring-0 text-center ${isDark ? 'text-white' : 'text-gray-800'} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                </td>
                <td className={`border px-3 py-2 text-right font-bold ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {(() => {
                    const data = item.data as any;
                    let price = item.cenaSDPH;
                    if (data.cenaDohodou && data.cenaDohodouValue != null) {
                      price = data.cenaDohodouValue;
                    } else if (data.prenesenieDP) {
                      price = item.cenaBezDPH;
                    }
                    return price > 0 ? `${price.toFixed(2)} €` : '-';
                  })()}
                </td>
                <td
                  className={`border px-1 py-1 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CustomDatePicker
                    value={item.odoslane}
                    onChange={(date) => {
                      const newItems = [...items];
                      newItems[index] = { ...newItems[index], odoslane: date };
                      onUpdate(newItems);
                    }}
                    disabled={isLocked}
                    compact={true}
                    className={`w-full text-xs border-0 bg-transparent px-2 py-1 focus:ring-0 text-center ${isDark ? 'text-white' : 'text-gray-800'} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    placeholder="-"
                  />
                </td>
                <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                  {item.vytvoril}
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                  <input
                    type="text"
                    value={item.popis}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...newItems[index], popis: e.target.value };
                      onUpdate(newItems);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLocked}
                    className={`w-full text-xs border-0 bg-transparent px-2 py-1 focus:ring-0 ${isDark ? 'text-gray-300' : 'text-gray-600'} ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className={`border px-2 py-2 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewPDF(item);
                      }}
                      disabled={isGenerating === item.id}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors ${isGenerating === item.id ? 'opacity-50' : ''}`}
                      title="Zobraziť PDF"
                    >
                      {isGenerating === item.id ? (
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) setDeleteConfirmIndex(index);
                      }}
                      disabled={isLocked}
                      className={`p-1.5 text-white bg-red-500 hover:bg-red-600 rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Odstrániť"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td
                  className={`border px-3 py-2 text-center cursor-pointer ${isDark ? 'border-dark-500' : 'border-gray-300'} ${isLocked ? 'cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) onToggleSelect(item);
                  }}
                >
                  <input
                    type="radio"
                    checked={item.selected || false}
                    onChange={() => { }}
                    disabled={isLocked}
                    className="cursor-pointer pointer-events-none"
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className={`border px-3 py-8 text-center ${isDark ? 'border-dark-500 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                  Žiadne cenové ponuky. Kliknite na "Pridať cenovú ponuku" pre vytvorenie novej cenovej ponuky.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={onAddVzor}
          disabled={isLocked}
          className={`px-6 py-3 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg text-sm hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pridať cenovú ponuku
        </button>
      </div>

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PDFPreviewModal
          isOpen={true}
          onClose={handleClosePreview}
          pdfUrl={pdfPreview.url}
          filename={pdfPreview.filename}
          isDark={isDark}
          onDownload={onDownloadPDF ? () => onDownloadPDF(pdfPreview.item) : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Vymazať cenovú ponuku</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Naozaj chcete vymazať túto cenovú ponuku?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmIndex(null)}
                className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Zrušiť
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmIndex);
                  setDeleteConfirmIndex(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Vymazať
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
