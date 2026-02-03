import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useContacts, Contact } from '../../../contexts/ContactsContext';
import { SpisEntry, SpisFormData } from '../types';
import { ContactChange, ContactAction, SectionActions, detectContactChanges } from '../components/ContactChangesModal';
import { formatSpisDateToISO } from '../utils/dateParsing';

interface UseSpisPersistenceProps {
    formData: SpisFormData;
    formDataRef: React.MutableRefObject<SpisFormData>;
    initialFormDataRef: React.MutableRefObject<SpisFormData | null>;
    setFormData: React.Dispatch<React.SetStateAction<SpisFormData>>;
    setLastSavedJson: (json: string) => void;
    uploadedPhotos: { id: string, file: File, url: string, description: string, storagePath?: string }[];
    internalId: string;
    getNextCP: () => string;
    onSave: (entryData: SpisEntry) => void;
    setFirmaOptions: (options: string[]) => void;
    firmaOptions: string[];
}

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

export const useSpisPersistence = ({
    formData,
    formDataRef,
    initialFormDataRef,
    setFormData,
    setLastSavedJson,
    uploadedPhotos,
    internalId,
    getNextCP,
    onSave,
    setFirmaOptions,
    firmaOptions
}: UseSpisPersistenceProps) => {
    const { addContact, updateContact, getContactById, getContactByNameAndType, forkContact } = useContacts();
    const [showContactChangesModal, setShowContactChangesModal] = useState(false);
    const [pendingContactChanges, setPendingContactChanges] = useState<ContactChange[]>([]);

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

    const performSaveInternal = useCallback(async (contactActions?: { zakaznik?: ContactAction, architekt?: ContactAction, realizator?: ContactAction }, formDataOverride?: SpisFormData) => {
        try {
            // Use override if provided, otherwise ref
            const currentFormData = formDataOverride || formDataRef.current;

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
                stav: currentFormData.stav || 'CP',
                cisloCP: currentFormData.predmet || getNextCP(),
                cisloZakazky: currentFormData.cisloZakazky || '',
                datum: currentFormData.ochranaDatum || formatSpisDateToISO(new Date().toISOString()),
                kontaktnaOsoba: `${currentFormData.kontaktnaMeno || ''} ${currentFormData.kontaktnaPriezvisko || ''}`.trim() || `${currentFormData.meno || ''} ${currentFormData.priezvisko || ''}`.trim() || '',
                konecnyZakaznik: `${currentFormData.meno || ''} ${currentFormData.priezvisko || ''}`.trim(),
                architekt: `${currentFormData.architektonickyPriezvisko || ''} ${currentFormData.architektonickeMeno || ''}`.trim() || '',
                realizator: `${currentFormData.realizatorPriezvisko || ''} ${currentFormData.realizatorMeno || ''}`.trim() || '',
                popis: currentFormData.popisProjektu || '',
                firma: currentFormData.firma || '',
                spracovatel: currentFormData.vypracoval || '',
                kategoria: currentFormData.kategoria || '',
                terminDodania: currentFormData.terminDokoncenia ? new Date(currentFormData.terminDokoncenia).toLocaleDateString('sk-SK') : '',
                color: 'white',
                isLocked: currentFormData.isLocked || false,

                // All form data for later retrieval
                fullFormData: {
                    ...currentFormData,
                    fotky: persistentPhotos
                }
            };

            const currentCisloCP = currentFormData.predmet || getNextCP();

            // --- Contact Handling Logic (Customer) ---
            const zakaznikAction = contactActions?.zakaznik || 'update';
            if (zakaznikAction !== 'ignore') {
                let customerContactIdToSave = currentFormData.zakaznikId;
                if (currentFormData.priezvisko || currentFormData.meno || currentFormData.email || currentFormData.telefon) {
                    let existingCustomer = customerContactIdToSave ? getContactById(customerContactIdToSave) : undefined;

                    // If not found by ID, try finding by name (for cases where ID wasn't stored initially)
                    if (!existingCustomer && currentFormData.meno && currentFormData.priezvisko) {
                        existingCustomer = getContactByNameAndType(currentFormData.priezvisko, currentFormData.meno, 'zakaznik');
                        if (existingCustomer) customerContactIdToSave = existingCustomer.id; // Use this ID going forward
                    }

                    const isCustomerDataChanged = initialFormDataRef.current
                        ? hasContactChanged(
                            { ...existingCustomer!, id: existingCustomer?.id || '', projectIds: [], dateAdded: '' }, // Cast to Contact for helper
                            currentFormData,
                            'zakaznik'
                        ) : false; // If no initial data, it's considered new or fully changed

                    const customerData = {
                        meno: currentFormData.meno || '',
                        priezvisko: currentFormData.priezvisko || '',
                        telefon: currentFormData.telefon || '',
                        email: currentFormData.email || '',
                        ulica: currentFormData.ulica || '',
                        mesto: currentFormData.mesto || '',
                        psc: currentFormData.psc || '',
                        ico: currentFormData.ico || '',
                        icDph: currentFormData.icDph || '',
                        dic: currentFormData.dic || '',
                        typ: 'zakaznik' as const,
                        kontaktnaPriezvisko: currentFormData.kontaktnaPriezvisko || '',
                        kontaktnaMeno: currentFormData.kontaktnaMeno || '',
                        kontaktnaTelefon: currentFormData.kontaktnaTelefon || '',
                        kontaktnaEmail: currentFormData.kontaktnaEmail || '',
                        popis: currentFormData.popisProjektu || '',
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
                let architectContactIdToSave = currentFormData.architektId;
                if (currentFormData.architektonickyPriezvisko || currentFormData.architektonickeMeno || currentFormData.architektonickyEmail || currentFormData.architektonickyTelefon) {
                    let existingArchitect = architectContactIdToSave ? getContactById(architectContactIdToSave) : undefined;

                    // If not found by ID, try finding by name
                    if (!existingArchitect && currentFormData.architektonickeMeno && currentFormData.architektonickyPriezvisko) {
                        existingArchitect = getContactByNameAndType(currentFormData.architektonickyPriezvisko, currentFormData.architektonickeMeno, 'architekt');
                        if (existingArchitect) architectContactIdToSave = existingArchitect.id;
                    }

                    const isArchitectDataChanged = initialFormDataRef.current
                        ? hasContactChanged(
                            { ...existingArchitect!, id: existingArchitect?.id || '', projectIds: [], dateAdded: '' }, // Cast to Contact
                            currentFormData,
                            'architekt'
                        ) : false;

                    const architectData = {
                        meno: currentFormData.architektonickeMeno || '',
                        priezvisko: currentFormData.architektonickyPriezvisko || '',
                        telefon: currentFormData.architektonickyTelefon || '',
                        email: currentFormData.architektonickyEmail || '',
                        ulica: currentFormData.architektonickyUlica || '',
                        mesto: currentFormData.architektonickyMesto || '',
                        psc: currentFormData.architektonickyPsc || '',
                        ico: currentFormData.architektonickyIco || '',
                        icDph: currentFormData.architektonickyIcDph || '',
                        dic: currentFormData.architektonickyDic || '',
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
                let realizatorContactIdToSave = currentFormData.realizatorId;
                if (currentFormData.realizatorPriezvisko || currentFormData.realizatorMeno || currentFormData.realizatorEmail || currentFormData.realizatorTelefon) {
                    let existingRealizator = realizatorContactIdToSave ? getContactById(realizatorContactIdToSave) : undefined;

                    // If not found by ID, try finding by name
                    if (!existingRealizator && currentFormData.realizatorMeno && currentFormData.realizatorPriezvisko) {
                        existingRealizator = getContactByNameAndType(currentFormData.realizatorPriezvisko, currentFormData.realizatorMeno, 'fakturacna_firma');
                        if (existingRealizator) realizatorContactIdToSave = existingRealizator.id;
                    }

                    const isRealizatorDataChanged = initialFormDataRef.current
                        ? hasContactChanged(
                            { ...existingRealizator!, id: existingRealizator?.id || '', projectIds: [], dateAdded: '' }, // Cast to Contact
                            currentFormData,
                            'realizator'
                        ) : false;

                    const realizatorData = {
                        meno: currentFormData.realizatorMeno || '',
                        priezvisko: currentFormData.realizatorPriezvisko || '',
                        telefon: currentFormData.realizatorTelefon || '',
                        email: currentFormData.realizatorEmail || '',
                        ulica: currentFormData.realizatorUlica || '',
                        mesto: currentFormData.realizatorMesto || '',
                        psc: currentFormData.realizatorPsc || '',
                        ico: currentFormData.realizatorIco || '',
                        icDph: currentFormData.realizatorIcDph || '',
                        dic: currentFormData.realizatorDic || '',
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
            if (currentFormData.firma && !firmaOptions.includes(currentFormData.firma)) {
                setFirmaOptions([...firmaOptions, currentFormData.firma]);
            }

            setLastSavedJson(JSON.stringify(currentFormData));
            onSave(entryData);
            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-green-200`}
                    style={{ animationDuration: '0.3s', minWidth: '300px' }}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-lg font-bold text-gray-900">
                                    Uložené
                                </p>
                                <p className="text-sm text-gray-500">
                                    Zmeny boli úspešne uložené.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 2500 });
        } catch (error: any) {
            console.error('Failed to save entry:', error);
            toast.error('Nepodarilo sa uložiť záznam: ' + error.message);
        }
    }, [
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
        formDataRef,
        initialFormDataRef,
        setFormData,
        setLastSavedJson
    ]);

    // Wrapper performSave that checks for contact changes first
    const performSave = useCallback((formDataOverride?: SpisFormData) => {
        const changes = detectAllContactChanges();
        console.log('[performSave] Detected changes:', changes.length, changes);

        if (changes.length > 0) {
            // Show modal with changes
            setPendingContactChanges(changes);
            setShowContactChangesModal(true);
        } else {
            // No changes, proceed with save
            performSaveInternal(undefined, formDataOverride);
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

    return {
        showContactChangesModal,
        setShowContactChangesModal,
        pendingContactChanges,
        handleApplyContactChanges,
        handleCancelContactChanges,
        performSave
    };
};
