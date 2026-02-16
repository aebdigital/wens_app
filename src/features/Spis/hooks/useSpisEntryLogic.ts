/**
 * useSpisEntryLogic Hook
 *
 * Central state management hook for the SpisEntryModal component.
 * Handles all form state, tab navigation, photo uploads, contact management,
 * quote calculations, and save operations for project files (Spis entries).
 *
 * @module useSpisEntryLogic
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { SpisEntry, CenovaPonukaItem, FinancieDeposit, Deposit } from '../types';
import { calculateDvereTotals, calculateNabytokTotals, calculateSchodyTotals, calculateKovanieTotals, calculatePuzdraTotals } from '../utils/priceCalculations';
import { calculateNextOrderNumber } from '../utils/orderNumbering';
import { useSpisFormState } from './useSpisFormState';
import { useSpisPersistence } from './useSpisPersistence';
import { useSpis } from '../../../contexts/SpisContext';

export const useSpisEntryLogic = (
  initialEntry: SpisEntry | null,
  entries: SpisEntry[],
  isOpen: boolean,
  setFirmaOptions: (options: string[]) => void,
  firmaOptions: string[],
  onSave: (entryData: SpisEntry) => void
) => {
  const { user } = useAuth();
  const { standaloneOrders, refreshStandaloneOrders } = useSpis(); // Get standalone orders from context

  // Refresh standalone orders on mount to ensure we have the latest list for numbering
  // This is crucial because SpisEntryModal might be kept alive or mounting logic might race
  // with the initial context load.
  // Use a ref to prevent infinite loops if refreshStandaloneOrders is not stable (though it is useCallback)
  const hasRefreshedRef = useRef(false);

  // We use useMemo/useEffect combo or just useEffect.
  // Since refreshStandaloneOrders is stable, we can just call it.
  useEffect(() => {
    if (!hasRefreshedRef.current) {
      refreshStandaloneOrders();
      hasRefreshedRef.current = true;
    }
  }, [refreshStandaloneOrders]);

  // Also refresh when opening the modal (isOpen becomes true)
  useEffect(() => {
    if (isOpen) {
      refreshStandaloneOrders();
    }
  }, [isOpen, refreshStandaloneOrders]);

  // 1. Form State Management
  const {
    activeTab,
    setActiveTab,
    uploadedPhotos,
    setUploadedPhotos,
    userPhone,
    internalId,
    formData,
    setFormData,
    formDataRef,
    lastSavedJson,
    setLastSavedJson,
    initialFormDataRef,
    createDefaultFormData
  } = useSpisFormState(initialEntry, isOpen);

  // 2. Helper Logic (needed for persistence)
  const getNextCP = useCallback(() => {
    const currentYear = new Date().getFullYear();
    if (!entries || entries.length === 0) return `CP${currentYear}/0001`;
    let max = 0;
    entries.forEach(e => {
      const parts = e.cisloCP.split('/');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    return `CP${currentYear}/${(max + 1).toString().padStart(4, '0')}`;
  }, [entries]);

  // 3. Persistence Logic (Save & Contact Changes)
  const {
    showContactChangesModal,
    pendingContactChanges,
    handleApplyContactChanges,
    handleCancelContactChanges,
    performSave
  } = useSpisPersistence({
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
  });

  // 4. Modal States (Templates & Orders)
  const [showVzorModal, setShowVzorModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingOfferData, setEditingOfferData] = useState<{ type: 'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra', data: any, cisloCP?: string, cisloZakazky?: string } | undefined>(undefined);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrderData, setEditingOrderData] = useState<any>(undefined);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderNumber, setEditingOrderNumber] = useState<string | null>(null);

  // 5. Business Logic (Quotes & Orders)
  // Note: These functions update formData locally. The actual saving to DB happens via performSave.
  // Ideally, these could also be extracted into a useSpisBusinessLogic hook.

  const handleAddTemplateSave = async (type: 'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra', data: any, options?: { forceNewVersion?: boolean }): Promise<void> => {
    // If we are in Objednavky tab (which uses 'puzdra' usually), save to objednavkyItems
    if (activeTab === 'objednavky') {
      const nextId = calculateNextOrderNumber(entries, formData.objednavkyItems);

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

    // Default behavior for Cenove Ponuky
    let cenaBezDPH = 0;
    let cenaSDPH = 0;

    if (type === 'dvere') {
      const totals = calculateDvereTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
    } else if (type === 'nabytok') {
      const totals = calculateNabytokTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
    } else if (type === 'schody') {
      const totals = calculateSchodyTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
    } else if (type === 'kovanie') {
      const totals = calculateKovanieTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
    } else if (type === 'puzdra') {
      const totals = calculatePuzdraTotals(data);
      cenaBezDPH = totals.cenaBezDPH;
      cenaSDPH = totals.cenaSDPH;
    }

    // Determine if we are creating a new entry or updating an existing one
    // If forceNewVersion is true, we treat it as a new entry regardless of editingOfferId
    const isNewEntry = options?.forceNewVersion || !editingOfferId;

    const newId = isNewEntry ? Date.now().toString() : editingOfferId!;
    const existingItem = (!isNewEntry && editingOfferId) ? formData.cenovePonukyItems.find(i => i.id === editingOfferId) : null;

    // Use the main CP number (predmet), or generate next global CP if predmet is empty
    const baseCisloCP = formData.predmet || getNextCP();
    const newCisloCP = isNewEntry
      ? baseCisloCP + '-' + (formData.cenovePonukyItems.length + 1).toString().padStart(2, '0')
      : (existingItem?.cisloCP || '');

    const isSelected = existingItem?.selected || false;
    const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;
    const isDefaultSplit = data.platba1Percent === 60 && data.platba2Percent === 30 && data.platba3Percent === 10;
    const hasNoManualAmounts = data.platba1Amount == null && data.platba2Amount == null && data.platba3Amount == null;

    let dataToSave = data;
    if (isDefaultSplit && hasNoManualAmounts && (type === 'dvere' || type === 'nabytok' || type === 'schody' || type === 'kovanie')) {
      // Calculate effective price for storage defaults
      let effectivePriceForStorage = cenaSDPH;
      if (data.cenaDohodou && data.cenaDohodouValue) {
        effectivePriceForStorage = data.cenaDohodouValue;
      } else if (data.prenesenieDP) {
        effectivePriceForStorage = cenaBezDPH;
      }

      const amount1 = roundUpToTen(effectivePriceForStorage * 0.60);
      const amount2 = roundUpToTen(effectivePriceForStorage * 0.30);
      const amount3 = effectivePriceForStorage - amount1 - amount2;
      dataToSave = {
        ...data,
        platba1Amount: amount1,
        platba2Amount: amount2,
        platba3Amount: amount3
      };
    }

    // Extract itemCisloZakazky from data if provided, then remove it from dataToSave
    const itemCisloZakazky = dataToSave.itemCisloZakazky;
    const { itemCisloZakazky: _, ...cleanDataToSave } = dataToSave;

    // Billing Snapshot Logic
    // If it's a NEW entry, we create the snapshot from current formData.
    // If it's an EXISTING entry, we generally KEEP the existing snapshot (unless manually refreshed via refreshing logic which calls this same save function with updated snapshot).
    // The component calling this (AddTemplateModal) will handle the "Refresh" logic by passing the updated snapshot in `data`.
    // So here we just need to ensure that if `cleanDataToSave` DOESN'T have a snapshot, we create one (migration/fallback for new items).

    if (!cleanDataToSave.billingSnapshot) {
      const newSnapshot: import('../types').BillingSnapshot = {
        customer: {
          firma: formData.firma,
          ulica: formData.ulica,
          mesto: formData.mesto,
          psc: formData.psc,
          telefon: formData.telefon,
          email: formData.email,
          meno: formData.meno,
          priezvisko: formData.priezvisko,
          ico: formData.ico,
          dic: formData.dic,
          icDph: formData.icDph
        },
        architect: {
          priezvisko: formData.architektonickyPriezvisko,
          meno: formData.architektonickeMeno,
          firma: '', // formData doesn't have architect company name explicitly? 
          // Wait, SpisFormData has architektonicky* fields but maybe not 'firma'. 
          // Checking types... SpisFormData has: firma (main), but architect section: architektonickyPriezvisko... 
          // QuoteHeader uses: headerInfo.architect.firma. 
          // Let's check SpisFormData in types again. 
          // existing `types/index.ts`: architektonickyPriezvisko, ...NO firma in architect section.
          // However, `QuoteHeader` expects it. 
          // `AddTemplateModal` constructs `architectInfo` prop. 
          // Let's use what we have. If `firma` is missing in SpisFormData for architect, we use empty string.
          // Actually, let's check `VseobecneForm`. It might be `firma` field is reused or just missing.
          // For now, mapping what we have in SpisFormData.
          ulica: formData.architektonickyUlica,
          mesto: formData.architektonickyMesto,
          psc: formData.architektonickyPsc,
          telefon: formData.architektonickyTelefon,
          email: formData.architektonickyEmail,
          ico: formData.architektonickyIco,
          dic: formData.architektonickyDic,
          icDph: formData.architektonickyIcDph
        },
        billing: {
          priezvisko: formData.fakturaciaPriezvisko,
          meno: formData.fakturaciaMeno,
          adresa: formData.fakturaciaAdresa,
          ico: formData.fakturaciaIco,
          dic: formData.fakturaciaDic,
          icDph: formData.fakturaciaIcDph,
          telefon: formData.fakturaciaTelefon || '',
          email: formData.fakturaciaEmail || ''
        },
        activeSource: formData.fakturaciaSource || 'zakaznik'
      };
      cleanDataToSave.billingSnapshot = newSnapshot;
    }

    // Sync Case Number to main entry whenever it's changed in the price offer
    if (itemCisloZakazky) {
      setFormData(prev => ({ ...prev, cisloZakazky: itemCisloZakazky }));
    }

    const entryData: CenovaPonukaItem = {
      id: newId,
      cisloCP: newCisloCP,
      cisloZakazky: itemCisloZakazky || existingItem?.cisloZakazky || '',
      verzia: existingItem?.verzia || '1', // Versioning within the same item ID is different, here we just keep '1' or existing.
      odoslane: existingItem?.odoslane || '',
      vytvoril: formData.vypracoval || (user ? `${user.firstName} ${user.lastName}` : '') || '',
      popis: existingItem?.popis || '',
      typ: type,
      cenaBezDPH: cenaBezDPH,
      cenaSDPH: cenaSDPH,
      data: cleanDataToSave,
      selected: isSelected
    };

    let financeUpdates: Partial<typeof formData> = {};
    if (isSelected && (type === 'dvere' || type === 'nabytok' || type === 'schody' || type === 'kovanie')) {
      // Check if deposits array exists (including empty array which means user explicitly removed all)
      if (dataToSave.deposits !== undefined) {
        let effectivePrice = cenaSDPH;
        if (dataToSave.cenaDohodou && dataToSave.cenaDohodouValue) {
          effectivePrice = dataToSave.cenaDohodouValue;
        } else if (dataToSave.prenesenieDP) {
          effectivePrice = cenaBezDPH;
        }

        const financieDeposits: FinancieDeposit[] = dataToSave.deposits.map((deposit: Deposit) => {
          const amount = deposit.amount != null
            ? deposit.amount
            : effectivePrice * (deposit.percent / 100);
          // Try to find existing date in current formData to preserve it
          // Fallback to matching by label if ID match fails (e.g. if deposits were regenerated)
          const existingDeposit = formData.financieDeposits?.find(d => d.id === deposit.id)
            || formData.financieDeposits?.find(d => d.label === deposit.label);

          return {
            id: deposit.id,
            label: deposit.label,
            amount: amount.toFixed(2),
            datum: existingDeposit?.datum || ''
          };
        });

        financeUpdates = {
          cena: effectivePrice.toFixed(2),
          financieDeposits,
          zaloha1: '0',
          zaloha2: '0',
          doplatok: '0'
        };
      } else {
        // Calculate effective price for legacy calculation too
        let effectivePriceForLegacy = cenaSDPH;
        if (dataToSave.cenaDohodou && dataToSave.cenaDohodouValue) {
          effectivePriceForLegacy = dataToSave.cenaDohodouValue;
        } else if (dataToSave.prenesenieDP) {
          effectivePriceForLegacy = cenaBezDPH;
        }

        // RECALCULATE DEFAULTS based on EFFECTIVE price if amounts are missing
        // This fixes the bug where saving would reset to cenaSDPH-based splits because dataToSave.platbaXAmount was null
        const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;

        let platba1 = dataToSave.platba1Amount;
        let platba2 = dataToSave.platba2Amount;
        let platba3 = dataToSave.platba3Amount;

        if (platba1 == null && isDefaultSplit) {
          platba1 = roundUpToTen(effectivePriceForLegacy * 0.60);
        } else if (platba1 == null) {
          platba1 = effectivePriceForLegacy * (dataToSave.platba1Percent || 60) / 100;
        }

        if (platba2 == null && isDefaultSplit) {
          platba2 = roundUpToTen(effectivePriceForLegacy * 0.30);
        } else if (platba2 == null) {
          platba2 = effectivePriceForLegacy * (dataToSave.platba2Percent || 30) / 100;
        }

        if (platba3 == null && isDefaultSplit) {
          // Ensure it sums up exactly to effective price
          platba3 = effectivePriceForLegacy - (platba1 || 0) - (platba2 || 0);
        } else if (platba3 == null) {
          platba3 = effectivePriceForLegacy * (dataToSave.platba3Percent || 10) / 100;
        }

        financeUpdates = {
          cena: effectivePriceForLegacy.toFixed(2),
          zaloha1: (platba1 || 0).toFixed(2),
          zaloha2: (platba2 || 0).toFixed(2),
          doplatok: (platba3 || 0).toFixed(2),
          financieDeposits: undefined
        };
      }
    }

    setFormData(prev => {
      let newItems = [...prev.cenovePonukyItems];
      if (!isNewEntry && editingOfferId) {
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

    if (isNewEntry) {
      setEditingOfferId(newId);
      setEditingOfferData({ type, data: cleanDataToSave, cisloCP: newCisloCP, cisloZakazky: entryData.cisloZakazky });
    } else {
      setEditingOfferData({ type, data: cleanDataToSave, cisloCP: newCisloCP, cisloZakazky: entryData.cisloZakazky });
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    await performSave();
  };

  const handleAddOrderSave = (data: any) => {
    const orderNumber = editingOrderNumber || calculateNextOrderNumber(entries, formData.objednavkyItems, standaloneOrders);

    // Find existing item to preserve metadata
    const existingItem = editingOrderId
      ? formData.objednavkyItems.find(item => item.id === editingOrderId)
      : null;

    const newItem = {
      id: editingOrderId || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nazov: data.zakazka || `Objednávka ${orderNumber}`,
      vypracoval: existingItem?.vypracoval || (user ? `${user.firstName} ${user.lastName}` : ''),
      datum: data.datum || existingItem?.datum || new Date().toISOString().split('T')[0],
      popis: existingItem?.popis || '',
      cisloObjednavky: orderNumber,
      dorucene: existingItem?.dorucene || '',
      data: data,
      puzdraData: data
    };

    // Calculate new state based on current formData
    let newItems = [...formData.objednavkyItems];
    const isNewOrder = !editingOrderId;

    if (editingOrderId) {
      newItems = newItems.map(item => item.id === editingOrderId ? { ...item, ...newItem, id: item.id } : item);
    } else {
      newItems.push(newItem);
    }

    const shouldChangeStav = isNewOrder && formData.objednavkyItems.length === 0 && formData.stav === 'CP';

    const newFormData = {
      ...formData,
      objednavkyItems: newItems,
      ...(shouldChangeStav ? { stav: 'Zakázka' } : {})
    };

    setFormData(newFormData);
    // Switch to edit mode for the saved item so subsequent Saves/Previews in the same modal session
    // use the same ID and Number instead of creating duplicates or incrementing the number.
    setEditingOrderId(newItem.id);
    setEditingOrderData(data);
    setEditingOrderNumber(orderNumber);

    // Trigger save immediately with NEW data
    performSave(newFormData);
  };

  const handleEditOffer = (item: CenovaPonukaItem) => {
    setEditingOfferId(item.id);
    setEditingOfferData({ type: item.typ, data: item.data, cisloCP: item.cisloCP, cisloZakazky: item.cisloZakazky });
    setShowVzorModal(true);
  };

  const handleSaveAsNew = async (type: 'dvere' | 'nabytok' | 'schody' | 'kovanie' | 'puzdra', data: any, options?: { forceNewVersion?: boolean }): Promise<void> => {
    setEditingOfferId(null);
    await handleAddTemplateSave(type, data, options);
  };

  const handleEditOrderAction = (item: any) => {
    setEditingOrderId(item.id);
    const pData = item.data || item.puzdraData;
    // Sync top-level datum to nested data for consistent modal display
    if (pData && item.datum) {
      pData.datum = item.datum;
    }
    setEditingOrderData(pData);
    setEditingOrderNumber(item.cisloObjednavky);
    setShowOrderModal(true);
  };

  const handleAddNewOrderAction = () => {
    setEditingOrderId(null);
    setEditingOrderData(undefined);
    setEditingOrderNumber(null);
    setShowOrderModal(true);
  };

  const handleDeleteOrder = () => {
    if (!editingOrderId) return;
    const newItems = formData.objednavkyItems.filter(item => item.id !== editingOrderId);
    const newFormData = { ...formData, objednavkyItems: newItems };
    setFormData(newFormData);
    setShowOrderModal(false);
    setEditingOrderId(null);
    setEditingOrderData(undefined);
    setEditingOrderNumber(null);
    performSave(newFormData);
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
    const count = formData.cenovePonukyItems.length;
    // Use the main CP number (predmet), or generate next global CP if predmet is empty
    const baseCisloCP = formData.predmet || getNextCP();
    return `${baseCisloCP}-${(count + 1).toString().padStart(2, '0')}`;
  }, [formData.cenovePonukyItems.length, formData.predmet, getNextCP]);

  const nextOrderNumber = useMemo(() => {
    return calculateNextOrderNumber(entries, formData.objednavkyItems, standaloneOrders);
  }, [entries, formData.objednavkyItems, standaloneOrders]);

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
    handleAddNewOrderAction,
    handleDeleteOrder,
    handleSaveAsNew,
    handleReset,
    internalId,
    user,
    userPhone,
    lastSavedJson,
    nextVariantCP,
    nextOrderNumber,
    showContactChangesModal,
    pendingContactChanges,
    handleApplyContactChanges,
    handleCancelContactChanges
  };
};
