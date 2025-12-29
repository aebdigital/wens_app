import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { DvereForm } from './DvereForm';
import { NabytokForm } from './NabytokForm';
import { SchodyForm } from './SchodyForm';
import { PuzdraForm } from './PuzdraForm';
import { DvereData, NabytokData, SchodyData, PuzdraData, CenovaPonukaItem } from '../types';
import { generatePDF } from '../utils/pdfGenerator';
import { PDFPreviewModal } from '../../../components/common/PDFPreviewModal';
import { calculateDvereTotals, calculateNabytokTotals, calculateSchodyTotals } from '../utils/priceCalculations';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: 'dvere' | 'nabytok' | 'schody' | 'puzdra', data: any) => void;
  initialTab?: 'dvere' | 'nabytok' | 'schody' | 'puzdra';
  // Props for header info
  firma: string;
  priezvisko: string;
  meno: string;
  ulica: string;
  mesto: string;
  psc: string;
  telefon: string;
  email: string;
  vypracoval: string;
  predmet: string;
  fullCisloCP?: string;
  creatorPhone?: string;
  creatorEmail?: string;
  architectInfo?: {
    priezvisko: string;
    meno: string;
    firma: string;
    ulica: string;
    mesto: string;
    psc: string;
    telefon: string;
    email: string;
  };
  // Initial data for editing
  editingData?: {
    type: 'dvere' | 'nabytok' | 'schody' | 'puzdra';
    data: any;
  };
  visibleTabs?: ('dvere' | 'nabytok' | 'schody' | 'puzdra')[];
  isLocked?: boolean;
}

