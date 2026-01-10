/**
 * useSpisEntryLogic Hook
 *
 * Central state management hook for the SpisEntryModal component.
 * Handles all form state, tab navigation, photo uploads, contact management,
 * quote calculations, and save operations for project files (Spis entries).
 *
 * @module useSpisEntryLogic
 */

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { SpisEntry, CenovaPonukaItem, FinancieDeposit, Deposit } from '../types';
import { calculateDvereTotals, calculateNabytokTotals, calculateSchodyTotals, calculatePuzdraTotals } from '../utils/priceCalculations';
import { useSpisFormState } from './useSpisFormState';
import { useSpisPersistence } from './useSpisPersistence';

/**
 * Main hook for managing Spis entry form state and logic.
 *
 * This hook initiates the form state and composes the persistence logic.
 */
export const useSpisEntryLogic = (
  initialEntry: SpisEntry | null,
  entries: SpisEntry[],
  isOpen: boolean,
  setFirmaOptions: (options: string[]) => void,
  firmaOptions: string[],
  onSave: (entryData: SpisEntry) => void
) => {
  const { user } = useAuth();

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
    setShowContactChangesModal, // Exported in case needed, though mostly internal to persistence
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
  const [editingOfferData, setEditingOfferData] = useState<{ type: 'dvere' | 'nabytok' | 'schody' | 'puzdra', data: any, cisloCP?: string } | undefined>(undefined);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrderData, setEditingOrderData] = useState<any>(undefined);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderNumber, setEditingOrderNumber] = useState<string | null>(null);

  // 5. Business Logic (Quotes & Orders)
  // Note: These functions update formData locally. The actual saving to DB happens via performSave.
  // Ideally, these could also be extracted into a useSpisBusinessLogic hook.

  const handleAddTemplateSave = async (type: 'dvere' | 'nabytok' | 'schody' | 'puzdra', data: any, options?: { forceNewVersion?: boolean }): Promise<void> => {
    // If we are in Objednavky tab (which uses 'puzdra' usually), save to objednavkyItems
    if (activeTab === 'objednavky') {
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

    const newCisloCP = isNewEntry
      ? formData.predmet + '-' + (formData.cenovePonukyItems.length + 1).toString().padStart(2, '0')
      : (existingItem?.cisloCP || '');

    const isSelected = existingItem?.selected || false;
    const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;
    const isDefaultSplit = data.platba1Percent === 60 && data.platba2Percent === 30 && data.platba3Percent === 10;
    const hasNoManualAmounts = data.platba1Amount == null && data.platba2Amount == null && data.platba3Amount == null;

    let dataToSave = data;
    if (isDefaultSplit && hasNoManualAmounts && (type === 'dvere' || type === 'nabytok' || type === 'schody')) {
      const amount1 = roundUpToTen(cenaSDPH * 0.60);
      const amount2 = roundUpToTen(cenaSDPH * 0.30);
      const amount3 = cenaSDPH - amount1 - amount2;
      dataToSave = {
        ...data,
        platba1Amount: amount1,
        platba2Amount: amount2,
        platba3Amount: amount3
      };
    }

    const entryData: CenovaPonukaItem = {
      id: newId,
      cisloCP: newCisloCP,
      verzia: existingItem?.verzia || '1', // Versioning within the same item ID is different, here we just keep '1' or existing.
      odoslane: existingItem?.odoslane || '',
      vytvoril: formData.vypracoval || (user ? `${user.firstName} ${user.lastName}` : '') || '',
      popis: existingItem?.popis || '',
      typ: type,
      cenaBezDPH: cenaBezDPH,
      cenaSDPH: cenaSDPH,
      data: dataToSave,
      selected: isSelected
    };

    let financeUpdates: Partial<typeof formData> = {};
    if (isSelected && (type === 'dvere' || type === 'nabytok' || type === 'schody')) {
      if (dataToSave.deposits && dataToSave.deposits.length > 0) {
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
          return {
            id: deposit.id,
            label: deposit.label,
            amount: amount.toFixed(2),
            datum: ''
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
        const platba1 = dataToSave.platba1Amount ?? 0;
        const platba2 = dataToSave.platba2Amount ?? 0;
        const platba3 = dataToSave.platba3Amount ?? 0;

        let effectivePriceForLegacy = cenaSDPH;
        if (dataToSave.cenaDohodou && dataToSave.cenaDohodouValue) {
          effectivePriceForLegacy = dataToSave.cenaDohodouValue;
        } else if (dataToSave.prenesenieDP) {
          effectivePriceForLegacy = cenaBezDPH;
        }

        financeUpdates = {
          cena: effectivePriceForLegacy.toFixed(2),
          zaloha1: platba1.toFixed(2),
          zaloha2: platba2.toFixed(2),
          doplatok: platba3.toFixed(2),
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
      setEditingOfferData({ type, data: dataToSave, cisloCP: newCisloCP });
    } else {
      setEditingOfferData({ type, data: dataToSave, cisloCP: newCisloCP });
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    await performSave();
  };

  const handleAddOrderSave = (data: any) => {
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
      popis: '',
      cisloObjednavky: nextId,
      dorucene: '',
      data: data,
      puzdraData: data
    };

    setFormData(prev => {
      let newItems = [...prev.objednavkyItems];
      const isNewOrder = !editingOrderId;

      if (editingOrderId) {
        newItems = newItems.map(item => item.id === editingOrderId ? { ...item, ...newItem, id: item.id } : item);
      } else {
        newItems.push(newItem);
      }

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

  const handleSaveAsNew = async (type: 'dvere' | 'nabytok' | 'schody' | 'puzdra', data: any, options?: { forceNewVersion?: boolean }): Promise<void> => {
    setEditingOfferId(null);
    await handleAddTemplateSave(type, data, options);
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
