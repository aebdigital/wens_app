import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CenovaPonukaItem, PreberaciProtokolData, SpisFormData } from '../types';
import { PDFPreviewModal } from '../../../components/common/PDFPreviewModal';
import { generatePreberaciProtokolPDF } from '../utils/preberaciProtokolPDF';

interface PreberaciProtokolTabProps {
  isDark: boolean;
  cenovePonukyItems: CenovaPonukaItem[];
  data?: PreberaciProtokolData;
  onChange: (data: PreberaciProtokolData) => void;
  formData: SpisFormData;
}

const DEFAULT_ZHOTOVITEL = `Zhotoviteľ:
WENS DOOR s.r.o.
Vápenická 12
971 01 Prievidza
IČO: 36792942
IČ DPH: SK2022396904
zap. v OR OS Trenčín od.Sro, Vl.č. 17931 / R
tel.: 046/542 2057 e-mail.: info@wens.sk`;

const DEFAULT_BANK = `PRIMABANKA Slovensko a.s. č.ú.: 4520001507/3100
IBAN: SK4431000000004520001507,
BIC (SWIFT): LUBASKBX`;

const DEFAULT_AGREEMENT_1 = `Na základe cenovej ponuky číslo: [CP] zhotoviteľ odovzdáva objednávateľovi a objednávateľ prijíma dohodnutý predmet diela.
Dňom prebratia začína plynúť záručná doba.`;

const DEFAULT_AGREEMENT_2 = `V čase odovzdania predmetu diela jeho stav je nový a nepoškodený a objednávateľ toto dielo prijíma s nasledovným vyjadrením:

So zhotovením diela je objednávateľ spokojný, nie je si vedomý žiadnych námietok proti zhotovenému dielu a preto s odovzdaním súhlasí a toto dielo preberá.`;

const DEFAULT_SIG_ZHOTOVITEL = 'Podpis - Zhotoviteľ';
const DEFAULT_SIG_OBJEDNAVATEL = 'Podpis - Objednávateľ';