export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTab = 'dvere',
  firma,
  priezvisko,
  meno,
  ulica,
  mesto,
  psc,
  telefon,
  email,
  vypracoval,
  predmet,
  fullCisloCP,
  creatorPhone,
  creatorEmail,
  architectInfo,
  editingData,
  visibleTabs = ['dvere', 'nabytok', 'schody', 'puzdra'],
  isLocked = false
}) => {
  const { isDark } = useTheme();
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ensure initialTab is valid within visibleTabs
  const validInitialTab = visibleTabs.includes(initialTab) ? initialTab : visibleTabs[0];
  const [activeTab, setActiveTab] = useState<'dvere' | 'nabytok' | 'schody' | 'puzdra'>(validInitialTab);

  // Initialize state with default values or editing data
  const [dvereData, setDvereData] = useState<DvereData>(() => {
    if (editingData?.type === 'dvere' && editingData.data) {
      return editingData.data;
    }
    return {
      popisVyrobkov: '',
      dvereTyp: 'bezfalcové, séria C1-plné, dyha dub bielený, kresba dyhy vertikálne',
      zarubnaTyp: 'obložková, spoj „T", dyha dub bielený',
      specifications: [
        { id: 1, type: 'dvere', value: 'bezfalcové, séria C1-plné, dyha dub bielený, kresba dyhy vertikálne' },
        { id: 2, type: 'zarubna', value: 'obložková, spoj „T", dyha dub bielený' }
      ],
      productPhotos: [],
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: Array(1).fill(null).map((_, i) => ({
        id: i + 1,
        miestnost: i === 0 ? 'Izba' : '',
        dvereTypRozmer: 'Séria C1',
        dvereOtvor: 'otvor 2020x880x150',
        pL: 'P dnu',
        zamok: 'BB',
        sklo: 'matné',
        povrch: '9003',
        poznamkaDvere: '',
        poznamkaZarubna: 'dub bielený/T',
        poznamkaObklad: '',
        ks: 1,
        ksZarubna: 1,
        ksObklad: 0,
        cenaDvere: 380,
        cenaZarubna: 310,
        cenaObklad: 0,
        typObklad: '', // For Obklad input
        hasDvere: true,
        hasZarubna: true,
        hasObklad: false,
      })),
      priplatky: [
        { id: 1, nazov: 'dyha dub bielený + 15%', ks: 1, cenaKs: 828, cenaCelkom: 828 },
      ],
      zlavaPercent: 15,
      kovanie: [
        { id: 1, nazov: 'pánt Tectus 3D (zkrát dvere) + úprava dverí a zárubní na bezfalcové prevedenie', ks: 1, cenaKs: 55, cenaCelkom: 55 },
      ],
      montaz: [
        { id: 1, nazov: '1 krídlové bezfalcové dvere', ks: 1, cenaKs: 95, cenaCelkom: 95 },
      ],
      montazPoznamka: 'Neumožnená kompletná montáž z dôvodu nepripravenosti stavby, bude spoplatnená dopravou!',
      platnostPonuky: '1 mesiac od vypracovania',
      miestoDodavky: 'Bratislava',
      zameranie: '',
      terminDodania: '6-8 týždňov od prijatia zálohy na náš účet a upresnení všetkých detailov a zmien zo strany objednávateľa.',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10,
    };
  });

  const [nabytokData, setNabytokData] = useState<NabytokData>(() => {
    if (editingData?.type === 'nabytok' && editingData.data) {
      return editingData.data;
    }
    return {
      popisVyrobkov: '',
      vyrobkyTyp: 'Stupeň',
      vyrobkyPopis: 'neviditeľný spoj, DTD + dyhy dub prírodný',
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: Array(1).fill(null).map((_, i) => ({
        id: i + 1,
        nazov: i === 0 ? 'stupeň' : '',
        rozmer: i === 0 ? '1000x280x40' : '',
        material: i < 3 ? 'DTD - dyha dub prírodný' : '',
        poznamka: '',
        ks: i < 3 ? 1 : 0,
        cenaKs: i === 0 ? 89 : 0,
        cenaCelkom: i === 0 ? 89 : 0,
      })),
      priplatky: [
        { id: 1, nazov: 'dyha dub prírodný + 5%', ks: 1, cenaKs: 16.35, cenaCelkom: 16.35 },
      ],
      zlavaPercent: 5,
      kovanie: [
        { id: 1, nazov: 'montážny materiál', ks: 1, cenaKs: 255, cenaCelkom: 255 },
      ],
      montaz: [
        { id: 1, nazov: 'montáž + doprava', ks: 1, cenaKs: 748, cenaCelkom: 748 },
      ],
      platnostPonuky: '1 mesiac od vypracovania',
      miestoDodavky: 'Bratislava',
      zameranie: '',
      terminDodania: '6-8 týždňov od prijatia zálohy na náš účet a upresnení všetkých detailov a zmien zo strany objednávateľa.',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10,
    };
  });

  const [schodyData, setSchodyData] = useState<SchodyData>(() => {
    if (editingData?.type === 'schody' && editingData.data) {
      return editingData.data;
    }
    return {
      popisVyrobkov: '',
      vyrobkyTyp: 'Stupeň',
      vyrobkyPopis: 'neviditeľný spoj, DTD + dyhy dub prírodný',
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: Array(1).fill(null).map((_, i) => ({
        id: i + 1,
        nazov: i === 0 ? 'stupeň' : '',
        rozmer: i === 0 ? '1000x280x40' : '',
        material: i < 3 ? 'DTD - dyha dub prírodný' : '',
        poznamka: '',
        ks: i < 3 ? 1 : 0,
        cenaKs: i === 0 ? 89 : 0,
        cenaCelkom: i === 0 ? 89 : 0,
      })),
      priplatky: [
        { id: 1, nazov: 'dyha dub prírodný + 5%', ks: 1, cenaKs: 16.35, cenaCelkom: 16.35 },
      ],
      zlavaPercent: 5,
      kovanie: [
        { id: 1, nazov: 'montážny materiál', ks: 1, cenaKs: 255, cenaCelkom: 255 },
      ],
      montaz: [
        { id: 1, nazov: 'montáž + doprava', ks: 1, cenaKs: 748, cenaCelkom: 748 },
      ],
      platnostPonuky: '1 mesiac od vypracovania',
      miestoDodavky: 'Bratislava',
      zameranie: '',
      terminDodania: '6-8 týždňov od prijatia zálohy na náš účet a upresnení všetkých detailov a zmien zo strany objednávateľa.',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10,
    };
  });

  const [puzdraData, setPuzdraData] = useState<PuzdraData>(() => {
    if (editingData?.type === 'puzdra' && editingData.data) {
      return editingData.data;
    }
    return {
      dodavatel: {
        nazov: 'ECLISSE Slovakia s.r.o.',
        ulica: 'Zvolenská cesta 23',
        mesto: 'Banská Bystrica 974 05',
        tel: '048 / 416 07 00',
        email: 'eclisse@eclisse.sk',
        email2: 'roman.pecnik@eclisse.sk',
      },
      zakazka: '',
      polozky: [
        { id: 1, nazov: '1.Puzdro SYNTESIS LINE do murovanej steny- jednokrídlo, H1-celková výška puzdra =2160mm, A=1015mm, C= 2215mm, hr.125mm pre celosklenené dvere', mnozstvo: 2 },
      ],
      tovarDorucitNaAdresu: {
        firma: 'WENS door, s.r.o.',
        ulica: 'Vápenická 12',
        mesto: 'Prievidza 971 01',
      },
    };
  });

  // Update active tab and form data if editing data changes
  useEffect(() => {
    if (editingData?.type) {
      setActiveTab(editingData.type);
      // Update the corresponding form data when editing
      if (editingData.type === 'dvere' && editingData.data) {
        setDvereData(editingData.data);
      } else if (editingData.type === 'nabytok' && editingData.data) {
        setNabytokData(editingData.data);
      } else if (editingData.type === 'schody' && editingData.data) {
        setSchodyData(editingData.data);
      } else if (editingData.type === 'puzdra' && editingData.data) {
        setPuzdraData(editingData.data);
      }
    }
  }, [editingData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let dataToSave;
      if (activeTab === 'dvere') dataToSave = dvereData;
      else if (activeTab === 'nabytok') dataToSave = nabytokData;
      else if (activeTab === 'schody') dataToSave = schodyData;
      else dataToSave = puzdraData;

      await onSave(activeTab, dataToSave);
      // Don't close the modal after saving
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      let dataToPreview;
      let totals;

      if (activeTab === 'dvere') {
        dataToPreview = dvereData;
        totals = calculateDvereTotals(dvereData);
      } else if (activeTab === 'nabytok') {
        dataToPreview = nabytokData;
        totals = calculateNabytokTotals(nabytokData);
      } else if (activeTab === 'schody') {
        dataToPreview = schodyData;
        totals = calculateSchodyTotals(schodyData);
      } else {
        // Puzdra type doesn't have a standard PDF
        alert('Náhľad PDF nie je dostupný pre typ Púzdra');
        setIsGeneratingPDF(false);
        return;
      }

      // Auto-save before generating preview
      await onSave(activeTab, dataToPreview);

      // Create a temporary CenovaPonukaItem for PDF generation
      const tempItem: CenovaPonukaItem = {
        id: 'preview',
        cisloCP: fullCisloCP || predmet || 'PREVIEW',
        typ: activeTab,
        verzia: '1',
        cenaBezDPH: totals.cenaBezDPH,
        cenaSDPH: totals.cenaSDPH,
        odoslane: '',
        vytvoril: vypracoval,
        popis: '',
        data: dataToPreview
      };

      const headerInfo = {
        customer: {
          firma: firma,
          meno: meno,
          priezvisko: priezvisko,
          ulica,
          mesto,
          psc,
          telefon,
          email,
        },
        architect: architectInfo,
        vypracoval,
        telefon: creatorPhone || '',
        email: creatorEmail || ''
      };

      // Create minimal formData for PDF generation
      const formData = {
        predmet: predmet || '',
        cisloZakazky: '',
        odsuhlesenaKS1: '',
        odsuhlesenaKS2: '',
        ochranaDatum: '',
        ochranaText: '',
        firma: firma,
        ico: '',
        dic: '',
        ulica: ulica,
        mesto: mesto,
        psc: psc,
        telefon: telefon,
        email: email,
        priezvisko: priezvisko,
        meno: meno,
        architekt: '',
        stavba: '',
        stav: '',
        datum: new Date().toISOString().split('T')[0],
        zakaznikTyp: 'zakaznik' as const,
        poznamky: '',
        cenovePonuky: [],
        objednavky: [],
        emaily: [],
        merania: [],
        fotky: [],
        vyrobneVykresy: [],
        technickeVykresy: [],
        fullFormData: {}
      };

      const blobUrl = await generatePDF(tempItem, formData as any, headerInfo);
      setPdfPreview({
        url: blobUrl,
        filename: `CP_${fullCisloCP || predmet || 'PREVIEW'}.pdf`
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
        {/* Header with WENS DOOR logo and tabs */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <div className="flex items-center gap-8">
            <div className="bg-white rounded-lg p-2 inline-block shadow-sm">
              <img
                src="/logo.png"
                alt="WENS door"
                className="h-8"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2">
              {(editingData || visibleTabs.length > 1
                ? (editingData ? [activeTab] : visibleTabs)
                : [] // If only one visible tab and not editing, don't show tab buttons
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow-lg'
                      : isDark
                      ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab === 'dvere' ? 'Dvere' : tab === 'nabytok' ? 'Nábytok' : tab === 'schody' ? 'Schody' : 'Púzdra'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>
              Cenová ponuka č.: <span className="font-semibold">{fullCisloCP || predmet}</span>
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
          {activeTab === 'dvere' && (
            <DvereForm 
              data={dvereData} 
              onChange={setDvereData} 
              isDark={isDark}
              headerInfo={{
                customer: {
                  firma: firma,
                  meno: meno,
                  priezvisko: priezvisko,
                  ulica,
                  mesto,
                  psc,
                  telefon,
                  email,
                },
                architect: architectInfo,
                vypracoval,
                telefon: creatorPhone || '',
                email: creatorEmail || ''
              }}
            />
          )}
          {activeTab === 'nabytok' && (
            <NabytokForm
              data={nabytokData}
              onChange={setNabytokData}
              isDark={isDark}
              headerInfo={{
                customer: {
                  firma: firma,
                  meno: meno,
                  priezvisko: priezvisko,
                  ulica,
                  mesto,
                  psc,
                  telefon,
                  email,
                },
                architect: architectInfo,
                vypracoval,
                telefon: creatorPhone || '',
                email: creatorEmail || ''
              }}
            />
          )}
          {activeTab === 'schody' && (
            <SchodyForm
              data={schodyData}
              onChange={setSchodyData}
              isDark={isDark}
              headerInfo={{
                customer: {
                  firma: firma,
                  meno: meno,
                  priezvisko: priezvisko,
                  ulica,
                  mesto,
                  psc,
                  telefon,
                  email,
                },
                architect: architectInfo,
                vypracoval,
                telefon: creatorPhone || '',
                email: creatorEmail || ''
              }}
            />
          )}
          {activeTab === 'puzdra' && (
            <PuzdraForm 
              data={puzdraData} 
              onChange={setPuzdraData} 
              isDark={isDark}
              headerInfo={{
                vypracoval,
                telefon,
                email
              }}
            />
          )}
        </div>

        {/* Footer buttons */}
        <div className={`flex justify-between px-6 py-4 border-t ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <div>
            {activeTab !== 'puzdra' && (
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
                Náhľad PDF
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
