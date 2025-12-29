import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useContacts, Contact } from '../../../contexts/ContactsContext';
import { SpisEntry, SpisFormData, CenovaPonukaItem } from '../types';
import { calculateDvereTotals, calculateNabytokTotals, calculateSchodyTotals, calculatePuzdraTotals } from '../utils/priceCalculations';
import { ContactChange, ContactAction, SectionActions, detectContactChanges } from '../components/ContactChangesModal';
import { supabase } from '../../../lib/supabase';

// Helper to compare relevant contact fields
const hasContactChanged = (existing: Contact, formData: SpisFormData, type: 'zakaznik' | 'architekt' | 'realizator'): boolean => {
  if (type === 'zakaznik') {
    return (
      existing.meno !== (formData.meno || '') ||
      existing.priezvisko !== (formData.priezvisko || '') ||
      existing.telefon !== (formData.telefon || '') ||
      existing.email !== (formData.email || '') ||
      existing.ulica !== (formData.ulica || '') ||
      existing.mesto !== (formData.mesto || '') ||
      existing.psc !== (formData.psc || '') ||
      existing.ico !== (formData.ico || '') ||
      existing.icDph !== (formData.icDph || '') ||
      existing.dic !== (formData.dic || '')
    );
  } else if (type === 'architekt') {
    return (
      existing.meno !== (formData.architektonickeMeno || '') ||
      existing.priezvisko !== (formData.architektonickyPriezvisko || '') ||
      existing.telefon !== (formData.architektonickyTelefon || '') ||
      existing.email !== (formData.architektonickyEmail || '') ||
      existing.ulica !== (formData.architektonickyUlica || '') ||
      existing.mesto !== (formData.architektonickyMesto || '') ||
      existing.psc !== (formData.architektonickyPsc || '') ||
      existing.ico !== (formData.architektonickyIco || '') ||
      existing.icDph !== (formData.architektonickyIcDph || '') ||
      existing.dic !== (formData.architektonickyDic || '')
    );
  } else { // realizator
    return (
      existing.meno !== (formData.realizatorMeno || '') ||
      existing.priezvisko !== (formData.realizatorPriezvisko || '') ||
      existing.telefon !== (formData.realizatorTelefon || '') ||
      existing.email !== (formData.realizatorEmail || '') ||
      existing.ulica !== (formData.realizatorUlica || '') ||
      existing.mesto !== (formData.realizatorMesto || '') ||
      existing.psc !== (formData.realizatorPsc || '') ||
      existing.ico !== (formData.realizatorIco || '') ||
      existing.icDph !== (formData.realizatorIcDph || '') ||
      existing.dic !== (formData.realizatorDic || '')
    );
  }
};

