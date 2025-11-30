import React, { useState, useEffect, useRef } from 'react';
import { useContacts } from '../contexts/ContactsContext';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Spis = () => {
  const { addContact } = useContacts();
  const location = useLocation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const highlightedRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('vseobecne');
  const [entries, setEntries] = useState<any[]>(() => {
    try {
      const storageKey = user ? `spisEntries_${user.id}` : 'spisEntries';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse spisEntries from localStorage:', error);
      return [];
    }
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<{id: string, file: File, url: string, description: string}[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [firmaOptions, setFirmaOptions] = useState<string[]>(() => {
    try {
      const storageKey = user ? `firmaOptions_${user.id}` : 'firmaOptions';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : ['Slavo Zdenko'];
    } catch (error) {
      console.error('Failed to parse firmaOptions from localStorage:', error);
      return ['Slavo Zdenko'];
    }
  });
  const [showFirmaDropdown, setShowFirmaDropdown] = useState(false);
  const [filteredFirmaOptions, setFilteredFirmaOptions] = useState<string[]>([]);
  const [objednavkyData, setObjednavkyData] = useState<any[]>(() => {
    try {
      const storageKey = user ? `objednavkyData_${user.id}` : 'objednavkyData';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse objednavkyData from localStorage:', error);
      return [];
    }
  });
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({});
  const [highlightedProjectIds, setHighlightedProjectIds] = useState<string[]>([]);
  const [activeSearchColumn, setActiveSearchColumn] = useState<string | null>(null);
  
  // Technical drawings data
  const [technicalData] = useState([
    {
      nazov: 'MACO WE Stavebnica Okno 2.62',
      datum: '28.09.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
    },
    {
      nazov: 'MACO Vektorové Okno Stavby Tabuľka 27',
      datum: '01.11.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
    },
    {
      nazov: 'MACO Multi Trend Okno 7/8',
      datum: '28.11.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
    },
    {
      nazov: 'MACO Stavebnica Okno 62mm',
      datum: '15.09.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
    },
    {
      nazov: 'MACO Stavebnica Okno 87',
      datum: '03.09.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
    },
    {
      nazov: 'MACO Stavebnica Okno RC-3',
      datum: '12.09.14',
      kategoria: 'Bezpečnosť',
      dodavatel: 'MACO',
    },
    {
      nazov: 'WERU Tabuľka Okno ľahostné Okno',
      datum: '02.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
    },
    {
      nazov: 'WERU Okno RU0 Stavebnica okno TechnoB',
      datum: '08.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
    },
    {
      nazov: 'WERU Stavebnica okno Thermo',
      datum: '23.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
    },
    {
      nazov: 'WERU Thermo okno stavebnica tabuľka',
      datum: '22.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
    },
    {
      nazov: 'NTE okno stavebnica okno',
      datum: '10.09.14',
      kategoria: 'Okná',
      dodavatel: 'NTE',
    },
    {
      nazov: 'NTE okno okno stavebnica Techno',
      datum: '11.09.14',
      kategoria: 'Okná',
      dodavatel: 'NTE',
    },
    {
      nazov: 'NTE Prel R0 okno 87',
      datum: '12.09.14',
      kategoria: 'Okná',
      dodavatel: 'NTE',
    },
    {
      nazov: 'Protipožiarna technika 10',
      datum: '05.09.14',
      kategoria: 'Bezpečnosť',
      dodavatel: 'Ostatné',
    },
    {
      nazov: 'Po kotáže aktíva okno 8mm stanice',
      datum: '03.09.14',
      kategoria: 'Inštalácia',
      dodavatel: 'Ostatné',
    },
    {
      nazov: 'WERU Techno Multi-Trend 12',
      datum: '06.12.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
    },
    {
      nazov: 'WERU Techno stavby',
      datum: '06.12.14',
      kategoria: 'Stavby',
      dodavatel: 'WERU',
    },
    {
      nazov: 'WERU Thermo stavebnica 71',
      datum: '12.10.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
    },
    {
      nazov: 'WE Thermo RC okno aktíva',
      datum: '11.09.14',
      kategoria: 'Bezpečnosť',
      dodavatel: 'WERU',
    }
  ]);
  
  const [formData, setFormData] = useState({
    // Všeobecné - Ochrana section (left sidebar)
    predmet: 'CP2025/0365',
    cisloZakazky: '',
    odsuhlesenaKS1: '',
    odsuhlesenaKS2: '',
    ochranaDatum: '',
    firma: '',
    vypracoval: '',
    stav: '',
    kategoria: '',
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
    popisItems: [] as {datum: string, popis: string, pridat: string, zodpovedny: string}[],

    // Cenové ponuky
    cenovePonukyItems: [] as {cisloCP: string, verzia: string, odoslane: string, vytvoril: string, popis: string}[],

    // Objednávky data
    objednavkyItems: [] as {id?: string, nazov: string, vypracoval: string, datum: string, popis: string, cisloObjednavky: string, dorucene: string}[],

    // Emaily
    emailKomu: '',
    emailKomuText: '',
    emailPredmet: '',
    emailText: '',
    emailItems: [] as {popis: string, nazov: string, datum: string, vyvoj: string, stav: string}[],

    // Meranie a Dokumenty
    meranieItems: [] as {datum: string, popis: string, pridat: string, zodpovedny: string}[],

    // Výrobné výkresy
    vyrobneVykresy: [] as {popis: string, nazov: string, odoslane: string, vytvoril: string}[],
  });

  // No sample data - start with empty table

  // Reload data when user changes
  useEffect(() => {
    if (user) {
      try {
        const storageKey = `spisEntries_${user.id}`;
        const saved = localStorage.getItem(storageKey);
        setEntries(saved ? JSON.parse(saved) : []);

        const objednavkyKey = `objednavkyData_${user.id}`;
        const objednavkySaved = localStorage.getItem(objednavkyKey);
        setObjednavkyData(objednavkySaved ? JSON.parse(objednavkySaved) : []);

        const firmaKey = `firmaOptions_${user.id}`;
        const firmaSaved = localStorage.getItem(firmaKey);
        setFirmaOptions(firmaSaved ? JSON.parse(firmaSaved) : ['Slavo Zdenko']);
      } catch (error) {
        console.error('Failed to reload user data:', error);
      }
    }
  }, [user]);

  // Check for selected order from navigation
  React.useEffect(() => {
    try {
      const selectedOrder = localStorage.getItem('selectedOrder');
      if (selectedOrder) {
        const orderData = JSON.parse(selectedOrder);
        // Find the parent Spis entry
        const parentEntry = entries.find(entry => entry.cisloCP === orderData.parentSpisId);
        if (parentEntry) {
          const entryIndex = entries.indexOf(parentEntry);
          handleRowClick(parentEntry, entryIndex);
          // Set active tab to objednavky
          setActiveTab('objednavky');
          // Set selected order for highlighting
          const orderIndex = objednavkyData.findIndex(order =>
            order.cisloObjednavky === orderData.cisloObjednavky &&
            order.parentSpisId === orderData.parentSpisId
          );
          setSelectedOrderIndex(orderIndex >= 0 ? orderIndex : null);
          // Clear the selected order after short delay
          setTimeout(() => {
            localStorage.removeItem('selectedOrder');
            setSelectedOrderIndex(null);
          }, 3000); // Highlight for 3 seconds
        }
      }
    } catch (error) {
      console.error('Failed to process selected order:', error);
      localStorage.removeItem('selectedOrder');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, objednavkyData]);

  // Handle highlighting rows when navigating from Kontakty page
  useEffect(() => {
    if (location.state?.highlightProjectIds) {
      const projectIds = location.state.highlightProjectIds as string[];
      setHighlightedProjectIds(projectIds);

      // Scroll to first highlighted row
      const scrollTimer = setTimeout(() => {
        const firstProjectId = projectIds[0];
        const rowElement = highlightedRowRefs.current[firstProjectId];
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Clear highlights after 5 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedProjectIds([]);
      }, 5000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [location.state]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  const getSortedAndFilteredEntries = () => {
    let filteredEntries = [...entries];
    
    // Apply column filters
    Object.keys(columnFilters).forEach(column => {
      const filterValue = columnFilters[column];
      if (filterValue) {
        filteredEntries = filteredEntries.filter(entry => {
          const value = entry[column] || '';
          return value.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filteredEntries.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredEntries;
  };

  const handleRowClick = (item: any, index: number) => {
    // Find related objednavky for this Spis entry
    const relatedObjednavky = objednavkyData.filter(order =>
      order.parentSpisId === item.cisloCP
    ).map(order => ({
      nazov: order.nazov || '',
      vypracoval: order.vypracoval || '',
      datum: order.datum || '',
      popis: order.popis || '',
      cisloObjednavky: order.cisloObjednavky || '',
      dorucene: order.dorucene || ''
    }));

    // If we have full form data saved, use it; otherwise construct from basic fields
    if (item.fullFormData) {
      setFormData({
        ...item.fullFormData,
        objednavkyItems: relatedObjednavky.length > 0 ? relatedObjednavky : item.fullFormData.objednavkyItems || []
      });
    } else {
      // Legacy support - construct from basic fields
      setFormData({
        // Ochrana section
        predmet: item.cisloCP || '',
        cisloZakazky: item.cisloZakazky || '',
        odsuhlesenaKS1: '',
        odsuhlesenaKS2: '',
        ochranaDatum: '',
        firma: item.firma || '',
        vypracoval: item.spracovatel || '',
        stav: item.stav || '',
        kategoria: item.kategoria || '',
        sprostredkovatel: '',
        vybavene: false,
        terminDokoncenia: item.terminDodania ? (() => {
          try {
            const parts = item.terminDodania.split('.');
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

        // Financie section
        provizia: '0',
        cena: '0',
        zaloha1: '0',
        zaloha1Datum: '',
        zaloha2: '0',
        zaloha2Datum: '',
        doplatok: '0',
        doplatokDatum: '',

        // Konečný zákazník
        meno: item.kontaktnaOsoba?.split(' ')[0] || '',
        priezvisko: item.kontaktnaOsoba?.split(' ').slice(1).join(' ') || '',
        telefon: '',
        email: '',
        ulica: '',
        ico: '',
        mesto: '',
        psc: '',
        icDph: '',
        dic: '',
        popisProjektu: item.popis || '',

        // Architekt
        architektonickyPriezvisko: item.architekt?.split(' ')[0] || '',
        architektonickeMeno: item.architekt?.split(' ').slice(1).join(' ') || '',
        architektonickyTelefon: '',
        architektonickyEmail: '',
        architektonickyUlica: '',
        architektonickyIco: '',
        architektonickyMesto: '',
        architektonickyPsc: '',
        architektonickyIcDph: '',
        architektonickyDic: '',

        // Realizátor
        realizatorPriezvisko: item.realizator?.split(' ')[0] || '',
        realizatorMeno: item.realizator?.split(' ').slice(1).join(' ') || '',
        realizatorTelefon: '',
        realizatorEmail: '',
        realizatorUlica: '',
        realizatorIco: '',
        realizatorMesto: '',
        realizatorPsc: '',
        realizatorIcDph: '',
        realizatorDic: '',

        // Kontaktná osoba
        kontaktnaPriezvisko: '',
        kontaktnaMeno: '',
        kontaktnaTelefon: '',
        kontaktnaEmail: '',

        // Fakturácia
        fakturaciaTyp: 'nepouzit',
        fakturaciaK10: false,
        fakturaciaPriezvisko: '',
        fakturaciaMeno: '',
        fakturaciaAdresa: '',

        // Popis items
        popisItems: [],

        // Cenové ponuky
        cenovePonukyItems: [],

        // Objednávky
        objednavkyItems: relatedObjednavky,

        // Emaily
        emailKomu: '',
        emailKomuText: '',
        emailPredmet: item.cisloCP || '',
        emailText: '',
        emailItems: [],

        // Meranie
        meranieItems: [],

        // Výrobné výkresy
        vyrobneVykresy: [],
      });
    }

    setEditingIndex(index);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSaveEntry = () => {
    const entryData = {
      // Main table display fields
      stav: formData.stav || 'CP',
      cisloCP: formData.predmet || `CP2025/${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
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
      fullFormData: { ...formData }
    };

    // Save Konečný zákazník contact
    if (formData.priezvisko || formData.meno || formData.email || formData.telefon) {
      addContact({
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
        projectIds: [entryData.cisloCP]
      });
    }

    // Save Architekt - sprostredkovateľ contact
    if (formData.architektonickyPriezvisko || formData.architektonickeMeno) {
      addContact({
        meno: formData.architektonickeMeno || '',
        priezvisko: formData.architektonickyPriezvisko || '',
        telefon: '',
        email: '',
        ulica: '',
        mesto: '',
        psc: '',
        ico: '',
        icDph: '',
        typ: 'architekt',
        projectIds: [entryData.cisloCP]
      });
    }

    // Add firma to options if it's new
    if (formData.firma && !firmaOptions.includes(formData.firma)) {
      const newFirmaOptions = [...firmaOptions, formData.firma];
      setFirmaOptions(newFirmaOptions);
      try {
        const storageKey = user ? `firmaOptions_${user.id}` : 'firmaOptions';
        localStorage.setItem(storageKey, JSON.stringify(newFirmaOptions));
      } catch (error) {
        console.error('Failed to save firmaOptions:', error);
      }
    }

    // Save objednavky data if any exist
    if (formData.objednavkyItems && formData.objednavkyItems.length > 0) {
      const objednavkyEntries = formData.objednavkyItems.map(item => ({
        ...item,
        // Add data from vseobecne tab
        firma: formData.firma,
        menoZakaznika: `${formData.meno} ${formData.priezvisko}`.trim(),
        cisloZakazky: formData.cisloZakazky,
        odoslane: item.datum ? new Date(item.datum).toLocaleDateString('sk-SK') : '',
        parentSpisId: entryData.cisloCP // Link to parent Spis entry
      }));

      setObjednavkyData(prev => {
        const updated = [...prev, ...objednavkyEntries];
        try {
          const storageKey = user ? `objednavkyData_${user.id}` : 'objednavkyData';
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save objednavkyData:', error);
          if (error instanceof DOMException && error.code === 22) {
            alert('Nedostatok miesta v úložisku. Objednávky nemožno uložiť.');
          }
        }
        return updated;
      });
    }

    if (isEditMode && editingIndex !== null) {
      // Update existing entry
      setEntries(prev => {
        const updated = [...prev];
        updated[editingIndex] = entryData;
        try {
          const storageKey = user ? `spisEntries_${user.id}` : 'spisEntries';
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save spisEntries:', error);
          if (error instanceof DOMException && error.code === 22) {
            alert('Nedostatok miesta v úložisku. Záznam nemožno uložiť.');
          }
        }
        return updated;
      });
    } else {
      // Add new entry
      setEntries(prev => {
        const updated = [...prev, entryData];
        try {
          const storageKey = user ? `spisEntries_${user.id}` : 'spisEntries';
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save spisEntries:', error);
          if (error instanceof DOMException && error.code === 22) {
            alert('Nedostatok miesta v úložisku. Záznam nemožno uložiť.');
          }
        }
        return updated;
      });
    }
    
    // Reset form
    setFormData({
      // Ochrana section
      predmet: 'CP2025/0365',
      cisloZakazky: '',
      odsuhlesenaKS1: '',
      odsuhlesenaKS2: '',
      ochranaDatum: '',
      firma: '',
      vypracoval: '',
      stav: '',
      kategoria: '',
      sprostredkovatel: '',
      vybavene: false,
      terminDokoncenia: '',

      // Financie section
      provizia: '0',
      cena: '0',
      zaloha1: '0',
      zaloha1Datum: '',
      zaloha2: '0',
      zaloha2Datum: '',
      doplatok: '0',
      doplatokDatum: '',

      // Konečný zákazník
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

      // Architekt
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

      // Realizátor
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

      // Kontaktná osoba
      kontaktnaPriezvisko: '',
      kontaktnaMeno: '',
      kontaktnaTelefon: '',
      kontaktnaEmail: '',

      // Fakturácia
      fakturaciaTyp: 'nepouzit',
      fakturaciaK10: false,
      fakturaciaPriezvisko: '',
      fakturaciaMeno: '',
      fakturaciaAdresa: '',

      // Popis items
      popisItems: [],

      // Cenové ponuky
      cenovePonukyItems: [],

      // Objednávky
      objednavkyItems: [],

      // Emaily
      emailKomu: '',
      emailKomuText: '',
      emailPredmet: '',
      emailText: '',
      emailItems: [],

      // Meranie
      meranieItems: [],

      // Výrobné výkresy
      vyrobneVykresy: [],
    });
    
    // Reset edit mode
    setIsEditMode(false);
    setEditingIndex(null);
    setShowModal(false);
  };

  return (
    <div className={`h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Spis</h1>
        <button
          onClick={() => {
            setIsEditMode(false);
            setEditingIndex(null);
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-[#e11b28] text-white rounded-lg hover:bg-[#c71325] transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Pridať
        </button>
      </div>
      

      {/* Table Section */}
      <div className={`rounded-lg shadow-md overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <table className="w-full text-xs">
          <thead className={`sticky top-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <tr>
              {[
                { key: 'stav', label: 'Stav' },
                { key: 'cisloCP', label: 'Číslo CP' },
                { key: 'cisloZakazky', label: 'Číslo zákazky' },
                { key: 'datum', label: 'Dátum' },
                { key: 'kontaktnaOsoba', label: 'Konečný zákazník' },
                { key: 'architekt', label: 'Architekt' },
                { key: 'realizator', label: 'Realizátor' },
                { key: 'popis', label: 'Popis' },
                { key: 'firma', label: 'Firma' },
                { key: 'spracovatel', label: 'Vypracoval' },
                { key: 'kategoria', label: 'Kategória' },
                { key: 'terminDodania', label: 'Termín dokončenia' }
              ].map((column, index, array) => (
                <th
                  key={column.key}
                  className={`px-2 py-2 text-left text-xs font-medium transition-all ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  } ${index < array.length - 1 ? (isDark ? 'border-r border-gray-600' : 'border-r border-gray-200') : ''}`}
                >
                  {activeSearchColumn === column.key ? (
                    <div className="flex items-center gap-2" style={{ animation: 'slideIn 0.2s ease-out' }}>
                      <svg className="w-4 h-4 flex-shrink-0 text-gray-400" style={{ animation: 'fadeIn 0.3s ease-out' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder={`Search...`}
                        value={columnFilters[column.key] || ''}
                        onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                        onBlur={() => {
                          if (!columnFilters[column.key]) {
                            setActiveSearchColumn(null);
                          }
                        }}
                        autoFocus
                        style={{ animation: 'expandWidth 0.25s ease-out' }}
                        className={`w-full text-xs px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#e11b28] transition-all ${
                          isDark ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {columnFilters[column.key] && (
                        <button
                          onClick={() => {
                            handleColumnFilter(column.key, '');
                            setActiveSearchColumn(null);
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => handleSort(column.key)}
                        className="cursor-pointer hover:text-[#e11b28] transition-colors"
                      >
                        {column.label}
                        {sortConfig?.key === column.key && (
                          <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                      <button
                        onClick={() => setActiveSearchColumn(column.key)}
                        className={`ml-2 p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
                          columnFilters[column.key] ? 'text-[#e11b28]' : ''
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getSortedAndFilteredEntries().map((item, index) => {
              const isHighlighted = highlightedProjectIds.includes(item.cisloCP);
              return (
              <tr
                key={item.cisloCP || `entry-${index}`}
                ref={(el) => {
                  if (el) highlightedRowRefs.current[item.cisloCP] = el;
                }}
                className={`border-b cursor-pointer transition-colors ${
                  isDark
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:bg-blue-50'
                } ${isHighlighted ? 'ring-2 ring-red-500 ring-inset' : ''}`}
                onClick={() => handleRowClick(item, index)}
              >
                <td className={`px-2 py-1 text-xs ${isDark ? 'border-r border-gray-700' : 'border-r border-gray-200'} ${
                  item.color === 'yellow' ? 'bg-yellow-100' :
                  item.color === 'red' ? 'bg-red-100' : ''
                }`}>{item.stav}</td>
                <td className={`px-2 py-1 text-xs font-medium text-[#e11b28] ${isDark ? 'border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.cisloCP}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.cisloZakazky}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.datum}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.kontaktnaOsoba}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.architekt}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.realizator}</td>
                <td className={`px-2 py-1 text-xs max-w-xs truncate ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.popis}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.firma}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.spracovatel}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{item.kategoria}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300' : ''}`}>{item.terminDodania}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-7xl h-full overflow-hidden flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modal Tabs with Close Button */}
            <div className={`flex border-b flex-shrink-0 justify-between items-center ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex">
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
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                      activeTab === tab.id
                        ? `border-[#e11b28] text-[#e11b28] ${isDark ? 'bg-gray-800' : 'bg-white'}`
                        : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsEditMode(false);
                  setEditingIndex(null);
                }}
                className={`p-2 mr-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content with Action Buttons */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex flex-1 overflow-hidden p-4 gap-4">
                {/* Left Sidebar - only show on first tab */}
                {activeTab === 'vseobecne' && (
                  <div className={`w-80 border rounded-lg overflow-y-auto shadow-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="p-2">
                  {/* Ochrana section */}
                  <div className="mb-2">
                    <h3 className={`text-xs font-semibold mb-1 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ochrana</h3>
                    <div className="space-y-1 text-xs">
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Číslo CP</label>
                          <input 
                            type="text" 
                            value={formData.predmet} 
                            onChange={(e) => setFormData(prev => ({...prev, predmet: e.target.value}))}
                            placeholder="CP2025/xxxx"
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" 
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Číslo zákazky</label>
                          <input 
                            type="text" 
                            value={formData.cisloZakazky}
                            onChange={(e) => setFormData(prev => ({...prev, cisloZakazky: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" 
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs w-24 flex-shrink-0">Odsúhlasená KS</span>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={formData.odsuhlesenaKS1}
                              onChange={(e) => setFormData(prev => ({...prev, odsuhlesenaKS1: e.target.value}))}
                              className="w-8 text-xs border border-gray-300 px-1 py-1 rounded"
                            />
                            <input
                              type="text"
                              value={formData.odsuhlesenaKS2}
                              onChange={(e) => setFormData(prev => ({...prev, odsuhlesenaKS2: e.target.value}))}
                              className="w-8 text-xs border border-gray-300 px-1 py-1 rounded"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Dátum</label>
                          <input
                            type="date"
                            value={formData.ochranaDatum}
                            onChange={(e) => setFormData(prev => ({...prev, ochranaDatum: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Firma</label>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={formData.firma}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({...prev, firma: value}));
                                
                                // Filter options based on input
                                const filtered = firmaOptions.filter(option => 
                                  option.toLowerCase().includes(value.toLowerCase())
                                );
                                setFilteredFirmaOptions(filtered);
                                setShowFirmaDropdown(value.length > 0 && filtered.length > 0);
                              }}
                              onFocus={() => {
                                setFilteredFirmaOptions(firmaOptions);
                                setShowFirmaDropdown(firmaOptions.length > 0);
                              }}
                              onBlur={() => {
                                // Delay hiding to allow click on dropdown
                                setTimeout(() => setShowFirmaDropdown(false), 150);
                              }}
                              placeholder="Zadajte alebo vyberte firmu"
                              className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                            />
                            {showFirmaDropdown && filteredFirmaOptions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-md z-50 max-h-32 overflow-y-auto">
                                {firmaOptions.map((option) => (
                                  <div
                                    key={option}
                                    onClick={() => {
                                      setFormData(prev => ({...prev, firma: option}));
                                      setShowFirmaDropdown(false);
                                    }}
                                    className="px-2 py-1 text-xs cursor-pointer hover:bg-gray-100"
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Vypracoval</label>
                          <input 
                            type="text" 
                            value={formData.vypracoval}
                            onChange={(e) => setFormData(prev => ({...prev, vypracoval: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" 
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Stav</label>
                          <select 
                            value={formData.stav}
                            onChange={(e) => setFormData(prev => ({...prev, stav: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          >
                            <option value="">Vyberte stav</option>
                            <option value="CP">CP</option>
                            <option value="Výroba">Výroba</option>
                            <option value="Záloha FA">Záloha FA</option>
                            <option value="Zrušené">Zrušené</option>
                            <option value="Dokončené">Dokončené</option>
                            <option value="Rozpracované">Rozpracované</option>
                            <option value="Uzavreté">Uzavreté</option>
                          </select>
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Kategória</label>
                          <select
                            value={formData.kategoria}
                            onChange={(e) => setFormData(prev => ({...prev, kategoria: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          >
                            <option value=""></option>
                            <option value="Okná">Okná</option>
                            <option value="Dvere">Dvere</option>
                            <option value="Iné">Iné</option>
                          </select>
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Sprostredkovateľ</label>
                          <select
                            value={formData.sprostredkovatel}
                            onChange={(e) => setFormData(prev => ({...prev, sprostredkovatel: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          >
                            <option value=""></option>
                          </select>
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-24 flex-shrink-0"></div>
                          <div className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={formData.vybavene}
                              onChange={(e) => setFormData(prev => ({...prev, vybavene: e.target.checked}))}
                              className="mr-1"
                            />
                            <label>Vybavené</label>
                          </div>
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-24 flex-shrink-0">Termín dokončenia</label>
                          <input 
                            type="date" 
                            value={formData.terminDokoncenia || ''}
                            onChange={(e) => setFormData(prev => ({...prev, terminDokoncenia: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financie section */}
                  <div className="mb-2">
                    <h3 className="text-xs font-semibold text-gray-700 mb-1 px-1">Financie</h3>
                    <div className="space-y-1 text-xs bg-gray-100 rounded p-1 border">
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Provízia</label>
                          <input
                            type="text"
                            value={formData.provizia}
                            onChange={(e) => setFormData(prev => ({...prev, provizia: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Cena</label>
                          <input
                            type="text"
                            value={formData.cena}
                            onChange={(e) => setFormData(prev => ({...prev, cena: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Záloha 1</label>
                          <input
                            type="text"
                            value={formData.zaloha1}
                            onChange={(e) => setFormData(prev => ({...prev, zaloha1: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Dátum</label>
                          <input
                            type="date"
                            value={formData.zaloha1Datum}
                            onChange={(e) => setFormData(prev => ({...prev, zaloha1Datum: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Záloha 2</label>
                          <input
                            type="text"
                            value={formData.zaloha2}
                            onChange={(e) => setFormData(prev => ({...prev, zaloha2: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Dátum</label>
                          <input
                            type="date"
                            value={formData.zaloha2Datum}
                            onChange={(e) => setFormData(prev => ({...prev, zaloha2Datum: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Doplatok</label>
                          <input
                            type="text"
                            value={formData.doplatok}
                            onChange={(e) => setFormData(prev => ({...prev, doplatok: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-600 text-xs w-20 flex-shrink-0">Dátum</label>
                          <input
                            type="date"
                            value={formData.doplatokDatum}
                            onChange={(e) => setFormData(prev => ({...prev, doplatokDatum: e.target.value}))}
                            className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                {activeTab === 'vseobecne' && (
                  <div className="p-2 pb-4">
                    {/* Konečný zákazník section */}
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Konečný zákazník</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input 
                            type="text" 
                            placeholder="Priezvisko" 
                            value={formData.priezvisko}
                            onChange={(e) => setFormData(prev => ({...prev, priezvisko: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded" 
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            placeholder="Meno" 
                            value={formData.meno}
                            onChange={(e) => setFormData(prev => ({...prev, meno: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded" 
                          />
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            placeholder="Telefón"
                            value={formData.telefon}
                            onChange={(e) => setFormData(prev => ({...prev, telefon: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Ulica"
                            value={formData.ulica}
                            onChange={(e) => setFormData(prev => ({...prev, ulica: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="IČO"
                            value={formData.ico}
                            onChange={(e) => setFormData(prev => ({...prev, ico: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="Mesto"
                              value={formData.mesto}
                              onChange={(e) => setFormData(prev => ({...prev, mesto: e.target.value}))}
                              className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                            <input
                              type="text"
                              placeholder="PSČ"
                              value={formData.psc}
                              onChange={(e) => setFormData(prev => ({...prev, psc: e.target.value}))}
                              className="w-16 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="IČ DPH"
                              value={formData.icDph}
                              onChange={(e) => setFormData(prev => ({...prev, icDph: e.target.value}))}
                              className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                            <input
                              type="text"
                              placeholder="DIČ"
                              value={formData.dic}
                              onChange={(e) => setFormData(prev => ({...prev, dic: e.target.value}))}
                              className="w-16 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Popis"
                            value={formData.popisProjektu}
                            onChange={(e) => setFormData(prev => ({...prev, popisProjektu: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Architekt - sprostredkovateľ section */}
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Architekt - sprostredkovateľ</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Priezvisko"
                            value={formData.architektonickyPriezvisko}
                            onChange={(e) => setFormData(prev => ({...prev, architektonickyPriezvisko: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Meno"
                            value={formData.architektonickeMeno}
                            onChange={(e) => setFormData(prev => ({...prev, architektonickeMeno: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Telefón"
                            value={formData.architektonickyTelefon}
                            onChange={(e) => setFormData(prev => ({...prev, architektonickyTelefon: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Email"
                            value={formData.architektonickyEmail}
                            onChange={(e) => setFormData(prev => ({...prev, architektonickyEmail: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Ulica"
                            value={formData.architektonickyUlica}
                            onChange={(e) => setFormData(prev => ({...prev, architektonickyUlica: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="IČO"
                            value={formData.architektonickyIco}
                            onChange={(e) => setFormData(prev => ({...prev, architektonickyIco: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="Mesto"
                              value={formData.architektonickyMesto}
                              onChange={(e) => setFormData(prev => ({...prev, architektonickyMesto: e.target.value}))}
                              className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                            <input
                              type="text"
                              placeholder="PSČ"
                              value={formData.architektonickyPsc}
                              onChange={(e) => setFormData(prev => ({...prev, architektonickyPsc: e.target.value}))}
                              className="w-16 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="IČ DPH"
                              value={formData.architektonickyIcDph}
                              onChange={(e) => setFormData(prev => ({...prev, architektonickyIcDph: e.target.value}))}
                              className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                            <input
                              type="text"
                              placeholder="DIČ"
                              value={formData.architektonickyDic}
                              onChange={(e) => setFormData(prev => ({...prev, architektonickyDic: e.target.value}))}
                              className="w-16 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fakturačná firma section */}
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Fakturačná firma / Realizátor</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Priezvisko"
                            value={formData.realizatorPriezvisko}
                            onChange={(e) => setFormData(prev => ({...prev, realizatorPriezvisko: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Meno"
                            value={formData.realizatorMeno}
                            onChange={(e) => setFormData(prev => ({...prev, realizatorMeno: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Telefón"
                            value={formData.realizatorTelefon}
                            onChange={(e) => setFormData(prev => ({...prev, realizatorTelefon: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Email"
                            value={formData.realizatorEmail}
                            onChange={(e) => setFormData(prev => ({...prev, realizatorEmail: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Ulica"
                            value={formData.realizatorUlica}
                            onChange={(e) => setFormData(prev => ({...prev, realizatorUlica: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="IČO"
                            value={formData.realizatorIco}
                            onChange={(e) => setFormData(prev => ({...prev, realizatorIco: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>

                        <div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="Mesto"
                              value={formData.realizatorMesto}
                              onChange={(e) => setFormData(prev => ({...prev, realizatorMesto: e.target.value}))}
                              className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                            <input
                              type="text"
                              placeholder="PSČ"
                              value={formData.realizatorPsc}
                              onChange={(e) => setFormData(prev => ({...prev, realizatorPsc: e.target.value}))}
                              className="w-16 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="IČ DPH"
                              value={formData.realizatorIcDph}
                              onChange={(e) => setFormData(prev => ({...prev, realizatorIcDph: e.target.value}))}
                              className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                            <input
                              type="text"
                              placeholder="DIČ"
                              value={formData.realizatorDic}
                              onChange={(e) => setFormData(prev => ({...prev, realizatorDic: e.target.value}))}
                              className="w-16 text-xs border border-gray-300 px-2 py-1 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kontaktná osoba section */}
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Kontaktná osoba</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Priezvisko"
                            value={formData.kontaktnaPriezvisko}
                            onChange={(e) => setFormData(prev => ({...prev, kontaktnaPriezvisko: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Meno"
                            value={formData.kontaktnaMeno}
                            onChange={(e) => setFormData(prev => ({...prev, kontaktnaMeno: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Telefón"
                            value={formData.kontaktnaTelefon}
                            onChange={(e) => setFormData(prev => ({...prev, kontaktnaTelefon: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Email"
                            value={formData.kontaktnaEmail}
                            onChange={(e) => setFormData(prev => ({...prev, kontaktnaEmail: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fakturácia section */}
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Fakturácia</h3>
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2 text-xs">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="fakturacia"
                              checked={formData.fakturaciaTyp === 'pouzit'}
                              onChange={() => setFormData(prev => ({...prev, fakturaciaTyp: 'pouzit'}))}
                              className="mr-1"
                            />
                            Použiť
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.fakturaciaK10}
                              onChange={(e) => setFormData(prev => ({...prev, fakturaciaK10: e.target.checked}))}
                              className="mr-1"
                            />
                            K10
                          </label>
                          <button className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
                            Konečný zákazník
                          </button>
                          <button className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
                            Sprostredkovateľ
                          </button>
                          <button className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
                            Fakturačná firma / Realizátor
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="fakturacia"
                              checked={formData.fakturaciaTyp === 'nepouzit'}
                              onChange={() => setFormData(prev => ({...prev, fakturaciaTyp: 'nepouzit'}))}
                              className="mr-1"
                            />
                            Nepoužiť
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Priezvisko"
                            value={formData.fakturaciaPriezvisko}
                            onChange={(e) => setFormData(prev => ({...prev, fakturaciaPriezvisko: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Meno"
                            value={formData.fakturaciaMeno}
                            onChange={(e) => setFormData(prev => ({...prev, fakturaciaMeno: e.target.value}))}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <textarea
                          placeholder="Adresa"
                          value={formData.fakturaciaAdresa}
                          onChange={(e) => setFormData(prev => ({...prev, fakturaciaAdresa: e.target.value}))}
                          className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          rows={2}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

              {activeTab === 'cenove-ponuky' && (
                <div className="p-2 h-full">
                  <div className="h-full overflow-auto">
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2">Číslo CP</th>
                          <th className="border border-gray-300 px-3 py-2">Verzia</th>
                          <th className="border border-gray-300 px-3 py-2">Odoslané</th>
                          <th className="border border-gray-300 px-3 py-2">Vytvoril</th>
                          <th className="border border-gray-300 px-3 py-2">Popis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 20 }, (_, index) => (
                          <tr key={`row-${index}`}>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'vzor-nabytok' && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 text-lg">Bude doplnené neskôr s AI automatizáciou</p>
                  </div>
                </div>
              )}

              {activeTab === 'objednavky' && (
                <div className="p-2 h-full">
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        const newItem = {
                          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                          nazov: '',
                          vypracoval: '',
                          datum: '',
                          popis: '',
                          cisloObjednavky: '',
                          dorucene: ''
                        };
                        setFormData(prev => ({
                          ...prev,
                          objednavkyItems: [...prev.objednavkyItems, newItem]
                        }));
                      }}
                      className="px-3 py-1 bg-[#e11b28] text-white rounded text-xs hover:bg-[#c71325]"
                    >
                      Pridať objednávku
                    </button>
                  </div>
                  <div className="h-full overflow-auto">
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2">Názov</th>
                          <th className="border border-gray-300 px-3 py-2">Vytvoril</th>
                          <th className="border border-gray-300 px-3 py-2">Dátum</th>
                          <th className="border border-gray-300 px-3 py-2">Popis</th>
                          <th className="border border-gray-300 px-3 py-2">Číslo objednávky</th>
                          <th className="border border-gray-300 px-3 py-2">Doručené</th>
                          <th className="border border-gray-300 px-3 py-2">Akcie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.objednavkyItems.map((item, index) => {
                          // Check if this is the highlighted order from navigation
                          const isHighlighted = selectedOrderIndex !== null && 
                            objednavkyData[selectedOrderIndex] && 
                            objednavkyData[selectedOrderIndex].nazov === item.nazov &&
                            objednavkyData[selectedOrderIndex].cisloObjednavky === item.cisloObjednavky;
                          
                          return (
                            <tr key={item.id || `objednavka-${index}`} className={isHighlighted ? 'bg-yellow-100 border-yellow-400' : ''}>
                              <td className="border border-gray-300 px-1 py-1">
                                <input 
                                  type="text" 
                                  value={item.nazov}
                                  onChange={(e) => {
                                    const updated = [...formData.objednavkyItems];
                                    updated[index].nazov = e.target.value;
                                    setFormData(prev => ({...prev, objednavkyItems: updated}));
                                  }}
                                  className={`w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1 ${isHighlighted ? 'bg-yellow-50' : ''}`}
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-1">
                                <input 
                                  type="text" 
                                  value={item.vypracoval}
                                  onChange={(e) => {
                                    const updated = [...formData.objednavkyItems];
                                    updated[index].vypracoval = e.target.value;
                                    setFormData(prev => ({...prev, objednavkyItems: updated}));
                                  }}
                                  className={`w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1 ${isHighlighted ? 'bg-yellow-50' : ''}`}
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-1">
                                <input 
                                  type="date" 
                                  value={item.datum}
                                  onChange={(e) => {
                                    const updated = [...formData.objednavkyItems];
                                    updated[index].datum = e.target.value;
                                    setFormData(prev => ({...prev, objednavkyItems: updated}));
                                  }}
                                  className={`w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1 ${isHighlighted ? 'bg-yellow-50' : ''}`}
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-1">
                                <input 
                                  type="text" 
                                  value={item.popis}
                                  onChange={(e) => {
                                    const updated = [...formData.objednavkyItems];
                                    updated[index].popis = e.target.value;
                                    setFormData(prev => ({...prev, objednavkyItems: updated}));
                                  }}
                                  className={`w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1 ${isHighlighted ? 'bg-yellow-50' : ''}`}
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-1">
                                <input 
                                  type="text" 
                                  value={item.cisloObjednavky}
                                  onChange={(e) => {
                                    const updated = [...formData.objednavkyItems];
                                    updated[index].cisloObjednavky = e.target.value;
                                    setFormData(prev => ({...prev, objednavkyItems: updated}));
                                  }}
                                  className={`w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1 ${isHighlighted ? 'bg-yellow-50' : ''}`}
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-1">
                                <input 
                                  type="text" 
                                  value={item.dorucene}
                                  onChange={(e) => {
                                    const updated = [...formData.objednavkyItems];
                                    updated[index].dorucene = e.target.value;
                                    setFormData(prev => ({...prev, objednavkyItems: updated}));
                                  }}
                                  className={`w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1 ${isHighlighted ? 'bg-yellow-50' : ''}`}
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-1">
                                <button
                                  onClick={() => {
                                    const updated = formData.objednavkyItems.filter((_, i) => i !== index);
                                    setFormData(prev => ({...prev, objednavkyItems: updated}));
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                >
                                  Odstrániť
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {formData.objednavkyItems.length === 0 && (
                          <tr>
                            <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                              Žiadne objednávky. Kliknite "Pridať objednávku" pre vytvorenie novej.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'emaily' && (
                <div className="p-2">
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded border border-gray-400"></div>
                      <span className="text-xs">Odoslať</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Komu</label>
                      <div className="flex gap-1">
                        <select className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded">
                          <option></option>
                        </select>
                        <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                    </div>
                    <div></div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Predmet</label>
                      <input type="text" defaultValue="CP2025/0365" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                    <div></div>
                  </div>
                  <div className="mt-4">
                    <textarea 
                      className="w-full text-xs border border-gray-300 px-2 py-1 rounded" 
                      rows={12}
                      placeholder="T"
                    ></textarea>
                  </div>
                  <div className="mt-4">
                    <table className="w-full text-xs border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1">Popis</th>
                          <th className="border border-gray-300 px-2 py-1">Názov</th>
                          <th className="border border-gray-300 px-2 py-1">Dátum</th>
                          <th className="border border-gray-300 px-2 py-1">Vývojí</th>
                          <th className="border border-gray-300 px-2 py-1">Stav</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-8"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-8"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-8"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'meranie-dokumenty' && (
                <div className="p-2 h-full">
                  <div className="h-full overflow-auto">
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2">Dátum</th>
                          <th className="border border-gray-300 px-3 py-2">Popis</th>
                          <th className="border border-gray-300 px-3 py-2">Pridať</th>
                          <th className="border border-gray-300 px-3 py-2">Zodpovedný</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 20 }, (_, index) => (
                          <tr key={`row-${index}`}>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'fotky' && (
                <div className="p-2">
                  {/* Upload Section */}
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Pridať fotky projektu</h3>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => {
                            const url = URL.createObjectURL(file);
                            const newPhoto = {
                              id: Date.now() + Math.random().toString(),
                              file,
                              url,
                              description: ''
                            };
                            setUploadedPhotos(prev => [...prev, newPhoto]);
                          });
                          e.target.value = ''; // Reset input
                        }}
                        className="text-xs"
                      />
                      <span className="text-xs text-gray-600">Vyberte fotky na nahranie</span>
                    </div>
                  </div>

                  {/* Photos Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedPhotos.map(photo => (
                      <div key={photo.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                          <img
                            src={photo.url}
                            alt={photo.description || 'Project'}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <input 
                            type="text" 
                            placeholder="Popis fotky..."
                            value={photo.description}
                            onChange={(e) => {
                              setUploadedPhotos(prev => 
                                prev.map(p => 
                                  p.id === photo.id 
                                    ? {...p, description: e.target.value}
                                    : p
                                )
                              );
                            }}
                            className="w-full text-xs border border-gray-300 px-2 py-1 rounded"
                          />
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">{photo.file.name}</span>
                            <button
                              onClick={() => {
                                URL.revokeObjectURL(photo.url);
                                setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id));
                              }}
                              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                            >
                              Odstrániť
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {uploadedPhotos.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Zatiaľ nie sú nahrané žiadne fotky</p>
                      <p className="text-xs mt-1">Nahrajte fotky na zobrazenie priebehu projektu</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'vyrobne-vykresy' && (
                <div className="p-2 h-full">
                  <div className="h-full overflow-auto">
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2">Popis</th>
                          <th className="border border-gray-300 px-3 py-2">Názov</th>
                          <th className="border border-gray-300 px-3 py-2">Odoslané</th>
                          <th className="border border-gray-300 px-3 py-2">Vytvoril</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 20 }, (_, index) => (
                          <tr key={`row-${index}`}>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input type="text" className="w-full h-8 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 rounded px-1" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'technicke-vykresy' && (
                <div className="p-2 h-full">
                  <div className="h-full overflow-auto">
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-200">
                            Názov ▼
                          </th>
                          <th className="border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-200">
                            Dátum ▼
                          </th>
                          <th className="border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-200">
                            Kategória ▼
                          </th>
                          <th className="border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-200">
                            Dodávateľ ▼
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicalData.map((doc) => (
                          <tr key={`${doc.nazov}-${doc.datum}`} className="border-b hover:bg-gray-50 bg-white">
                            <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-[#e11b28]">
                              {doc.nazov}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {doc.datum}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {doc.kategoria}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {doc.dodavatel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                </div>

                {/* Vertical Action Buttons Sidebar */}
                <div className="w-32 bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex flex-col justify-center gap-3 p-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setIsEditMode(false);
                      setEditingIndex(null);
                    }}
                    className="px-3 py-3 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-center transition-colors font-medium"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-3 py-3 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-center transition-colors font-medium"
                  >
                    Pridať vzor
                  </button>
                  <button 
                    onClick={handleSaveEntry}
                    className="px-3 py-3 text-sm text-white bg-[#e11b28] rounded-lg hover:bg-[#c71325] text-center transition-colors font-medium"
                  >
                    {isEditMode ? 'Uložiť' : 'OK'}
                  </button>
                  <button className="px-3 py-3 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-center transition-colors font-medium">
                    Obnovit
                  </button>
                </div>
              </div>

              {/* Popis section - full width below main content, only for vseobecne tab */}
              {activeTab === 'vseobecne' && (
                <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Popis</h3>
                  <table className="w-full text-xs border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2">Dátum</th>
                        <th className="border border-gray-300 px-3 py-2">Popis</th>
                        <th className="border border-gray-300 px-3 py-2">Pridať</th>
                        <th className="border border-gray-300 px-3 py-2">Zospovedný</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 h-10"></td>
                        <td className="border border-gray-300 px-3 py-2"></td>
                        <td className="border border-gray-300 px-3 py-2"></td>
                        <td className="border border-gray-300 px-3 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Spis;