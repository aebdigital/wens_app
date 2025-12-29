import React, { useState } from 'react';
import { generateOrderPDF, OrderPDFData } from '../utils/pdfGenerator';
import { CustomDatePicker } from '../../../components/common/CustomDatePicker';
import { PDFPreviewModal } from '../../../components/common/PDFPreviewModal';

interface ObjednavkyTabProps {
  items: any[];
  onUpdate: (items: any[]) => void;
  isDark: boolean;
  user: any;
  entries: any[];
  selectedOrderIndex: number | null;
  isLocked?: boolean;
  onAddVzor: () => void;
  onEdit?: (item: any) => void;
  headerInfo?: {
    vypracoval: string;
    telefon: string;
    email: string;
  };
}

export const ObjednavkyTab: React.FC<ObjednavkyTabProps> = ({
  items,
  onUpdate,
  isDark,
  user,
  entries,
  selectedOrderIndex,
  isLocked = false,
  onAddVzor,
  onEdit,
  headerInfo
}) => {
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handlePreviewPDF = async (item: any) => {
    if (!item.puzdraData) {
      alert('Táto objednávka nemá dáta na export do PDF.');
      return;
    }

    const itemId = item.id || item.cisloObjednavky || 'temp';
    setIsGenerating(itemId);

    try {
      const pdfData: OrderPDFData = {
        orderNumber: item.cisloObjednavky || item.id || 'N/A',
        nazov: item.nazov,
        data: item.puzdraData,
        headerInfo: headerInfo || {
          vypracoval: item.vypracoval || user?.name || '',
          telefon: user?.telefon || '',
          email: user?.email || ''
        }
      };

      const blobUrl = await generateOrderPDF(pdfData);
      setPdfPreview({
        url: blobUrl,
        filename: `Objednavka_${pdfData.orderNumber}.pdf`
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
    <div className="p-2 h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Názov</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Vytvoril</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Dátum</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Popis</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Číslo objednávky</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Doručené</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              // Check if this is the highlighted order from navigation
              const isHighlighted = selectedOrderIndex === index;
              const itemId = item.id || item.cisloObjednavky || `objednavka-${index}`;

              // Format date for display
              const formatDate = (dateStr: string) => {
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                return date.toLocaleDateString('sk-SK');
              };

              return (
                <tr
                  key={itemId}
                  className={`${isHighlighted ? 'bg-yellow-100 border-yellow-400' : (isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50')} ${onEdit ? 'cursor-pointer' : ''}`}
                  onClick={() => onEdit && onEdit(item)}
                >
                  <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                    {item.nazov || '-'}
                  </td>
                  <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                    {item.vypracoval || '-'}
                  </td>
                  <td className={`border px-3 py-2 ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                    {formatDate(item.datum)}
                  </td>
                  <td className={`border px-1 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={item.popis || ''}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].popis = e.target.value;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      placeholder="Zadajte popis..."
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-dark-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`border px-3 py-2 text-center ${isDark ? 'border-dark-500 text-white' : 'border-gray-300 text-gray-800'}`}>
                    {item.cisloObjednavky || '-'}
                  </td>
                  <td className={`border px-1 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`} onClick={(e) => e.stopPropagation()}>
                    <CustomDatePicker
                      value={item.dorucene || ''}
                      onChange={(val) => {
                        const updated = [...items];
                        updated[index].dorucene = val;
                        onUpdate(updated);
                      }}
                      disabled={isLocked}
                      className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-dark-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isHighlighted ? 'bg-yellow-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}`}
                    />
                  </td>
                  <td className={`border px-2 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewPDF(item);
                        }}
                        disabled={isGenerating === itemId}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors ${isGenerating === itemId ? 'opacity-50' : ''}`}
                        title="Zobraziť PDF"
                      >
                        {isGenerating === itemId ? (
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
                          if (isLocked) return;
                          const updated = items.filter((_, i) => i !== index);
                          onUpdate(updated);
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
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Žiadne objednávky. Kliknite "Pridať objednávku" pre vytvorenie novej.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-start">
        <button
          onClick={onAddVzor}
          disabled={isLocked}
          className={`px-6 py-3 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg text-sm hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pridať objednávku
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
        />
      )}
    </div>
  );
};