export const useSpisEntryLogic = (
  initialEntry: SpisEntry | null,
  entries: SpisEntry[],
  isOpen: boolean,
  setFirmaOptions: (options: string[]) => void,
  firmaOptions: string[],
  onSave: (entryData: SpisEntry) => void
) => {
  const { user } = useAuth();
  const { addContact, updateContact, getContactById, getContactByNameAndType, forkContact } = useContacts();
  const [activeTab, setActiveTab] = useState('vseobecne');
  const [uploadedPhotos, setUploadedPhotos] = useState<{id: string, file: File, url: string, description: string, storagePath?: string}[]>([]);
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    const loadUserPhone = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('phone')
            .eq('user_id', user.id)
            .single();

          if (!error && data) {
            setUserPhone(data.phone || '');
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      }
    };
    loadUserPhone();
  }, [user]);
  
  // Internal ID to ensure stable identity across auto-saves
  // This ID gets updated after first save to match the database-generated UUID
  const [internalId, setInternalId] = useState<string>(() => initialEntry?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9));

  // Update internalId when initialEntry changes (e.g., after first save when we get the database UUID)
  useEffect(() => {
    if (initialEntry?.id && initialEntry.id !== internalId) {
      setInternalId(initialEntry.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntry?.id]);

  // State for the "Pridať vzor" sub-modal
  const [showVzorModal, setShowVzorModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingOfferData, setEditingOfferData] = useState<{type: 'dvere' | 'nabytok' | 'schody' | 'puzdra', data: any, cisloCP?: string} | undefined>(undefined);
  
  // State for "Pridať objednávku" modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrderData, setEditingOrderData] = useState<any>(undefined); // Using 'any' (PuzdraData) to avoid circular dep issues in hook if types not imported
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderNumber, setEditingOrderNumber] = useState<string | null>(null);

  // State for contact changes modal
  const [showContactChangesModal, setShowContactChangesModal] = useState(false);
  const [pendingContactChanges, setPendingContactChanges] = useState<ContactChange[]>([]);

  // Ref to hold the initial formData for comparison later
  const initialFormDataRef = useRef<SpisFormData | null>(null);
  
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
    zakaznikId: undefined, // Ensure ID is part of formData

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
    architektId: undefined, // Ensure ID is part of formData

    // Všeobecné - Fakturačná firma / Realizátor
    realizatorId: undefined,
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
    fakturaciaSource: '', // Default empty
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
        initialFormDataRef.current = loadedData; // Store initial state for comparison
        
        // Load photos
        if (initialEntry.fullFormData.fotky) {
           const loadedPhotos = initialEntry.fullFormData.fotky.map((p: any) => ({
             id: p.id,
             file: new File([""], p.name, { type: p.type }),
             url: p.storagePath ? p.url : p.base64, // Use URL if storagePath exists, otherwise base64
             description: p.description,
             storagePath: p.storagePath
           }));
           setUploadedPhotos(loadedPhotos);
        } else {
           setUploadedPhotos([]);
        }
      }
    } else if (isOpen && !initialEntry) {
      // Reset to fresh state when creating new
      const newData = createDefaultFormData();
      setFormData(newData);
      setLastSavedJson(JSON.stringify(newData));
      initialFormDataRef.current = newData; // Store initial state
    }
  }, [isOpen, initialEntry, createDefaultFormData]);

  // Function to detect contact changes
  const detectAllContactChanges = useCallback((): ContactChange[] => {
    const allChanges: ContactChange[] = [];
    console.log('[detectAllContactChanges] Checking IDs:', {
      zakaznikId: formData.zakaznikId,
      architektId: formData.architektId,
      realizatorId: formData.realizatorId
    });

    // Check customer (zakaznik)
    if (formData.zakaznikId) {
      const existingCustomer = getContactById(formData.zakaznikId);
      console.log('[detectAllContactChanges] Customer found:', !!existingCustomer);
      if (existingCustomer) {
        const customerChanges = detectContactChanges(existingCustomer, formData, 'zakaznik');
        allChanges.push(...customerChanges);
      }
    }

    // Check architect
    if (formData.architektId) {
      const existingArchitect = getContactById(formData.architektId);
      console.log('[detectAllContactChanges] Architect found:', !!existingArchitect);
      if (existingArchitect) {
        const architectChanges = detectContactChanges(existingArchitect, formData, 'architekt');
        allChanges.push(...architectChanges);
      }
    }

    // Check realizator
    if (formData.realizatorId) {
      const existingRealizator = getContactById(formData.realizatorId);
      console.log('[detectAllContactChanges] Realizator found:', !!existingRealizator);
      if (existingRealizator) {
        const realizatorChanges = detectContactChanges(existingRealizator, formData, 'realizator');
        allChanges.push(...realizatorChanges);
      }
    }

    return allChanges;
  }, [formData, getContactById]);

  const performSaveInternal = useCallback(async (contactActions?: { zakaznik?: ContactAction, architekt?: ContactAction, realizator?: ContactAction }) => {
    try {
      // Map photos to persistent format
      const persistentPhotos = uploadedPhotos.map(p => ({
        id: p.id,
        name: p.file.name,
        type: p.file.type,
        base64: p.storagePath ? '' : p.url, // Only store base64 if not in cloud storage
        url: p.storagePath ? p.url : '', // Store URL if in cloud storage
        storagePath: p.storagePath || '', // Storage path for Supabase
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

      const currentCisloCP = formData.predmet || getNextCP();

      // --- Contact Handling Logic (Customer) ---
      const zakaznikAction = contactActions?.zakaznik || 'update';
      if (zakaznikAction !== 'ignore') {
        let customerContactIdToSave = formData.zakaznikId;
        if (formData.priezvisko || formData.meno || formData.email || formData.telefon) {
          let existingCustomer = customerContactIdToSave ? getContactById(customerContactIdToSave) : undefined;

          // If not found by ID, try finding by name (for cases where ID wasn't stored initially)
          if (!existingCustomer && formData.meno && formData.priezvisko) {
              existingCustomer = getContactByNameAndType(formData.priezvisko, formData.meno, 'zakaznik');
              if (existingCustomer) customerContactIdToSave = existingCustomer.id; // Use this ID going forward
          }

          const isCustomerDataChanged = initialFormDataRef.current
            ? hasContactChanged(
                {...existingCustomer!, id: existingCustomer?.id || '', projectIds: [], dateAdded: ''}, // Cast to Contact for helper
                formData,
                'zakaznik'
              ) : false; // If no initial data, it's considered new or fully changed

          const customerData = {
            meno: formData.meno || '',
            priezvisko: formData.priezvisko || '',
            telefon: formData.telefon || '',
            email: formData.email || '',
            ulica: formData.ulica || '',
            mesto: formData.mesto || '',
            psc: formData.psc || '',
            ico: formData.ico || '',
            icDph: formData.icDph || '',
            dic: formData.dic || '',
            typ: 'zakaznik' as const,
            kontaktnaPriezvisko: formData.kontaktnaPriezvisko || '',
            kontaktnaMeno: formData.kontaktnaMeno || '',
            kontaktnaTelefon: formData.kontaktnaTelefon || '',
            kontaktnaEmail: formData.kontaktnaEmail || '',
            popis: formData.popisProjektu || '',
            projectIds: [currentCisloCP]
          };

          let customerContact: Contact;
          if (zakaznikAction === 'create_new') {
              // Force create a new contact (don't update existing)
              customerContact = await addContact(customerData);
              // Remove this project from the old contact's projectIds
              if (existingCustomer && existingCustomer.projectIds.includes(currentCisloCP)) {
                const updatedProjectIds = existingCustomer.projectIds.filter(pid => pid !== currentCisloCP);
                await updateContact(existingCustomer.id, { projectIds: updatedProjectIds });
              }
          } else if (existingCustomer && isCustomerDataChanged && existingCustomer.projectIds.length > 1) {
               customerContact = await forkContact(existingCustomer.id, customerData);
          } else {
               customerContact = await addContact({
                  ...customerData,
                  ...(customerContactIdToSave ? { id: customerContactIdToSave } : {})
               });
          }

          // Update formData with the ID of the contact that was actually saved/created
          setFormData(prev => ({ ...prev, zakaznikId: customerContact.id }));
          if (entryData.fullFormData) {
            entryData.fullFormData.zakaznikId = customerContact.id;
          }
        } else {
           // If contact fields are empty, ensure zakaznikId is cleared
           setFormData(prev => ({ ...prev, zakaznikId: undefined }));
           if (entryData.fullFormData) {
             entryData.fullFormData.zakaznikId = undefined;
           }
        }
      }

      // --- Contact Handling Logic (Architect) ---
      const architektAction = contactActions?.architekt || 'update';
      if (architektAction !== 'ignore') {
        let architectContactIdToSave = formData.architektId;
        if (formData.architektonickyPriezvisko || formData.architektonickeMeno || formData.architektonickyEmail || formData.architektonickyTelefon) {
          let existingArchitect = architectContactIdToSave ? getContactById(architectContactIdToSave) : undefined;

          // If not found by ID, try finding by name
          if (!existingArchitect && formData.architektonickeMeno && formData.architektonickyPriezvisko) {
              existingArchitect = getContactByNameAndType(formData.architektonickyPriezvisko, formData.architektonickeMeno, 'architekt');
              if (existingArchitect) architectContactIdToSave = existingArchitect.id;
          }

          const isArchitectDataChanged = initialFormDataRef.current
            ? hasContactChanged(
                {...existingArchitect!, id: existingArchitect?.id || '', projectIds: [], dateAdded: ''}, // Cast to Contact
                formData,
                'architekt'
              ) : false;

          const architectData = {
            meno: formData.architektonickeMeno || '',
            priezvisko: formData.architektonickyPriezvisko || '',
            telefon: formData.architektonickyTelefon || '',
            email: formData.architektonickyEmail || '',
            ulica: formData.architektonickyUlica || '',
            mesto: formData.architektonickyMesto || '',
            psc: formData.architektonickyPsc || '',
            ico: formData.architektonickyIco || '',
            icDph: formData.architektonickyIcDph || '',
            dic: formData.architektonickyDic || '',
            typ: 'architekt' as const,
            projectIds: [currentCisloCP]
          };

          let architectContact: Contact;
          if (architektAction === 'create_new') {
              // Force create a new contact (don't update existing)
              architectContact = await addContact(architectData);
              // Remove this project from the old contact's projectIds
              if (existingArchitect && existingArchitect.projectIds.includes(currentCisloCP)) {
                const updatedProjectIds = existingArchitect.projectIds.filter(pid => pid !== currentCisloCP);
                await updateContact(existingArchitect.id, { projectIds: updatedProjectIds });
              }
          } else if (existingArchitect && isArchitectDataChanged && existingArchitect.projectIds.length > 1) {
               architectContact = await forkContact(existingArchitect.id, architectData);
          } else {
               architectContact = await addContact({
                  ...architectData,
                  ...(architectContactIdToSave ? { id: architectContactIdToSave } : {})
               });
          }

          setFormData(prev => ({ ...prev, architektId: architectContact.id }));
          if (entryData.fullFormData) {
            entryData.fullFormData.architektId = architectContact.id;
          }
        } else {
           setFormData(prev => ({ ...prev, architektId: undefined }));
           if (entryData.fullFormData) {
             entryData.fullFormData.architektId = undefined;
           }
        }
      }

      // --- Contact Handling Logic (Realizator) ---
      const realizatorAction = contactActions?.realizator || 'update';
      if (realizatorAction !== 'ignore') {
        let realizatorContactIdToSave = formData.realizatorId;
        if (formData.realizatorPriezvisko || formData.realizatorMeno || formData.realizatorEmail || formData.realizatorTelefon) {
          let existingRealizator = realizatorContactIdToSave ? getContactById(realizatorContactIdToSave) : undefined;

          // If not found by ID, try finding by name
          if (!existingRealizator && formData.realizatorMeno && formData.realizatorPriezvisko) {
              existingRealizator = getContactByNameAndType(formData.realizatorPriezvisko, formData.realizatorMeno, 'fakturacna_firma');
              if (existingRealizator) realizatorContactIdToSave = existingRealizator.id;
          }

          const isRealizatorDataChanged = initialFormDataRef.current
            ? hasContactChanged(
                {...existingRealizator!, id: existingRealizator?.id || '', projectIds: [], dateAdded: ''}, // Cast to Contact
                formData,
                'realizator'
              ) : false;

          const realizatorData = {
            meno: formData.realizatorMeno || '',
            priezvisko: formData.realizatorPriezvisko || '',
            telefon: formData.realizatorTelefon || '',
            email: formData.realizatorEmail || '',
            ulica: formData.realizatorUlica || '',
            mesto: formData.realizatorMesto || '',
            psc: formData.realizatorPsc || '',
            ico: formData.realizatorIco || '',
            icDph: formData.realizatorIcDph || '',
            dic: formData.realizatorDic || '',
            typ: 'fakturacna_firma' as const,
            projectIds: [currentCisloCP]
          };

          let realizatorContact: Contact;
          if (realizatorAction === 'create_new') {
              // Force create a new contact (don't update existing)
              realizatorContact = await addContact(realizatorData);
              // Remove this project from the old contact's projectIds
              if (existingRealizator && existingRealizator.projectIds.includes(currentCisloCP)) {
                const updatedProjectIds = existingRealizator.projectIds.filter(pid => pid !== currentCisloCP);
                await updateContact(existingRealizator.id, { projectIds: updatedProjectIds });
              }
          } else if (existingRealizator && isRealizatorDataChanged && existingRealizator.projectIds.length > 1) {
               realizatorContact = await forkContact(existingRealizator.id, realizatorData);
          } else {
               realizatorContact = await addContact({
                  ...realizatorData,
                  ...(realizatorContactIdToSave ? { id: realizatorContactIdToSave } : {})
               });
          }

          setFormData(prev => ({ ...prev, realizatorId: realizatorContact.id }));
          if (entryData.fullFormData) {
            entryData.fullFormData.realizatorId = realizatorContact.id;
          }
        } else {
           setFormData(prev => ({ ...prev, realizatorId: undefined }));
           if (entryData.fullFormData) {
             entryData.fullFormData.realizatorId = undefined;
           }
        }
      }

      // Update firma options (handled by parent via setFirmaOptions callback)
      if (formData.firma && !firmaOptions.includes(formData.firma)) {
        setFirmaOptions([...firmaOptions, formData.firma]);
      }

      setLastSavedJson(JSON.stringify(formData));
      onSave(entryData);
    } catch (error: any) {
      console.error('Failed to save entry:', error);
      alert('Nepodarilo sa uložiť záznam: ' + error.message);
    }
  }, [
    formData,
    uploadedPhotos,
    addContact,
    updateContact,
    firmaOptions,
    getNextCP,
    onSave,
    setFirmaOptions,
    internalId,
    getContactById,
    getContactByNameAndType,
    forkContact,
  ]);

  // Wrapper performSave that checks for contact changes first
  const performSave = useCallback(() => {
    const changes = detectAllContactChanges();
    console.log('[performSave] Detected changes:', changes.length, changes);

    if (changes.length > 0) {
      // Show modal with changes
      setPendingContactChanges(changes);
      setShowContactChangesModal(true);
    } else {
      // No changes, proceed with save
      performSaveInternal();
    }
  }, [detectAllContactChanges, performSaveInternal]);

  // Function called when user selects actions from contact changes modal
  const handleApplyContactChanges = useCallback((sectionActions: SectionActions) => {
    setShowContactChangesModal(false);
    performSaveInternal(sectionActions);
  }, [performSaveInternal]);

  // Function called when user cancels contact changes modal
  const handleCancelContactChanges = useCallback(() => {
    setShowContactChangesModal(false);
    setPendingContactChanges([]);
  }, []);

  const handleAddTemplateSave = (type: 'dvere' | 'nabytok' | 'schody' | 'puzdra', data: any) => {
    // If we are in Objednavky tab (which uses 'puzdra' usually), save to objednavkyItems
    if (activeTab === 'objednavky') {
        // Calculate next order ID
        const allGlobalOrders = entries.flatMap(e => e.fullFormData?.objednavkyItems || []);
        const allIds = [...allGlobalOrders, ...formData.objednavkyItems].map((o: any) => o.cisloObjednavky);

        const maxId = allIds.reduce((max, id) => {
            if (!id) return max;
            const num = parseInt(id, 10);
            return !isNaN(num) && num > max ? num : max;
        }, 0);
        const nextId = (maxId + 1).toString().padStart(6, '0');

        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            nazov: data.zakazka || `Objednávka ${nextId}`,
            vypracoval: user ? `${user.firstName} ${user.lastName}` : '',
            datum: new Date().toISOString().split('T')[0],
            popis: type === 'puzdra' 
                ? `Púzdra: ${data.polozky ? data.polozky.length : 0} ks` 
                : `${type}: ${data.popisVyrobkov ? data.popisVyrobkov.substring(0, 30) : ''}...`,
            cisloObjednavky: nextId,
            dorucene: ''
        };

        setFormData(prev => ({
            ...prev,
            objednavkyItems: [...prev.objednavkyItems, newItem]
        }));
        return;
    }

    // Default behavior for Cenove Ponuky (or other tabs)
    // Calculate totals using centralized logic
    let cenaBezDPH = 0;
    let cenaSDPH = 0;
    let popis = '';

    if (type === 'dvere') {
      const totals = calculateDvereTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
      popis = data.popisVyrobkov;
    } else if (type === 'nabytok') {
      const totals = calculateNabytokTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
      popis = data.popisVyrobkov;
    } else if (type === 'schody') {
      const totals = calculateSchodyTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
      popis = data.popisVyrobkov;
    } else if (type === 'puzdra') {
      const totals = calculatePuzdraTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
      popis = `Objednávka: ${data.polozky ? data.polozky.length : 0} položiek`;
    }

    // Generate a new ID for new items, or use the existing ID for edits
    const newId = editingOfferId || Date.now().toString();
    const existingItem = editingOfferId ? formData.cenovePonukyItems.find(i => i.id === editingOfferId) : null;
    const newCisloCP = editingOfferId
      ? existingItem?.cisloCP || ''
      : formData.predmet + '-' + (formData.cenovePonukyItems.length + 1).toString().padStart(2, '0');

    const entryData: CenovaPonukaItem = {
      id: newId,
      cisloCP: newCisloCP,
      verzia: editingOfferId
        ? existingItem?.verzia || '1'
        : '1',
      odoslane: editingOfferId
        ? existingItem?.odoslane || ''
        : '',
      vytvoril: formData.vypracoval || (user ? `${user.firstName} ${user.lastName}` : '') || '',
      popis: editingOfferId
        ? (existingItem?.popis || '')
        : (popis.substring(0, 50) + (popis.length > 50 ? '...' : '')),
      typ: type,
      cenaBezDPH: cenaBezDPH,
      cenaSDPH: cenaSDPH,
      data: data
    };

    // Calculate finance updates
    let financeUpdates = {};
    if ((type === 'dvere' || type === 'nabytok' || type === 'schody') && data.platba1Percent) {
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

    // After first save, switch to edit mode so subsequent saves update instead of creating new
    if (!editingOfferId) {
      setEditingOfferId(newId);
      setEditingOfferData({ type, data, cisloCP: newCisloCP });
    } else {
      // Update the editingOfferData with latest data
      setEditingOfferData({ type, data, cisloCP: newCisloCP });
    }
  };

  const handleAddOrderSave = (data: any) => {
    // Calculate next order ID
    const allGlobalOrders = entries.flatMap(e => e.fullFormData?.objednavkyItems || []);
    const allIds = [...allGlobalOrders, ...formData.objednavkyItems].map((o: any) => o.cisloObjednavky);

    const maxId = allIds.reduce((max, id) => {
        if (!id) return max;
        const num = parseInt(id, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextId = (maxId + 1).toString().padStart(6, '0');

    const newItem = {
        id: editingOrderId || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        nazov: data.zakazka || `Objednávka ${nextId}`,
        vypracoval: user ? `${user.firstName} ${user.lastName}` : '',
        datum: new Date().toISOString().split('T')[0],
        popis: '', // Empty by default, user fills in the table
        cisloObjednavky: nextId,
        dorucene: '',
        data: data, // Store full data for editing
        puzdraData: data // Store for PDF generation
    };

    setFormData(prev => {
        let newItems = [...prev.objednavkyItems];
        const isNewOrder = !editingOrderId;

        if (editingOrderId) {
            newItems = newItems.map(item => item.id === editingOrderId ? { ...item, ...newItem, id: item.id } : item);
        } else {
            newItems.push(newItem);
        }

        // Auto-change Stav from CP to Zakázka when first order is added
        const shouldChangeStav = isNewOrder && prev.objednavkyItems.length === 0 && prev.stav === 'CP';

        return {
            ...prev,
            objednavkyItems: newItems,
            ...(shouldChangeStav ? { stav: 'Zakázka' } : {})
        };
    });
    setEditingOrderId(null);
    setEditingOrderData(undefined);
    setEditingOrderNumber(null);
  };

  const handleEditOffer = (item: CenovaPonukaItem) => {
    setEditingOfferId(item.id);
    setEditingOfferData({ type: item.typ, data: item.data, cisloCP: item.cisloCP });
    setShowVzorModal(true);
  };

  const handleEditOrderAction = (item: any) => {
    setEditingOrderId(item.id);
    setEditingOrderData(item.data);
    setEditingOrderNumber(item.cisloObjednavky);
    setShowOrderModal(true);
  };

  const handleReset = () => {
    if (window.confirm('Naozaj chcete obnoviť formulár do počiatočného stavu? Všetky vyplnené údaje a súbory budú vymazané.')) {
      const defaults = createDefaultFormData();
      defaults.predmet = formData.predmet;
      
      setFormData(defaults);
      setUploadedPhotos([]);
    }
  };

  const nextVariantCP = useMemo(() => {
    // Generate next CP number for new items: e.g. CP2025/0001-01
    const count = formData.cenovePonukyItems.length;
    return `${formData.predmet}-${(count + 1).toString().padStart(2, '0')}`;
  }, [formData.cenovePonukyItems.length, formData.predmet]);

  const nextOrderNumber = useMemo(() => {
    const allGlobalOrders = entries.flatMap(e => e.fullFormData?.objednavkyItems || []);
    const allIds = [...allGlobalOrders, ...formData.objednavkyItems].map((o: any) => o.cisloObjednavky);

    const maxId = allIds.reduce((max, id) => {
        if (!id) return max;
        const num = parseInt(id, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    return (maxId + 1).toString().padStart(6, '0');
  }, [entries, formData.objednavkyItems]);

  return {
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    uploadedPhotos,
    setUploadedPhotos,
    showVzorModal,
    setShowVzorModal,
    editingOfferId,
    setEditingOfferId,
    editingOfferData,
    setEditingOfferData,
    showOrderModal,
    setShowOrderModal,
    editingOrderId,
    setEditingOrderId,
    editingOrderData,
    setEditingOrderData,
    editingOrderNumber,
    performSave,
    handleAddTemplateSave,
    handleAddOrderSave,
    handleEditOffer,
    handleEditOrderAction,
    handleReset,
    internalId,
    user,
    userPhone,
    lastSavedJson,
    nextVariantCP,
    nextOrderNumber,
    // Contact changes modal
    showContactChangesModal,
    pendingContactChanges,
    handleApplyContactChanges,
    handleCancelContactChanges
  };
};
