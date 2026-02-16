import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { DvereForm } from './DvereForm';
import { NabytokForm } from './NabytokForm';
import { SchodyForm } from './SchodyForm';
import { KovanieForm } from './KovanieForm';
import { PuzdraForm } from './PuzdraForm';
import { DvereData, NabytokData, SchodyData, KovanieData, PuzdraData, CenovaPonukaItem } from '../types';
import { generatePDF, generateAndSavePDF } from '../utils/pdfGenerator';
import { PDFPreviewModal } from '../../../components/common/PDFPreviewModal';
import { calculateDvereTotals, calculateNabytokTotals, calculateSchodyTotals, calculateKovanieTotals } from '../utils/priceCalculations';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: 'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra', data: any) => void;
  onSaveAsNew?: (type: 'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra', data: any, options?: { forceNewVersion?: boolean }) => void;
  initialTab?: 'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra';
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
  ico: string;
  dic: string;
  icDph: string;
  fullCisloCP?: string;
  cisloZakazky?: string;
  onCisloZakazkyChange?: (value: string) => void;
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
    ico?: string;
    dic?: string;
    icDph?: string;
  };
  billingInfo?: {
    priezvisko: string;
    meno: string;
    adresa: string;
    ico: string;
    dic: string;
    icDph: string;
    telefon: string;
    email: string;
  };
  // Initial data for editing
  editingData?: {
    type: 'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra';
    data: any;
    cisloZakazky?: string;
  };
  visibleTabs?: ('dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra')[];
  isLocked?: boolean;
  isEditing?: boolean;
  activeSource?: string;
  onRefreshBilling?: () => void;
}