export const PreberaciProtokolTab: React.FC<PreberaciProtokolTabProps> = ({
  isDark,
  cenovePonukyItems,
  data = {},
  onChange,
  formData
}) => {
  // Find the selected (accepted) price offer
  const selectedOffer = cenovePonukyItems.find(item => item.selected);

  // Defaults from global form data if not locally overridden
  const effectiveMiestoDodavky = data.miestoDodavky ||
    (selectedOffer && selectedOffer.typ !== 'puzdra' && 'miestoDodavky' in selectedOffer.data
      ? (selectedOffer.data as any).miestoDodavky
      : '');

  const effectiveKontaktnaOsoba = data.kontaktnaOsoba ||
    (selectedOffer && selectedOffer.typ !== 'puzdra' && 'kontakt' in selectedOffer.data && (selectedOffer.data as any).kontakt
      ? (selectedOffer.data as any).kontakt
      : `${formData.kontaktnaMeno} ${formData.kontaktnaPriezvisko}`);

  const effectiveMobil = data.mobil || formData.kontaktnaTelefon;

  const effectiveObjednavatelInfo = data.objednavatelInfo || (() => {
    const useBilling = formData.fakturaciaTyp !== 'nepouzit';

    let customerName = `${formData.priezvisko || ''} ${formData.meno || ''}`.trim();
    let customerAddress = `${formData.ulica || ''}\n${formData.psc || ''} ${formData.mesto || ''}`.trim();
    let ico = formData.ico;
    let icDph = formData.icDph;
    let dic = formData.dic;
    let tel = formData.telefon;
    let email = formData.email;

    if (useBilling) {
      const billingName = `${formData.fakturaciaPriezvisko || ''} ${formData.fakturaciaMeno || ''}`.trim();
      if (billingName) customerName = billingName;
      if (formData.fakturaciaAdresa) customerAddress = formData.fakturaciaAdresa;

      // Pull correct business IDs based on source
      if (formData.fakturaciaSource === 'architekt') {
        ico = formData.architektonickyIco;
        icDph = formData.architektonickyIcDph;
        dic = formData.architektonickyDic;
        tel = formData.architektonickyTelefon;
        email = formData.architektonickyEmail;
      } else if (formData.fakturaciaSource === 'realizator') {
        ico = formData.realizatorIco;
        icDph = formData.realizatorIcDph;
        dic = formData.realizatorDic;
        tel = formData.realizatorTelefon;
        email = formData.realizatorEmail;
      }
    }

    const customerContact = [
      ico ? `IČO: ${ico}` : '',
      icDph ? `IČ DPH: ${icDph}` : '',
      dic ? `DIČ: ${dic}` : '',
      tel ? `Mobil: ${tel}` : '',
      email ? `Email: ${email}` : ''
    ].filter(Boolean).join('\n');

    return [
      'Objednávateľ:',
      customerName,
      customerAddress,
      '',
      customerContact
    ].join('\n');
  })();

  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUpdate = (field: keyof PreberaciProtokolData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleGeneratePDF = async () => {
    if (!selectedOffer) return;
    setIsGenerating(true);
    try {
      // Create a merged data object with effective values for the generator
      const pdfData: PreberaciProtokolData = {
        ...data,
        miestoDodavky: effectiveMiestoDodavky,
        kontaktnaOsoba: effectiveKontaktnaOsoba,
        mobil: effectiveMobil,
        predmetDiela: data.predmetDiela || (selectedOffer.typ === 'dvere' ? 'Dodávka a montáž interiérových dverí a zárubní' :
          selectedOffer.typ === 'nabytok' ? 'Dodávka a montáž nábytku' :
            selectedOffer.typ === 'schody' ? 'Dodávka a montáž schodov' :
              selectedOffer.typ === 'kovanie' ? 'Dodávka kovania' : 'Dodávka tovaru'),
        zhotovitelInfo: data.zhotovitelInfo !== undefined ? data.zhotovitelInfo : DEFAULT_ZHOTOVITEL,
        objednavatelInfo: data.objednavatelInfo !== undefined ? data.objednavatelInfo : effectiveObjednavatelInfo,
        bankInfo: data.bankInfo !== undefined ? data.bankInfo : DEFAULT_BANK,
        agreementText1: data.agreementText1 !== undefined ? data.agreementText1 : DEFAULT_AGREEMENT_1.replace('[CP]', selectedOffer.cisloCP),
        agreementText2: data.agreementText2 !== undefined ? data.agreementText2 : DEFAULT_AGREEMENT_2,
        zhotovitelSignatureLabel: data.zhotovitelSignatureLabel !== undefined ? data.zhotovitelSignatureLabel : DEFAULT_SIG_ZHOTOVITEL,
        objednavatelSignatureLabel: data.objednavatelSignatureLabel !== undefined ? data.objednavatelSignatureLabel : DEFAULT_SIG_OBJEDNAVATEL
      };

      const blobUrl = await generatePreberaciProtokolPDF(formData, pdfData);
      setPdfPreview({
        url: blobUrl,
        filename: `Preberaci_Protokol_${selectedOffer.cisloCP}.pdf`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Nepodarilo sa vygenerovať PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClosePreview = () => {
    if (pdfPreview?.url) {
      URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview(null);
  };

  return (
    <div className="p-4 h-full flex flex-col overflow-y-auto">
      <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-white border-gray-200'} border mb-4`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Preberací protokol
        </h2>

        {selectedOffer ? (
          <div className="space-y-6">
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} border-b pb-4 ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
              <p><strong>Schválená cenová ponuka:</strong> {selectedOffer.cisloCP}</p>
              <p><strong>Typ:</strong> {selectedOffer.typ === 'dvere' ? 'Dvere' : selectedOffer.typ === 'nabytok' ? 'Nábytok' : selectedOffer.typ === 'schody' ? 'Schody' : selectedOffer.typ === 'kovanie' ? 'Kovanie' : 'Púzdra'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Kontaktná osoba */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Kontaktná osoba
                </label>
                <input
                  type="text"
                  value={data.kontaktnaOsoba !== undefined ? data.kontaktnaOsoba : effectiveKontaktnaOsoba}
                  onChange={(e) => handleUpdate('kontaktnaOsoba', e.target.value)}
                  placeholder={effectiveKontaktnaOsoba}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>

              {/* Mobil */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Mobil
                </label>
                <input
                  type="text"
                  value={data.mobil !== undefined ? data.mobil : effectiveMobil}
                  onChange={(e) => handleUpdate('mobil', e.target.value)}
                  placeholder={effectiveMobil}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>

              {/* Miesto dodávky */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Miesto dodávky
                </label>
                <input
                  type="text"
                  value={data.miestoDodavky !== undefined ? data.miestoDodavky : effectiveMiestoDodavky}
                  onChange={(e) => handleUpdate('miestoDodavky', e.target.value)}
                  placeholder={effectiveMiestoDodavky}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>

              {/* Predmet diela */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Predmet diela
                </label>
                <input
                  type="text"
                  value={data.predmetDiela || ''}
                  onChange={(e) => handleUpdate('predmetDiela', e.target.value)}
                  placeholder={selectedOffer.typ === 'dvere' ? 'Dodávka a montáž interiérových dverí a zárubní' : 'Dodávka a montáž...'}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>

              {/* Miesto a dátum */}
              <div className="md:col-span-4">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Miesto a dátum (na podpis)
                </label>
                <input
                  type="text"
                  value={data.miestoDatum || ''}
                  onChange={(e) => handleUpdate('miestoDatum', e.target.value)}
                  placeholder="napr. Prievidza, 12.01.2024"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>

              {/* Zhotoviteľ Info */}
              <div className="md:col-span-2">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Zhotoviteľ (údaje firmy)
                </label>
                <textarea
                  rows={6}
                  value={data.zhotovitelInfo !== undefined ? data.zhotovitelInfo : DEFAULT_ZHOTOVITEL}
                  onChange={(e) => handleUpdate('zhotovitelInfo', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm notranslate ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                  translate="no"
                />
              </div>

              {/* Objednávateľ Info */}
              <div className="md:col-span-2">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Objednávateľ (údaje klienta)
                </label>
                <textarea
                  rows={6}
                  value={data.objednavatelInfo !== undefined ? data.objednavatelInfo : effectiveObjednavatelInfo}
                  onChange={(e) => handleUpdate('objednavatelInfo', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>

              {/* Bank Info */}
              <div className="md:col-span-4">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Bankové spojenie
                </label>
                <textarea
                  rows={3}
                  value={data.bankInfo !== undefined ? data.bankInfo : DEFAULT_BANK}
                  onChange={(e) => handleUpdate('bankInfo', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm notranslate ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                  translate="no"
                />
              </div>

              {/* Agreement Text 1 */}
              <div className="md:col-span-4">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Text dohody 1 (Cenová ponuka)
                </label>
                <textarea
                  rows={3}
                  value={data.agreementText1 !== undefined ? data.agreementText1 : (selectedOffer ? DEFAULT_AGREEMENT_1.replace('[CP]', selectedOffer.cisloCP) : '')}
                  onChange={(e) => handleUpdate('agreementText1', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>

              {/* Agreement Text 2 */}
              <div className="md:col-span-4">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Text dohody 2 (Prebratie)
                </label>
                <textarea
                  rows={6}
                  value={data.agreementText2 !== undefined ? data.agreementText2 : DEFAULT_AGREEMENT_2}
                  onChange={(e) => handleUpdate('agreementText2', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-dark-600 border-dark-500 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-1 focus:ring-[#e11b28] focus:border-[#e11b28]`}
                />
              </div>


            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg text-sm font-semibold shadow hover:shadow-md transition-all ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generujem...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Náhľad PDF
                  </>
                )}
              </button>
            </div>

            {effectiveMiestoDodavky && (
              <div className="mt-4 border-t pt-4 border-dashed border-gray-300 dark:border-gray-600">
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  QR Kód miesta dodávky
                </p>
                <div className="inline-block p-3 bg-white rounded-lg shadow border border-gray-200">
                  <QRCodeSVG
                    value={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(effectiveMiestoDodavky)}`}
                    size={100}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Žiadna schválená cenová ponuka. Vyberte cenovku v tabe "Cenové ponuky" pre vytvorenie protokolu.
          </div>
        )}
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
