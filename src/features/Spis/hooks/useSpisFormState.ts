import { useState, useRef, useEffect, useCallback } from 'react';
import { SpisFormData, SpisEntry } from '../types';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { formatSpisDateToISO } from '../utils/dateParsing';

export const useSpisFormState = (initialEntry: SpisEntry | null, isOpen: boolean) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('vseobecne');
    const [uploadedPhotos, setUploadedPhotos] = useState<{ id: string, file: File, url: string, description: string, storagePath?: string }[]>([]);
    const [userPhone, setUserPhone] = useState('');

    // Internal ID to ensure stable identity across auto-saves
    const [internalId, setInternalId] = useState<string>(() => initialEntry?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9));

    useEffect(() => {
        if (initialEntry?.id && initialEntry.id !== internalId) {
            setInternalId(initialEntry.id);
        }
    }, [initialEntry?.id, internalId]);

    // Load user phone preference
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

    const createDefaultFormData = useCallback((): SpisFormData => ({
        // Všeobecné - Ochrana section
        predmet: '', // Will be populated by parent using getNextCP usually
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

        // Všeobecné - Financie section
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
        zakaznikId: undefined,

        // Všeobecné - Architekt
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
        architektId: undefined,

        // Všeobecné - Realizátor
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
        fakturaciaTyp: 'nepouzit',
        fakturaciaSource: '',
        fakturaciaK10: false,
        fakturaciaPriezvisko: '',
        fakturaciaMeno: '',
        fakturaciaAdresa: '',
        fakturaciaIco: '',
        fakturaciaDic: '',
        fakturaciaIcDph: '',
        fakturaciaTelefon: '',
        fakturaciaEmail: '',

        // Items
        popisItems: [],
        cenovePonukyItems: [],
        objednavkyItems: [],
        emailKomu: '',
        emailKomuText: '',
        emailPredmet: '',
        emailText: '',
        emailItems: [],
        meranieItems: [],
        vyrobneVykresy: [],
        fotky: [],
        technickeItems: [],
        isLocked: false,
    }), [user]);

    const [formData, setFormData] = useState<SpisFormData>(createDefaultFormData());
    const formDataRef = useRef<SpisFormData>(formData);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const [lastSavedJson, setLastSavedJson] = useState('');
    const initialFormDataRef = useRef<SpisFormData | null>(null);

    // Reset or load data when modal opens/changes
    useEffect(() => {
        if (isOpen && initialEntry) {
            if (initialEntry.fullFormData) {
                const loadedData = {
                    ...initialEntry.fullFormData,
                    // Load cisloCP from the entry into predmet field
                    predmet: initialEntry.cisloCP || initialEntry.fullFormData.predmet || '',
                    objednavkyItems: initialEntry.fullFormData.objednavkyItems || [],
                    isLocked: initialEntry.isLocked || initialEntry.fullFormData.isLocked || false,
                    // Fix/init datum if missing from fullFormData (but present in top level)
                    ochranaDatum: initialEntry.fullFormData.ochranaDatum || formatSpisDateToISO(initialEntry.datum) || new Date().toISOString().split('T')[0]
                };
                setFormData(loadedData);
                setLastSavedJson(JSON.stringify(loadedData));
                initialFormDataRef.current = loadedData;



                // Load photos
                if (initialEntry.fullFormData.fotky) {
                    const loadedPhotos = initialEntry.fullFormData.fotky.map((p: any) => ({
                        id: p.id,
                        file: new File([""], p.name, { type: p.type, lastModified: Date.now() }),
                        url: p.storagePath ? p.url : p.base64,
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
            initialFormDataRef.current = newData;
            setUploadedPhotos([]);
        }
    }, [isOpen, initialEntry, createDefaultFormData]);

    // Return all state and setters
    return {
        activeTab,
        setActiveTab,
        uploadedPhotos,
        setUploadedPhotos,
        userPhone,
        internalId,
        setInternalId,
        formData,
        setFormData,
        formDataRef,
        lastSavedJson,
        setLastSavedJson,
        initialFormDataRef,
        createDefaultFormData
    };
};
