import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CenovaPonukaItem } from '../types';

interface PreberaciProtokolTabProps {
  isDark: boolean;
  cenovePonukyItems: CenovaPonukaItem[];
}

export const PreberaciProtokolTab: React.FC<PreberaciProtokolTabProps> = ({
  isDark,
  cenovePonukyItems
}) => {
  // Find the selected (accepted) price offer
  const selectedOffer = cenovePonukyItems.find(item => item.selected);
  const miestoDodavky = (selectedOffer && selectedOffer.typ !== 'puzdra' && 'miestoDodavky' in selectedOffer.data)
    ? (selectedOffer.data as any).miestoDodavky
    : '';

  return (
    <div className="p-4 h-full flex flex-col">
      <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-white border-gray-200'} border`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Preberací protokol
        </h2>

        {selectedOffer ? (
          <div className="space-y-4">
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p><strong>Schválená cenová ponuka:</strong> {selectedOffer.cisloCP}</p>
              <p><strong>Typ:</strong> {selectedOffer.typ === 'dvere' ? 'Dvere' : selectedOffer.typ === 'nabytok' ? 'Nábytok' : selectedOffer.typ === 'schody' ? 'Schody' : 'Púzdra'}</p>
              <p><strong>Cena s DPH:</strong> {selectedOffer.cenaSDPH.toFixed(2)} EUR</p>
            </div>

            {miestoDodavky && (
              <div className="mt-4">
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Miesto dodávky: {miestoDodavky}
                </p>
                <div className="inline-block p-3 bg-white rounded-lg shadow border border-gray-200">
                  <QRCodeSVG
                    value={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(miestoDodavky)}`}
                    size={120}
                  />
                  <div className="text-xs text-center mt-1 text-gray-600">Google Maps</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Žiadna schválená cenová ponuka. Vyberte cenovku v tabe "Cenové ponuky" pre zobrazenie QR kódu.
          </div>
        )}
      </div>
    </div>
  );
};
