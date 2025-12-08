import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useContacts } from '../../../contexts/ContactsContext';
import { SpisEntry, SpisFormData, CenovaPonukaItem } from '../types';
import { VseobecneSidebar } from './VseobecneSidebar';
import { VseobecneForm } from './VseobecneForm';
import { CenovePonukyTab } from './CenovePonukyTab';
import { ObjednavkyTab } from './ObjednavkyTab';
import { EmailyTab } from './EmailyTab';
import { MeranieTab } from './MeranieTab';
import { FotkyTab } from './FotkyTab';
import { VyrobneVykresyTab } from './VyrobneVykresyTab';
import { TechnickeVykresyTab } from './TechnickeVykresyTab';
import { AddTemplateModal } from './AddTemplateModal';
import { generatePDF } from '../utils/pdfGenerator';

interface SpisEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entryData: SpisEntry) => void;
  onDelete: (id: string | null) => void;
  initialEntry: SpisEntry | null;
  editingIndex: number | null;
  user: any;
  firmaOptions: string[];
  setFirmaOptions: (options: string[]) => void;
  entries: any[];
  addContact: (contact: any) => void;
  selectedOrderIndex: number | null;
}

export const SpisEntryModal: React.FC<SpisEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEntry,
  editingIndex,
  user,
  firmaOptions,
  setFirmaOptions,
  entries,
  addContact,
  selectedOrderIndex
}) => {
  const { isDark } = useTheme();
  const { contacts } = useContacts();
  const [activeTab, setActiveTab] = useState('vseobecne');
  const [uploadedPhotos, setUploadedPhotos] = useState<{id: string, file: File, url: string, description: string}[]>([]);
  
  // Internal ID to ensure stable identity across auto-saves
  const [internalId] = useState<string>(() => initialEntry?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9));

  // State for the "Pridať vzor" sub-modal
  const [showVzorModal, setShowVzorModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingOfferData, setEditingOfferData] = useState<{type: 'dvere' | 'nabytok' | 'puzdra', data: any} | undefined>(undefined);
  
  // Helper function to get next CP number
  const getNextCP = useCallback(() => {
    if (!entries || entries.length === 0) return 'CP2025/0001';
    let max = 0;
    entries.forEach(e => {
      // assuming format CP2025/xxxx
      const parts = e.cisloCP.split('/');
      if (parts.length === 2) {
         const num = parseInt(parts[1], 10);
         if (!isNaN(num) && num > max) max = num;
      }
    });
    return `CP2025/${(max + 1).toString().padStart(4, '0')}`;
  }, [entries]);

  // Helper function to create a FRESH default form data object
  const createDefaultFormData = useCallback((): SpisFormData => ({
    // Všeobecné - Ochrana section (left sidebar)
    predmet: getNextCP(),
    cisloZakazky: '',
    odsuhlesenaKS1: '',
    odsuhlesenaKS2: '',
    ochranaDatum: new Date().toISOString().split('T')[0],
    firma: '',
    vypracoval: user ? `${user.firstName} ${user.lastName}` : '',
    stav: 'CP',
    kategoria: 'Dvere',
    sprostredkovatel: '',
    vybavene: false,
    terminDokoncenia: '',

    // Všeobecné - Financie section (left sidebar)
    provizia: '0',
    cena: '0',
    zaloha1: '0',
    zaloha1Datum: '',
    zaloha2: '0',
    zaloha2Datum: '',
    doplatok: '0',
    doplatokDatum: '',

    // Všeobecné - Konečný zákazník
    priezvisko: '',
    meno: '',
    telefon: '',
    email: '',
    ulica: '',
    ico: '',
    mesto: '',
    psc: '',
    icDph: '',
    dic: '',
    popisProjektu: '',

    // Všeobecné - Architekt - sprostredkovateľ
    architektonickyPriezvisko: '',
    architektonickeMeno: '',
    architektonickyTelefon: '',
    architektonickyEmail: '',
    architektonickyUlica: '',
    architektonickyIco: '',
    architektonickyMesto: '',
    architektonickyPsc: '',
    architektonickyIcDph: '',
    architektonickyDic: '',

    // Všeobecné - Fakturačná firma / Realizátor
    realizatorPriezvisko: '',
    realizatorMeno: '',
    realizatorTelefon: '',
    realizatorEmail: '',
    realizatorUlica: '',
    realizatorIco: '',
    realizatorMesto: '',
    realizatorPsc: '',
    realizatorIcDph: '',
    realizatorDic: '',

    // Všeobecné - Kontaktná osoba
    kontaktnaPriezvisko: '',
    kontaktnaMeno: '',
    kontaktnaTelefon: '',
    kontaktnaEmail: '',

    // Všeobecné - Fakturácia
    fakturaciaTyp: 'nepouzit', // 'pouzit' or 'nepouzit'
    fakturaciaK10: false,
    fakturaciaPriezvisko: '',
    fakturaciaMeno: '',
    fakturaciaAdresa: '',

    // Všeobecné - Popis table
    popisItems: [],

    // Cenové ponuky
    cenovePonukyItems: [],

    // Objednávky data
    objednavkyItems: [],

    // Emaily
    emailKomu: '',
    emailKomuText: '',
    emailPredmet: '',
    emailText: '',
    emailItems: [],

    // Meranie a Dokumenty
    meranieItems: [],

    // Výrobné výkresy
    vyrobneVykresy: [],

    // Fotky
    fotky: [],

    // Technické výkresy
    technickeItems: [],
  }), [user, getNextCP]);

  const [formData, setFormData] = useState<SpisFormData>(createDefaultFormData());
  const [lastSavedJson, setLastSavedJson] = useState('');

  // Reset or load data when modal opens/changes
  useEffect(() => {
    if (isOpen && initialEntry) {
      if (initialEntry.fullFormData) {
        const loadedData = {
          ...initialEntry.fullFormData,
          objednavkyItems: initialEntry.fullFormData.objednavkyItems || []
        };
        setFormData(loadedData);
        setLastSavedJson(JSON.stringify(loadedData));
        
        // Load photos
        if (initialEntry.fullFormData.fotky) {
           const loadedPhotos = initialEntry.fullFormData.fotky.map((p: any) => ({
             id: p.id,
             file: new File([""], p.name, { type: p.type }),
             url: p.base64,
             description: p.description
           }));
           setUploadedPhotos(loadedPhotos);
        } else {
           setUploadedPhotos([]);
        }
      } else {
        // Legacy support - construct from basic fields
        const defaults = createDefaultFormData();
        const legacyData = {
          ...defaults,
          predmet: initialEntry.cisloCP || '',
          cisloZakazky: initialEntry.cisloZakazky || '',
          firma: initialEntry.firma || '',
          vypracoval: initialEntry.spracovatel || '',
          stav: initialEntry.stav || '',
          kategoria: initialEntry.kategoria || '',
          terminDokoncenia: initialEntry.terminDodania ? (() => {
            try {
              const parts = initialEntry.terminDodania.split('.');
              if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
              }
              return '';
            } catch (e) {
              return '';
            }
          })() : '',
          meno: initialEntry.kontaktnaOsoba?.split(' ')[0] || '',
          priezvisko: initialEntry.kontaktnaOsoba?.split(' ').slice(1).join(' ') || '',
          popisProjektu: initialEntry.popis || '',
          emailPredmet: initialEntry.cisloCP || '',
        };
        setFormData(legacyData);
        setLastSavedJson(JSON.stringify(legacyData));
      }
    } else if (isOpen && !initialEntry) {
      // Reset to fresh state when creating new
      const newData = createDefaultFormData();
      setFormData(newData);
      setLastSavedJson(JSON.stringify(newData));
    }
  }, [isOpen, initialEntry, createDefaultFormData]);

  const performSave = useCallback(() => {
    // Map photos to persistent format
    const persistentPhotos = uploadedPhotos.map(p => ({
      id: p.id,
      name: p.file.name,
      type: p.file.type,
      base64: p.url, // We assume URL is base64 (handled in FotkyTab)
      description: p.description
    }));

    const entryData: SpisEntry = {
      id: internalId,
      // Main table display fields
      stav: formData.stav || 'CP',
      cisloCP: formData.predmet || getNextCP(),
      cisloZakazky: formData.cisloZakazky || '',
      datum: new Date().toLocaleDateString('sk-SK'),
      kontaktnaOsoba: `${formData.meno} ${formData.priezvisko}`.trim() || '',
      architekt: `${formData.architektonickyPriezvisko || ''} ${formData.architektonickeMeno || ''}`.trim() || '',
      realizator: `${formData.realizatorPriezvisko || ''} ${formData.realizatorMeno || ''}`.trim() || '',
      popis: formData.popisProjektu || '',
      firma: formData.firma || '',
      spracovatel: formData.vypracoval || '',
      kategoria: formData.kategoria || '',
      terminDodania: formData.terminDokoncenia ? new Date(formData.terminDokoncenia).toLocaleDateString('sk-SK') : '',
      color: 'white',

      // All form data for later retrieval
      fullFormData: { 
        ...formData,
        fotky: persistentPhotos
      }
    };

    // Save contacts
    if (formData.priezvisko || formData.meno || formData.email || formData.telefon) {
      // Try to resolve ID by name if explicit ID is missing
      let resolvedId = formData.zakaznikId;
      if (!resolvedId) {
          const match = contacts.find(c => 
              c.typ === 'zakaznik' &&
              (c.priezvisko || '').toLowerCase().trim() === (formData.priezvisko || '').toLowerCase().trim() &&
              (c.meno || '').toLowerCase().trim() === (formData.meno || '').toLowerCase().trim()
          );
          if (match) resolvedId = match.id;
      }

      addContact({
        id: resolvedId, // Use resolved or explicit ID
        meno: formData.meno || '',
        priezvisko: formData.priezvisko || '',
        telefon: formData.telefon || '',
        email: formData.email || '',
        ulica: formData.ulica || '',
        mesto: formData.mesto || '',
        psc: formData.psc || '',
        ico: formData.ico || '',
        icDph: formData.icDph || '',
        typ: 'zakaznik',
        kontaktnaPriezvisko: formData.kontaktnaPriezvisko || '',
        kontaktnaMeno: formData.kontaktnaMeno || '',
        kontaktnaTelefon: formData.kontaktnaTelefon || '',
        kontaktnaEmail: formData.kontaktnaEmail || '',
        popis: formData.popisProjektu || '',
        projectIds: [entryData.cisloCP]
      });
    }

    if (formData.architektonickyPriezvisko || formData.architektonickeMeno) {
      // Try to resolve ID by name if explicit ID is missing
      let resolvedId = formData.architektId;
      if (!resolvedId) {
          const match = contacts.find(c => 
              c.typ === 'architekt' &&
              (c.priezvisko || '').toLowerCase().trim() === (formData.architektonickyPriezvisko || '').toLowerCase().trim() &&
              (c.meno || '').toLowerCase().trim() === (formData.architektonickeMeno || '').toLowerCase().trim()
          );
          if (match) resolvedId = match.id;
      }

      addContact({
        id: resolvedId, // Use resolved or explicit ID
        meno: formData.architektonickeMeno || '',
        priezvisko: formData.architektonickyPriezvisko || '',
        telefon: formData.architektonickyTelefon || '',
        email: formData.architektonickyEmail || '',
        ulica: formData.architektonickyUlica || '',
        mesto: formData.architektonickyMesto || '',
        psc: formData.architektonickyPsc || '',
        ico: formData.ico || '',
        icDph: formData.icDph || '',
        typ: 'architekt',
        projectIds: [entryData.cisloCP]
      });
    }

    // Update firma options
    if (formData.firma && !firmaOptions.includes(formData.firma)) {
      setFirmaOptions([...firmaOptions, formData.firma]);
    }

    setLastSavedJson(JSON.stringify(formData));
    onSave(entryData);
  }, [formData, uploadedPhotos, addContact, firmaOptions, getNextCP, onSave, setFirmaOptions, internalId, contacts]);



  // Switch to Objednavky tab if a specific order is selected
  useEffect(() => {
    if (selectedOrderIndex !== null) {
      setActiveTab('objednavky');
    }
  }, [selectedOrderIndex]);

  const handleAddTemplateSave = (type: 'dvere' | 'nabytok' | 'puzdra', data: any) => {
    // Calculate totals
    let cenaBezDPH = 0;
    let cenaSDPH = 0;
    let popis = '';

    if (type === 'dvere') {
      const vyrobkyTotal = data.vyrobky.reduce((sum: number, item: any) => sum + (item.ks * item.cenaDvere) + (item.ksZarubna * item.cenaZarubna), 0);
      const priplatkyTotal = data.priplatky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
      const subtotal = vyrobkyTotal + priplatkyTotal;
      const zlava = subtotal * data.zlavaPercent / 100;
      const afterZlava = subtotal - zlava;
      const kovanieTotal = data.kovanie.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
      const montazTotal = data.montaz.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
      cenaBezDPH = afterZlava + kovanieTotal + montazTotal;
      cenaSDPH = cenaBezDPH * 1.23;
      popis = data.popisVyrobkov;
    } else if (type === 'nabytok') {
      const vyrobkyTotal = data.vyrobky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
      const priplatkyTotal = data.priplatky.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
      const subtotal = vyrobkyTotal + priplatkyTotal;
      const zlava = subtotal * data.zlavaPercent / 100;
      const afterZlava = subtotal - zlava;
      const kovanieTotal = data.kovanie.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
      const montazTotal = data.montaz.reduce((sum: number, item: any) => sum + item.cenaCelkom, 0);
      cenaBezDPH = afterZlava + kovanieTotal + montazTotal;
      cenaSDPH = cenaBezDPH * 1.23;
      popis = data.popisVyrobkov;
    } else if (type === 'puzdra') {
      popis = `Objednávka: ${data.polozky.length} položiek`;
    }

    const entryData: CenovaPonukaItem = {
      id: editingOfferId || Date.now().toString(),
      cisloCP: editingOfferId 
        ? formData.cenovePonukyItems.find(i => i.id === editingOfferId)?.cisloCP || '' 
        : formData.predmet + '-' + (formData.cenovePonukyItems.length + 1).toString().padStart(2, '0'),
      verzia: editingOfferId 
        ? formData.cenovePonukyItems.find(i => i.id === editingOfferId)?.verzia || '1'
        : '1',
      odoslane: editingOfferId
        ? formData.cenovePonukyItems.find(i => i.id === editingOfferId)?.odoslane || ''
        : '',
      vytvoril: formData.vypracoval || (user ? `${user.firstName} ${user.lastName}` : '') || '',
      popis: popis.substring(0, 50) + (popis.length > 50 ? '...' : ''),
      typ: type,
      cenaBezDPH: cenaBezDPH,
      cenaSDPH: cenaSDPH,
      data: data
    };

    // Calculate finance updates
    let financeUpdates = {};
    if ((type === 'dvere' || type === 'nabytok') && data.platba1Percent) {
        financeUpdates = {
          cena: cenaSDPH.toFixed(2),
          zaloha1: (cenaSDPH * data.platba1Percent / 100).toFixed(2),
          zaloha2: (cenaSDPH * data.platba2Percent / 100).toFixed(2),
          doplatok: (cenaSDPH * data.platba3Percent / 100).toFixed(2)
        };
    }

    setFormData(prev => {
      let newItems = [...prev.cenovePonukyItems];
      if (editingOfferId) {
        newItems = newItems.map(item => item.id === editingOfferId ? entryData : item);
      } else {
        newItems.push(entryData);
      }
      return {
        ...prev,
        ...financeUpdates,
        cenovePonukyItems: newItems
      };
    });
  };

  const handleEditOffer = (item: CenovaPonukaItem) => {
    setEditingOfferId(item.id);
    setEditingOfferData({ type: item.typ, data: item.data });
    setShowVzorModal(true);
  };

  const handleGeneratePDF = (item: CenovaPonukaItem) => {
    generatePDF(item, formData);
  };

  const handleReset = () => {
    if (window.confirm('Naozaj chcete obnoviť formulár do počiatočného stavu? Všetky vyplnené údaje a súbory budú vymazané.')) {
      const defaults = createDefaultFormData();
      // Preserve the current CP number and status logic if needed, but user wants "fresh project" feel
      // We definitely need to keep the CP number (predmet) otherwise we lose identity or create conflicts
      defaults.predmet = formData.predmet;
      
      setFormData(defaults);
      setUploadedPhotos([]);
      // Trigger save immediately to persist the clear
      // We can rely on auto-save or force it. 
      // Since this is a destructive action, forcing save ensures state consistency.
      // But we can't force save easily with the new state immediately because setState is async.
      // However, auto-save effect will pick it up.
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className={`rounded-lg w-full max-w-[95vw] h-full overflow-hidden flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'} relative`}
          style={{
            boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
          }}
        >
          {/* Modal Tabs with Close Button */}
          <div className="flex border-b flex-shrink-0 items-center bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
            <div className="flex overflow-x-auto no-scrollbar flex-1">
              {[
                { id: 'vseobecne', label: 'Všeobecné' },
                { id: 'cenove-ponuky', label: 'Cenové ponuky' },
                { id: 'vzor-nabytok', label: 'Vzor - Nábytok' },
                { id: 'objednavky', label: 'Objednávky' },
                { id: 'emaily', label: 'Emaily' },
                { id: 'meranie-dokumenty', label: 'Meranie a Dokumenty' },
                { id: 'fotky', label: 'Fotky' },
                { id: 'vyrobne-vykresy', label: 'Výrobné výkresy' },
                { id: 'technicke-vykresy', label: 'Technické výkresy' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 text-white whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-white bg-white/30 backdrop-blur-md'
                      : 'border-transparent hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const isDirty = JSON.stringify(formData) !== lastSavedJson;
                if (isDirty) {
                  if (window.confirm('Máte neuložené zmeny. Chcete ich uložiť?')) {
                    performSave();
                  }
                }
                onClose();
              }}
              className="p-2 mx-2 text-white/70 hover:text-white flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content with Action Buttons */}
          <div className="flex flex-col flex-1 overflow-hidden relative">
            {/* Main Scrollable Area (Mobile: Single scroll, Desktop: Columns scroll) */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row p-2 lg:p-4 gap-4 lg:gap-6">
              {/* Left Sidebar */}
              {activeTab === 'vseobecne' && (
                <div className="w-full lg:w-96 flex-shrink-0 lg:h-full lg:overflow-y-auto">
                  <VseobecneSidebar
                    formData={formData}
                    setFormData={setFormData}
                    isDark={isDark}
                    firmaOptions={firmaOptions}
                  />
                </div>
              )}

              {/* Main Content Area (Form + Popis) */}
              <div className="flex-1 flex flex-col min-h-0 lg:h-full lg:overflow-y-auto">
                <div className="flex-1">
                  {activeTab === 'vseobecne' && (
                    <VseobecneForm
                      formData={formData}
                      setFormData={setFormData}
                      isDark={isDark}
                    />
                  )}

                  {activeTab === 'cenove-ponuky' && (
                    <CenovePonukyTab
                      items={formData.cenovePonukyItems}
                      onDelete={(index) => {
                        setFormData(prev => ({
                          ...prev,
                          cenovePonukyItems: prev.cenovePonukyItems.filter((_, i) => i !== index)
                        }));
                      }}
                      onEdit={handleEditOffer}
                      onGeneratePDF={handleGeneratePDF}
                      isDark={isDark}
                    />
                  )}

                  {activeTab === 'vzor-nabytok' && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-gray-500 text-lg">Bude doplnené neskôr s AI automatizáciou</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'objednavky' && (
                    <ObjednavkyTab
                      items={formData.objednavkyItems}
                      onUpdate={(items) => setFormData(prev => ({...prev, objednavkyItems: items}))}
                      isDark={isDark}
                      user={user}
                      entries={entries}
                      selectedOrderIndex={selectedOrderIndex}
                    />
                  )}

                  {activeTab === 'emaily' && (
                    <EmailyTab 
                      isDark={isDark} 
                      items={formData.emailItems}
                      onUpdate={(items: any) => setFormData(prev => ({...prev, emailItems: items}))}
                    />
                  )}

                  {activeTab === 'meranie-dokumenty' && (
                    <MeranieTab 
                      isDark={isDark} 
                      items={formData.meranieItems}
                      onUpdate={(items: any) => setFormData(prev => ({...prev, meranieItems: items}))}
                    />
                  )}

                  {activeTab === 'fotky' && (
                    <FotkyTab 
                      uploadedPhotos={uploadedPhotos}
                      setUploadedPhotos={setUploadedPhotos}
                    />
                  )}

                  {activeTab === 'vyrobne-vykresy' && (
                    <VyrobneVykresyTab 
                      isDark={isDark} 
                      items={formData.vyrobneVykresy}
                      onUpdate={(items: any) => setFormData(prev => ({...prev, vyrobneVykresy: items}))}
                    />
                  )}

                  {activeTab === 'technicke-vykresy' && (
                    <TechnickeVykresyTab 
                      isDark={isDark} 
                      items={formData.technickeItems}
                      onUpdate={(items: any) => setFormData(prev => ({...prev, technickeItems: items}))}
                    />
                  )}
                </div>

                {/* Popis section - moved here to be part of main column flow */}
                {activeTab === 'vseobecne' && (
                  <div
                    className={`mt-4 rounded-lg p-4 flex-shrink-0 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border`}
                    style={{
                      boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
                    }}
                  >
                    <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>Popis</h3>
                    <table className={`w-full text-xs border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <thead>
                        <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
                          <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Dátum</th>
                          <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Popis</th>
                          <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Pridať</th>
                          <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Zospovedný</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}>
                          <td className={`border px-3 py-2.5 h-10 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}></td>
                          <td className={`border px-3 py-2.5 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}></td>
                          <td className={`border px-3 py-2.5 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}></td>
                          <td className={`border px-3 py-2.5 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Desktop Action Buttons Sidebar */}
              <div
                className="hidden lg:flex w-48 bg-gray-50 border border-gray-200 rounded-lg flex-col justify-center gap-3 p-3 flex-shrink-0 h-fit"
                style={{
                  boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
                }}
              >
                <button
                  onClick={performSave}
                  className="px-3 py-3 text-sm flex items-center justify-center text-white bg-green-600 rounded-lg hover:bg-green-700 text-center transition-colors font-semibold shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  Uložiť
                </button>
                <button
                  onClick={() => {
                    setEditingOfferId(null);
                    setEditingOfferData(undefined);
                    setShowVzorModal(true);
                  }}
                  className="px-3 py-3 text-sm flex items-center justify-center text-white bg-red-600 rounded-lg hover:bg-red-700 text-center transition-colors font-semibold shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Pridať vzor
                </button>
                <button
                  className="px-3 py-3 text-sm flex items-center justify-center text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-center transition-colors font-semibold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0020 13a8 8 0 00-15.356-2m15.356 2H21v-5h-.582"></path></svg>
                  Obnoviť
                </button>
                <button
                  onClick={() => onDelete(internalId)}
                  className="px-3 py-3 text-sm flex items-center justify-center text-white bg-red-600 rounded-lg hover:bg-red-700 text-center transition-colors font-semibold mt-2 shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m-3 0h14"></path></svg>
                  Vymazať
                </button>
              </div>
            </div>

            {/* Mobile Fixed Buttons (Outside scroll area) */}
            <div className={`lg:hidden p-3 border-t flex gap-2 flex-shrink-0 z-20 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={performSave}
                className="flex-1 px-2 py-3 text-xs flex items-center justify-center text-white bg-green-600 rounded-lg hover:bg-green-700 text-center transition-colors font-semibold shadow-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Uložiť
              </button>
              <button
                onClick={() => {
                  setEditingOfferId(null);
                  setEditingOfferData(undefined);
                  setShowVzorModal(true);
                }}
                className="flex-1 px-2 py-3 text-xs flex items-center justify-center text-white bg-red-600 rounded-lg hover:bg-red-700 text-center transition-colors font-semibold shadow-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Pridať vzor
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-2 py-3 text-xs flex items-center justify-center text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-center transition-colors font-semibold shadow-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0020 13a8 8 0 00-15.356-2m15.356 2H21v-5h-.582"></path></svg>
                Obnoviť
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddTemplateModal
        isOpen={showVzorModal}
        onClose={() => setShowVzorModal(false)}
        onSave={handleAddTemplateSave}
        firma={formData.firma}
        priezvisko={formData.priezvisko}
        meno={formData.meno}
        ulica={formData.ulica}
        mesto={formData.mesto}
        psc={formData.psc}
        telefon={formData.telefon}
        email={formData.email}
        vypracoval={formData.vypracoval}
        predmet={formData.predmet}
        editingData={editingOfferData}
      />
    </>
  );
};