export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveAsNew,
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
  ico,
  dic,
  icDph,
  fullCisloCP,
  cisloZakazky = '',
  onCisloZakazkyChange,
  creatorPhone,
  creatorEmail,
  architectInfo,
  billingInfo,
  editingData,
  visibleTabs = ['dvere', 'nabytok', 'schody', 'kovanie', 'puzdra'],
  isLocked = false,
  isEditing = false,
  activeSource
}) => {
  const { isDark } = useTheme();
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string; tempItem: CenovaPonukaItem; formData: any; headerInfo: any } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local cisloZakazky for this specific price offer (not shared globally)
  const [localCisloZakazky, setLocalCisloZakazky] = useState<string>(() => {
    // Initialize from editingData if available (the item's own cisloZakazky)
    return editingData?.cisloZakazky || '';
  });

  // Helper to get full cisloCP - prepends predmet if fullCisloCP starts with '-'
  const getDisplayCisloCP = () => {
    if (fullCisloCP?.startsWith('-') && predmet) {
      return predmet + fullCisloCP;
    }
    return fullCisloCP || predmet;
  };

  // Helper to migrate legacy data structures to new format
  const migrateDvereData = (data: any): DvereData => {
    // defaults from initial state
    const defaults = {
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
      showFooter: true,
      montaznePrace: false,
      zameraniePoplatok: false,
      dopravaPoplatok: false,
      vynesenieTovaru: false,
      likvidaciaOdpadu: false,
      terminDodania: '6-8 týždňov',
      splatnost: '14 dní',
      zaruka: '24 mesiacov',
      platnostPonuky: '30 dní',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10,
      mena: 'EUR',
      zlava: 0,
      tovarDorucitNaAdresu: {
        firma: 'WENS door, s.r.o.',
        ulica: 'Vápenická 12',
        mesto: 'Prievidza 971 01',
      },
      vyrobky: [],
      priplatky: [],
      kovanie: [],
      montaz: [],
    };

    // Merge saved data with defaults
    // saved data takes precedence, but if a field is missing in saved, we use default
    const baseData = {
      ...defaults, // Apply all defaults first
      ...data,    // Then apply saved data

      // Ensure specific nested objects/arrays are safe even if data has them as undefined/null
      specifications: data.specifications || defaults.specifications,
      productPhotos: data.productPhotos || defaults.productPhotos,
      vyrobky: data.vyrobky || defaults.vyrobky,
      priplatky: data.priplatky || defaults.priplatky,
      kovanie: data.kovanie || defaults.kovanie,
      montaz: data.montaz || defaults.montaz,
      // Only set deposits if source data actually has them - otherwise leave undefined
      // so QuoteFooter falls back to legacy platba1/2/3Percent (60/30/10)
      ...(data.deposits !== undefined ? { deposits: data.deposits } : {}),
      tovarDorucitNaAdresu: {
        ...defaults.tovarDorucitNaAdresu,
        ...(data.tovarDorucitNaAdresu || {})
      }
    };

    // Migrate legacy dvereTyp/zarubnaTyp to specifications if specifications are empty AND we used the default empty array (or original was empty)
    // Actually, if we used defaults.specifications above, it already has the 2 default items.
    // However, if the SAVED data had dvereTyp but NO specifications, we want to capture that specific dvereTyp from saved data,
    // not the default 'dub bielený'.

    // Check if we should override the default specifications with legacy types from data
    const hasLegacyTypes = data.dvereTyp || data.zarubnaTyp;
    const hasNoSavedSpecs = !data.specifications || data.specifications.length === 0;

    if (hasLegacyTypes && hasNoSavedSpecs) {
      baseData.specifications = []; // Clear defaults to start fresh from legacy
      if (data.dvereTyp) {
        baseData.specifications.push({ id: 1, type: 'dvere', value: data.dvereTyp });
      }
      if (data.zarubnaTyp) {
        baseData.specifications.push({ id: 2, type: 'zarubna', value: data.zarubnaTyp });
      }
    }

    return baseData;
  };

  const migrateNabytokData = (data: any): NabytokData => {
    const defaults = {
      popisVyrobkov: '',
      vyrobkyTyp: 'Skrinka',
      vyrobkyPopis: 'DTD laminát biela, ABS hrana 2mm',
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: [],
      priplatky: [],
      zlavaPercent: 5,
      kovanie: [],
      montaz: [],
      platnostPonuky: '1 mesiac od vypracovania',
      miestoDodavky: 'Bratislava',
      zameranie: '',
      terminDodania: '6-8 týždňov od prijatia zálohy na náš účet a upresnení všetkých detailov a zmien zo strany objednávateľa.',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10,
    };

    return {
      ...defaults,
      ...data,
      vyrobky: data.vyrobky || defaults.vyrobky,
      priplatky: data.priplatky || defaults.priplatky,
      kovanie: data.kovanie || defaults.kovanie,
      montaz: data.montaz || defaults.montaz,
      ...(data.deposits !== undefined ? { deposits: data.deposits } : {}),
    };
  };

  const migrateSchodyData = (data: any): SchodyData => {
    const defaults = {
      popisVyrobkov: '',
      vyrobkyTyp: 'Stupeň',
      vyrobkyPopis: 'neviditeľný spoj, DTD + dyhy dub prírodný',
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: [],
      priplatky: [],
      zlavaPercent: 5,
      kovanie: [],
      montaz: [],
      platnostPonuky: '1 mesiac od vypracovania',
      miestoDodavky: 'Bratislava',
      zameranie: '',
      terminDodania: '6-8 týždňov od prijatia zálohy na náš účet a upresnení všetkých detailov a zmien zo strany objednávateľa.',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10,
    };

    return {
      ...defaults,
      ...data,
      vyrobky: data.vyrobky || defaults.vyrobky,
      priplatky: data.priplatky || defaults.priplatky,
      kovanie: data.kovanie || defaults.kovanie,
      montaz: data.montaz || defaults.montaz,
      ...(data.deposits !== undefined ? { deposits: data.deposits } : {}),
    };
  };

  const migrateKovanieData = (data: any): KovanieData => {
    const defaults = {
      popisVyrobkov: '',
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: [],
      priplatky: [],
      kovanie: [],
      zlavaPercent: 0,
      montaz: [],
      montazLabel: '',
      platnostPonuky: '1 mesiac od vypracovania',
      miestoDodavky: 'Bratislava',
      zameranie: '',
      terminDodania: '6-8 týždňov od prijatia zálohy na náš účet a upresnení všetkých detailov a zmien zo strany objednávateľa.',
      platba1Percent: 60,
      platba2Percent: 30,
      platba3Percent: 10,
    };

    return {
      ...defaults,
      ...data,
      vyrobky: data.vyrobky || defaults.vyrobky,
      priplatky: data.priplatky || defaults.priplatky,
      kovanie: data.kovanie || defaults.kovanie,
      montaz: data.montaz || defaults.montaz,
      ...(data.deposits !== undefined ? { deposits: data.deposits } : {}),
    };
  };

  // Ensure initialTab is valid within visibleTabs
  const validInitialTab = (visibleTabs.includes(initialTab as any) ? initialTab : visibleTabs[0]) as any;
  const [activeTab, setActiveTab] = useState<'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra'>(validInitialTab);

  // Initialize state with default values or editing data
  const [dvereData, setDvereData] = useState<DvereData>(() => {
    if (editingData?.type === 'dvere' && editingData.data) {
      return migrateDvereData(editingData.data);
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
        miestnost: '',
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
        { id: 2, nazov: 'spoj „T"', ks: 1, cenaKs: 1, cenaCelkom: 1 },
      ],
      zlavaPercent: 15,
      kovanie: [
        { id: 1, nazov: 'pánt Tectus 3D (zkrát dvere) + úprava dverí a zárubní na bezfalcové prevedenie', ks: 1, cenaKs: 55, cenaCelkom: 55 },
        { id: 2, nazov: 'upevňovací segment', ks: 1, cenaKs: 15, cenaCelkom: 15 },
        { id: 3, nazov: 'kľučky - doplniť - upresniť  typ kľučiek a mušlí je nutné upresniť do 7 dní od potvrdenia objednávky.', ks: 1, cenaKs: 0, cenaCelkom: 0 },
      ],
      montaz: [
        { id: 1, nazov: '1 krídlové bezfalcové dvere', ks: 1, cenaKs: 95, cenaCelkom: 95 },
        { id: 2, nazov: 'montáž kľučky', ks: 1, cenaKs: 10, cenaCelkom: 10 },
        { id: 3, nazov: 'vynášanie – doceniť po obhliadke', ks: 1, cenaKs: 0, cenaCelkom: 0 },
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
      return migrateNabytokData(editingData.data);
    }
    return {
      popisVyrobkov: '',
      vyrobkyTyp: 'Skrinka',
      vyrobkyPopis: 'DTD laminát biela, ABS hrana 2mm',
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: Array(1).fill(null).map((_, i) => ({
        id: i + 1,
        nazov: i === 0 ? 'skrinka' : '',
        rozmer: i === 0 ? '800x600x400' : '',
        material: i < 3 ? 'DTD laminát biela' : '',
        poznamka: '',
        ks: i < 3 ? 1 : 0,
        cenaKs: i === 0 ? 150 : 0,
        cenaCelkom: i === 0 ? 150 : 0,
      })),
      priplatky: [
        { id: 1, nazov: 'ABS hrana 2mm', ks: 1, cenaKs: 25, cenaCelkom: 25 },
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
      return migrateSchodyData(editingData.data);
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

  const [kovanieData, setKovanieData] = useState<KovanieData>(() => {
    if (editingData?.type === 'kovanie' && editingData.data) {
      return migrateKovanieData(editingData.data);
    }
    return {
      popisVyrobkov: '',
      showCustomerInfo: true,
      showArchitectInfo: false,
      vyrobky: Array(1).fill(null).map((_, i) => ({
        id: i + 1,
        nazov: '',
        rozmer: '',
        material: '',
        poznamka: '',
        ks: 0,
        cenaKs: 0,
        cenaCelkom: 0,
      })),
      priplatky: [],
      kovanie: [],
      zlavaPercent: 0,
      montaz: [],
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
        setDvereData(migrateDvereData(editingData.data));
      } else if (editingData.type === 'nabytok' && editingData.data) {
        setNabytokData(migrateNabytokData(editingData.data));
      } else if (editingData.type === 'schody' && editingData.data) {
        setSchodyData(migrateSchodyData(editingData.data));
      } else if (editingData.type === 'kovanie' && editingData.data) {
        setKovanieData(migrateKovanieData(editingData.data));
      } else if (editingData.type === 'puzdra' && editingData.data) {
        setPuzdraData(editingData.data);
      }
    }
  }, [editingData]);

  const [isSavingAsNew, setIsSavingAsNew] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let dataToSave;
      if (activeTab === 'dvere') dataToSave = dvereData;
      else if (activeTab === 'nabytok') dataToSave = nabytokData;
      else if (activeTab === 'schody') dataToSave = schodyData;
      else if (activeTab === 'kovanie') dataToSave = kovanieData;
      else dataToSave = puzdraData;

      // Include the local cisloZakazky in the data
      await onSave(activeTab, { ...dataToSave, itemCisloZakazky: localCisloZakazky });
      // Don't close the modal after saving
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNewClick = async () => {
    if (!onSaveAsNew) return;
    setIsSavingAsNew(true);
    try {
      let dataToSave;
      if (activeTab === 'dvere') dataToSave = dvereData;
      else if (activeTab === 'nabytok') dataToSave = nabytokData;
      else if (activeTab === 'schody') dataToSave = schodyData;
      else if (activeTab === 'kovanie') dataToSave = kovanieData;
      else dataToSave = puzdraData;

      // Include the local cisloZakazky in the data
      await onSaveAsNew(activeTab, { ...dataToSave, itemCisloZakazky: localCisloZakazky }, { forceNewVersion: true });
      onClose(); // Close modal after creating new offer
    } finally {
      setIsSavingAsNew(false);
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
      } else if (activeTab === 'kovanie') {
        dataToPreview = kovanieData;
        totals = calculateKovanieTotals(kovanieData);
      } else {
        // Puzdra type doesn't have a standard PDF
        alert('Náhľad PDF nie je dostupný pre typ Púzdra');
        setIsGeneratingPDF(false);
        return;
      }

      // Auto-save before generating preview
      await onSave(activeTab, dataToPreview);

      // Create a temporary CenovaPonukaItem for PDF generation
      // Create a temporary CenovaPonukaItem for PDF generation
      const tempItem: CenovaPonukaItem = {
        id: 'preview',
        cisloCP: getDisplayCisloCP() || 'PREVIEW',
        typ: activeTab,
        verzia: '1',
        cenaBezDPH: totals.cenaBezDPH,
        cenaSDPH: totals.cenaSDPH,
        odoslane: '',
        vytvoril: vypracoval,
        popis: '',
        data: dataToPreview
      } as CenovaPonukaItem;

      // Prepare header info - prefer snapshot if available
      const snapshot = dataToPreview.billingSnapshot;

      const headerInfo = snapshot ? {
        customer: snapshot.customer,
        architect: snapshot.architect,
        billing: snapshot.billing,
        vypracoval,
        telefon: creatorPhone || '',
        email: creatorEmail || '',
        activeSource: snapshot.activeSource
      } : {
        customer: {
          firma: firma,
          meno: meno,
          priezvisko: priezvisko,
          ulica,
          mesto,
          psc,
          telefon,
          email,
          ico: ico,
          dic: dic,
          icDph: icDph,
        },
        architect: architectInfo,
        vypracoval,
        telefon: creatorPhone || '',
        email: creatorEmail || ''
      };

      // Create minimal formData for PDF generation
      // We need to map snapshot data back to flat formData structure for the PDF generator
      const source = snapshot ? snapshot.activeSource : (activeSource || 'zakaznik');
      const cust = snapshot ? snapshot.customer : { firma, meno, priezvisko, ulica, mesto, psc, telefon, email, ico, dic, icDph };
      const arch = snapshot ? snapshot.architect : architectInfo;
      const bill = snapshot ? snapshot.billing : billingInfo;

      const formData = {
        predmet: predmet || '',
        cisloZakazky: '',
        odsuhlesenaKS1: '',
        odsuhlesenaKS2: '',
        ochranaDatum: '',
        ochranaText: '',
        // Customer fields
        firma: cust?.firma || '',
        ico: cust?.ico || '',
        dic: cust?.dic || '',
        icDph: cust?.icDph || '',
        ulica: cust?.ulica || '',
        mesto: cust?.mesto || '',
        psc: cust?.psc || '',
        telefon: cust?.telefon || '',
        email: cust?.email || '',
        priezvisko: cust?.priezvisko || '',
        meno: cust?.meno || '',

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
        fullFormData: {},
        // Architect info for PDF generation
        architektonickyPriezvisko: arch?.priezvisko || '',
        architektonickeMeno: arch?.meno || '',
        architektonickyIco: arch?.ico || '',
        architektonickyDic: arch?.dic || '',
        architektonickyIcDph: arch?.icDph || '',
        architektonickyUlica: arch?.ulica || '',
        architektonickyMesto: arch?.mesto || '',
        architektonickyPsc: arch?.psc || '',
        architektonickyTelefon: arch?.telefon || '',
        architektonickyEmail: arch?.email || '',
        // Billing info for PDF generation
        fakturaciaPriezvisko: bill?.priezvisko || '',
        fakturaciaMeno: bill?.meno || '',
        fakturaciaAdresa: bill?.adresa || '',
        fakturaciaIco: bill?.ico || '',
        fakturaciaDic: bill?.dic || '',
        fakturaciaIcDph: bill?.icDph || '',
        fakturaciaTelefon: bill?.telefon || '',
        fakturaciaEmail: bill?.email || '',
        // Source toggle for PDF generation
        fakturaciaSource: source
      };

      const blobUrl = await generatePDF(tempItem, formData as any, headerInfo);
      setPdfPreview({
        url: blobUrl,
        filename: `CP_${getDisplayCisloCP() || 'PREVIEW'}.pdf`,
        tempItem,
        formData,
        headerInfo
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

  const handleDownloadPDF = async () => {
    if (!pdfPreview) return;
    await generateAndSavePDF(pdfPreview.tempItem, pdfPreview.formData, pdfPreview.headerInfo);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-2 md:p-4">
      <div
        className={`${isDark ? 'bg-dark-800' : 'bg-gray-100'} rounded-xl shadow-2xl flex flex-col w-full h-full md:w-[95vw] md:h-[90vh] md:max-w-[1400px]`}
      >
        {/* Header with WENS DOOR logo and tabs */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
          <div className="flex flex-col items-start md:flex-row md:items-center gap-3 md:gap-8 w-full md:w-auto">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="bg-white rounded-lg p-2 inline-block shadow-sm">
                <img
                  src="/logo.png"
                  alt="WENS door"
                  className="h-8"
                />
              </div>
              {/* Close button - mobile only */}
              <button
                onClick={onClose}
                className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 md:pb-2 w-full md:w-auto no-scrollbar">
              {(editingData || visibleTabs.length > 1
                ? (editingData ? [activeTab] : visibleTabs)
                : [] // If only one visible tab and not editing, don't show tab buttons
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 md:px-6 py-1.5 md:py-2 rounded-lg font-semibold transition-all text-sm md:text-base ${activeTab === tab
                    ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow-lg'
                    : isDark
                      ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {tab === 'dvere' ? 'Dvere' : tab === 'nabytok' ? 'Nábytok' : tab === 'schody' ? 'Schody' : tab === 'kovanie' ? 'Kovanie' : 'Púzdra'}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {getDisplayCisloCP()}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Číslo zákazky:</span>
                <input
                  type="text"
                  value={localCisloZakazky}
                  onChange={(e) => setLocalCisloZakazky(e.target.value.replace(/[^a-zA-Z0-9/]/g, ''))}
                  placeholder="Zadajte..."
                  className={`w-24 px-2 py-0.5 text-base font-semibold rounded border ${isDark ? 'bg-dark-700 text-white border-dark-500' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-red-500`}
                />
              </div>
            </div>
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
              headerInfo={(() => {
                // Determine effective header info: prefer snapshot if available, else props
                const snapshot = dvereData.billingSnapshot;
                if (snapshot) {
                  return {
                    customer: snapshot.customer,
                    architect: snapshot.architect,
                    billing: snapshot.billing,
                    vypracoval,
                    telefon: creatorPhone || '',
                    email: creatorEmail || '',
                    activeSource: snapshot.activeSource
                  };
                }
                // Fallback to current global state (legacy behavior or new item before save)
                return {
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
                  billing: billingInfo,
                  vypracoval,
                  telefon: creatorPhone || '',
                  email: creatorEmail || '',
                  activeSource
                };
              })()}
              onRefreshBilling={() => {
                const newSnapshot: import('../types').BillingSnapshot = {
                  customer: {
                    firma: firma,
                    ulica: ulica,
                    mesto: mesto,
                    psc: psc,
                    telefon: telefon,
                    email: email,
                    meno: meno,
                    priezvisko: priezvisko,
                    ico: ico,
                    dic: dic,
                    icDph: icDph
                  },
                  architect: architectInfo,
                  billing: billingInfo,
                  activeSource: activeSource || 'zakaznik'
                };
                setDvereData(prev => ({ ...prev, billingSnapshot: newSnapshot }));
              }}
              usingSnapshot={!!dvereData.billingSnapshot}
            />
          )}
          {activeTab === 'nabytok' && (
            <NabytokForm
              data={nabytokData}
              onChange={setNabytokData}
              isDark={isDark}
              headerInfo={(() => {
                const snapshot = nabytokData.billingSnapshot;
                if (snapshot) {
                  return {
                    customer: snapshot.customer,
                    architect: snapshot.architect,
                    billing: snapshot.billing,
                    vypracoval,
                    telefon: creatorPhone || '',
                    email: creatorEmail || '',
                    activeSource: snapshot.activeSource
                  };
                }
                return {
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
                  billing: billingInfo,
                  vypracoval,
                  telefon: creatorPhone || '',
                  email: creatorEmail || '',
                  activeSource
                };
              })()}
              onRefreshBilling={() => {
                const newSnapshot: import('../types').BillingSnapshot = {
                  customer: {
                    firma: firma,
                    ulica: ulica,
                    mesto: mesto,
                    psc: psc,
                    telefon: telefon,
                    email: email,
                    meno: meno,
                    priezvisko: priezvisko,
                    ico: ico,
                    dic: dic,
                    icDph: icDph
                  },
                  architect: architectInfo,
                  billing: billingInfo,
                  activeSource: activeSource || 'zakaznik'
                };
                setNabytokData(prev => ({ ...prev, billingSnapshot: newSnapshot }));
              }}
              usingSnapshot={!!nabytokData.billingSnapshot}
            />
          )}
          {activeTab === 'schody' && (
            <SchodyForm
              data={schodyData}
              onChange={setSchodyData}
              isDark={isDark}
              headerInfo={(() => {
                const snapshot = schodyData.billingSnapshot;
                if (snapshot) {
                  return {
                    customer: snapshot.customer,
                    architect: snapshot.architect,
                    billing: snapshot.billing,
                    vypracoval,
                    telefon: creatorPhone || '',
                    email: creatorEmail || '',
                    activeSource: snapshot.activeSource
                  };
                }
                return {
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
                  billing: billingInfo,
                  vypracoval,
                  telefon: creatorPhone || '',
                  email: creatorEmail || '',
                  activeSource
                };
              })()}
              onRefreshBilling={() => {
                const newSnapshot: import('../types').BillingSnapshot = {
                  customer: {
                    firma: firma,
                    ulica: ulica,
                    mesto: mesto,
                    psc: psc,
                    telefon: telefon,
                    email: email,
                    meno: meno,
                    priezvisko: priezvisko,
                    ico: ico,
                    dic: dic,
                    icDph: icDph
                  },
                  architect: architectInfo,
                  billing: billingInfo,
                  activeSource: activeSource || 'zakaznik'
                };
                setSchodyData(prev => ({ ...prev, billingSnapshot: newSnapshot }));
              }}
              usingSnapshot={!!schodyData.billingSnapshot}
            />
          )}
          {activeTab === 'kovanie' && (
            <KovanieForm
              data={kovanieData}
              onChange={setKovanieData}
              isDark={isDark}
              headerInfo={(() => {
                const snapshot = kovanieData.billingSnapshot;
                if (snapshot) {
                  return {
                    customer: snapshot.customer,
                    architect: snapshot.architect,
                    billing: snapshot.billing,
                    vypracoval,
                    telefon: creatorPhone || '',
                    email: creatorEmail || '',
                    activeSource: snapshot.activeSource
                  };
                }
                return {
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
                  billing: billingInfo,
                  vypracoval,
                  telefon: creatorPhone || '',
                  email: creatorEmail || '',
                  activeSource
                };
              })()}
              onRefreshBilling={() => {
                const newSnapshot: import('../types').BillingSnapshot = {
                  customer: {
                    firma: firma,
                    ulica: ulica,
                    mesto: mesto,
                    psc: psc,
                    telefon: telefon,
                    email: email,
                    meno: meno,
                    priezvisko: priezvisko,
                    ico: ico,
                    dic: dic,
                    icDph: icDph
                  },
                  architect: architectInfo,
                  billing: billingInfo,
                  activeSource: activeSource || 'zakaznik'
                };
                setKovanieData(prev => ({ ...prev, billingSnapshot: newSnapshot }));
              }}
              usingSnapshot={!!kovanieData.billingSnapshot}
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
                Náhľad
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
            {isEditing && onSaveAsNew && (
              <button
                onClick={handleSaveAsNewClick}
                disabled={isLocked || isSavingAsNew}
                className={`flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-lg ${isLocked || isSavingAsNew ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSavingAsNew && (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSavingAsNew ? 'Vytvárám...' : 'Nová cenová ponuka'}
              </button>
            )}
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
          onDownload={handleDownloadPDF}
        />
      )}
    </div>
  );
};
