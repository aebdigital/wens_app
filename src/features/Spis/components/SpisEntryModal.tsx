import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDocumentLock } from '../../../contexts/DocumentLockContext';
import { SpisEntry, CenovaPonukaItem, FinancieDeposit, Deposit } from '../types';
import { VseobecneSidebar } from './VseobecneSidebar';
import { VseobecneForm } from './VseobecneForm';
import { generatePDF, generateAndSavePDF } from '../utils/pdfGenerator';
import { useSpisEntryLogic } from '../hooks/useSpisEntryLogic';
import { CustomDatePicker } from '../../../components/common/CustomDatePicker';
import { TabErrorBoundary } from '../../../components/common/ErrorBoundary';

// Lazy load heavy tab components for better performance
const CenovePonukyTab = lazy(() => import('./CenovePonukyTab').then(m => ({ default: m.CenovePonukyTab })));
const ObjednavkyTab = lazy(() => import('./ObjednavkyTab').then(m => ({ default: m.ObjednavkyTab })));
const MeranieTab = lazy(() => import('./MeranieTab').then(m => ({ default: m.MeranieTab })));
const FotkyTab = lazy(() => import('./FotkyTab').then(m => ({ default: m.FotkyTab })));
const VyrobneVykresyTab = lazy(() => import('./VyrobneVykresyTab').then(m => ({ default: m.VyrobneVykresyTab })));
const TechnickeVykresyTab = lazy(() => import('./TechnickeVykresyTab').then(m => ({ default: m.TechnickeVykresyTab })));
const PreberaciProtokolTab = lazy(() => import('./PreberaciProtokolTab').then(m => ({ default: m.PreberaciProtokolTab })));
const AddTemplateModal = lazy(() => import('./AddTemplateModal').then(m => ({ default: m.AddTemplateModal })));
const AddOrderModal = lazy(() => import('./AddOrderModal').then(m => ({ default: m.AddOrderModal })));
const ContactChangesModal = lazy(() => import('./ContactChangesModal').then(m => ({ default: m.ContactChangesModal })));
const TaskCreateModal = lazy(() => import('../../../components/tasks/TaskCreateModal').then(m => ({ default: m.TaskCreateModal })));

// Loading spinner component for lazy loaded tabs
const TabLoadingSpinner: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="flex items-center justify-center h-48">
    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-white' : 'border-gray-900'}`}></div>
  </div>
);

// Custom confirmation dialog component
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDark: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Áno',
  cancelText = 'Nie',
  isDark
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Close confirmation dialog with 3 options
interface CloseConfirmDialogProps {
  isOpen: boolean;
  onContinue: () => void;
  onSave: () => void;
  onDiscard: () => void;
  isDark: boolean;
}

const CloseConfirmDialog: React.FC<CloseConfirmDialogProps> = ({
  isOpen,
  onContinue,
  onSave,
  onDiscard,
  isDark
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Neuložené zmeny</h3>
        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Máte neuložené zmeny. Čo chcete urobiť?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className={`w-full px-4 py-3 rounded-lg font-medium ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Pokračovať
          </button>
          <button
            onClick={onSave}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Uložiť
          </button>
          <button
            onClick={onDiscard}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Neuložiť
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const { acquireLock, releaseLock, checkLockStatus } = useDocumentLock();
  const [isLocked, setIsLocked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteNoteConfirm, setShowDeleteNoteConfirm] = useState(false);
  const [noteToDeleteIndex, setNoteToDeleteIndex] = useState<number | null>(null);
  const [vzorModalTabs, setVzorModalTabs] = useState<('dvere' | 'nabytok' | 'schody' | 'puzdra')[]>(['dvere', 'nabytok', 'schody', 'puzdra']);
  const [isSaving, setIsSaving] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Document lock state
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockInfo, setLockInfo] = useState<{
    lockedByName: string;
    queuePosition: number;
  } | null>(null);
  const lockCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Computed: effectively locked if manually locked OR locked by another user
  const isEffectivelyLocked = isLocked || isLockedByOther;

  const {
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
    editingOrderData,
    editingOrderNumber,
    performSave,
    handleAddTemplateSave,
    handleAddOrderSave,
    handleEditOffer,
    handleEditOrderAction,
    handleSaveAsNew,
    internalId,
    lastSavedJson,
    nextVariantCP,
    nextOrderNumber,
    userPhone,
    // Contact changes modal
    showContactChangesModal,
    pendingContactChanges,
    handleApplyContactChanges,
    handleCancelContactChanges
  } = useSpisEntryLogic(initialEntry, entries, isOpen, setFirmaOptions, firmaOptions, onSave);

  // Document lock management
  const checkAndUpdateLockStatus = useCallback(async () => {
    if (!internalId) return;

    try {
      const status = await checkLockStatus(internalId, 'spis');

      if (status.isLocked && !status.isOwnLock) {
        // Document is locked by someone else
        setIsLockedByOther(true);
        setLockInfo({
          lockedByName: status.lockedByName,
          queuePosition: status.queuePosition
        });
      } else {
        // Document is not locked or we have the lock
        setIsLockedByOther(false);
        setLockInfo(null);
      }
    } catch (error) {
      console.error('Error checking lock status:', error);
    }
  }, [internalId, checkLockStatus]);

  // Acquire lock when modal opens, release when it closes
  useEffect(() => {
    const setupLock = async () => {
      if (isOpen && internalId) {
        try {
          const lockResult = await acquireLock(internalId, 'spis');

          if (lockResult.isLocked && !lockResult.isOwnLock) {
            // Someone else has the lock
            setIsLockedByOther(true);
            setLockInfo({
              lockedByName: lockResult.lockedByName,
              queuePosition: lockResult.queuePosition
            });
          } else {
            setIsLockedByOther(false);
            setLockInfo(null);
          }

          // Set up periodic lock status check (every 60 seconds)
          lockCheckIntervalRef.current = setInterval(() => {
            checkAndUpdateLockStatus();
          }, 60000);
        } catch (error) {
          console.error('Error acquiring lock:', error);
        }
      }
    };

    setupLock();

    // Cleanup function - release lock when modal closes
    return () => {
      if (lockCheckIntervalRef.current) {
        clearInterval(lockCheckIntervalRef.current);
        lockCheckIntervalRef.current = null;
      }

      if (internalId) {
        releaseLock(internalId, 'spis').catch(console.error);
      }
    };
  }, [isOpen, internalId, acquireLock, releaseLock, checkAndUpdateLockStatus]);

  const handleSaveClick = async () => {
    setIsSaving(true);
    // Simulate async operation or wait for save logic if it was async
    // Since performSave is sync, we use setTimeout to show the spinner for a bit
    await new Promise(resolve => setTimeout(resolve, 600));
    performSave();
    setIsSaving(false);
  };

  // Switch to Objednavky tab if a specific order is selected
  useEffect(() => {
    if (selectedOrderIndex !== null) {
      setActiveTab('objednavky');
    }
  }, [selectedOrderIndex, setActiveTab]);

  // Handle close with unsaved changes check
  const handleClose = () => {
    const isDirty = JSON.stringify(formData) !== lastSavedJson;
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // Handle delete with confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(internalId);
  };

  const confirmDeleteNote = () => {
    if (noteToDeleteIndex !== null) {
      setFormData(prev => ({
        ...prev,
        popisItems: prev.popisItems.filter((_, i) => i !== noteToDeleteIndex)
      }));
    }
    setShowDeleteNoteConfirm(false);
    setNoteToDeleteIndex(null);
  };

  const handleGeneratePDF = async (item: CenovaPonukaItem): Promise<string> => {
    return generatePDF(item, formData, {
      vypracoval: formData.vypracoval,
      telefon: userPhone,
      email: user?.email || ''
    });
  };

  const handleDownloadPDF = async (item: CenovaPonukaItem): Promise<void> => {
    await generateAndSavePDF(item, formData, {
      vypracoval: formData.vypracoval,
      telefon: userPhone,
      email: user?.email || ''
    });
  };

  const handleToggleSelect = (selectedItem: CenovaPonukaItem) => {
    // If clicking the already selected item, do nothing (or unselect if desired - here assuming radio behavior so typically one is always selected, or toggle off allowed)
    // Let's implement toggle behavior: if already selected, unselect.
    const isCurrentlySelected = selectedItem.selected;

    // Calculate total Quantity (KS) from the selected item's data
    let totalQuantity = 0;
    if (!isCurrentlySelected) { // Only calculate if we are selecting it
      if (selectedItem.typ === 'dvere' && 'vyrobky' in selectedItem.data) {
        // For dvere, sum only 'ks' (doors), NOT 'ksZarubna' (frames)
        totalQuantity = (selectedItem.data.vyrobky as any[]).reduce((sum: number, p: any) => {
          return sum + (Number(p.ks) || 0);
        }, 0);
      } else if ((selectedItem.typ === 'nabytok' || selectedItem.typ === 'schody') && 'vyrobky' in selectedItem.data) {
        // For furniture and stairs, quantity logic uses 'ks' field
        totalQuantity = (selectedItem.data.vyrobky as any[]).reduce((sum: number, p: any) => sum + (Number(p.ks) || 0), 0);
      }
    }

    // Calculate finance updates when selecting (not unselecting)
    let financeUpdates: { cena?: string; zaloha1?: string; zaloha2?: string; doplatok?: string; financieDeposits?: FinancieDeposit[] } = {};
    if (!isCurrentlySelected && selectedItem.data) {
      if (selectedItem.typ !== 'puzdra') {
        const data = selectedItem.data as import('../types').DvereData | import('../types').NabytokData | import('../types').SchodyData;
        const cenaSDPH = selectedItem.cenaSDPH || 0;

        // Helper function to round UP to nearest 10 (matches QuoteFooter display)
        const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;

        // Calculate cenaBezDPH for prenesenieDP case
        const cenaBezDPH = selectedItem.cenaBezDPH || (cenaSDPH / 1.23);

        // Check if we have dynamic deposits (including empty array which means user explicitly removed all)
        if (data.deposits !== undefined) {
          // Use dynamic deposits
          // Priority: 1. cenaDohodou, 2. prenesenieDP (cenaBezDPH), 3. cenaSDPH
          let effectivePrice = cenaSDPH;
          if (data.cenaDohodou && data.cenaDohodouValue) {
            effectivePrice = data.cenaDohodouValue;
          } else if (data.prenesenieDP) {
            effectivePrice = cenaBezDPH;
          }

          const financieDeposits: FinancieDeposit[] = data.deposits.map((deposit: Deposit) => {
            const amount = deposit.amount != null
              ? deposit.amount
              : effectivePrice * (deposit.percent / 100);
            return {
              id: deposit.id,
              label: deposit.label,
              amount: amount.toFixed(2),
              datum: '' // Date will be set by user in Financie section
            };
          });

          financeUpdates = {
            cena: effectivePrice.toFixed(2),
            financieDeposits,
            // Clear legacy fields when using dynamic deposits
            zaloha1: '0',
            zaloha2: '0',
            doplatok: '0'
          };
        } else {
          // Use legacy fixed deposits
          // Priority for legacy: 1. cenaDohodou, 2. prenesenieDP (cenaBezDPH), 3. cenaSDPH
          let legacyEffectivePrice = cenaSDPH;
          if (data.cenaDohodou && data.cenaDohodouValue) {
            legacyEffectivePrice = data.cenaDohodouValue;
          } else if (data.prenesenieDP) {
            legacyEffectivePrice = cenaBezDPH;
          }

          // Check if using default 60/30/10 split
          const platba1Percent = data.platba1Percent || 60;
          const platba2Percent = data.platba2Percent || 30;
          const platba3Percent = data.platba3Percent || 10;

          const isDefaultSplit = platba1Percent === 60 && platba2Percent === 30 && platba3Percent === 10;
          const hasNoManualAmounts = data.platba1Amount == null && data.platba2Amount == null && data.platba3Amount == null;

          // Use saved amounts if available, otherwise calculate with rounding
          let platba1, platba2, platba3;
          if (data.platba1Amount != null) {
            platba1 = data.platba1Amount;
          } else if (isDefaultSplit && hasNoManualAmounts) {
            platba1 = roundUpToTen(legacyEffectivePrice * 0.60);
          } else {
            platba1 = legacyEffectivePrice * platba1Percent / 100;
          }

          if (data.platba2Amount != null) {
            platba2 = data.platba2Amount;
          } else if (isDefaultSplit && hasNoManualAmounts) {
            platba2 = roundUpToTen(legacyEffectivePrice * 0.30);
          } else {
            platba2 = legacyEffectivePrice * platba2Percent / 100;
          }

          if (data.platba3Amount != null) {
            platba3 = data.platba3Amount;
          } else if (isDefaultSplit && hasNoManualAmounts) {
            platba3 = legacyEffectivePrice - platba1 - platba2; // Remainder
          } else {
            platba3 = legacyEffectivePrice * platba3Percent / 100;
          }

          financeUpdates = {
            cena: legacyEffectivePrice.toFixed(2),
            zaloha1: platba1.toFixed(2),
            zaloha2: platba2.toFixed(2),
            doplatok: platba3.toFixed(2),
            financieDeposits: undefined // Clear dynamic deposits when using legacy
          };
        }
      } else {
        // Logic for Puzdra (no detailed finance settings)
        financeUpdates = {
          cena: (selectedItem.cenaSDPH || 0).toFixed(2),
          financieDeposits: undefined,
          zaloha1: '0',
          zaloha2: '0',
          doplatok: '0'
        };
      }
    }

    setFormData(prev => {
      const newItems = prev.cenovePonukyItems.map(item => ({
        ...item,
        selected: item.id === selectedItem.id ? !isCurrentlySelected : false
      }));

      // Update Odsúhlasená KS fields
      // KS1 = Last digits of cisloCP
      // KS2 = Quantity (KS)
      return {
        ...prev,
        cenovePonukyItems: newItems,
        odsuhlesenaKS1: !isCurrentlySelected ? (selectedItem.cisloCP ? (selectedItem.cisloCP.split('/').pop() || '') : '') : '',
        odsuhlesenaKS2: !isCurrentlySelected ? totalQuantity.toString() : '',
        ...financeUpdates
      };
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className={`rounded-lg w-full max-w-[95vw] h-full overflow-hidden flex flex-col ${isDark ? 'bg-dark-800' : 'bg-white'} relative`}
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
                { id: 'objednavky', label: 'Objednávky' },
                { id: 'preberaci-protokol', label: 'Preberací protokol' },
                { id: 'meranie-dokumenty', label: 'Meranie a Dokumenty' },
                { id: 'fotky', label: 'Fotky' },
                { id: 'vyrobne-vykresy', label: 'Výrobné výkresy' },
                { id: 'technicke-vykresy', label: 'Technické výkresy' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 text-white whitespace-nowrap ${activeTab === tab.id
                    ? 'border-white bg-white/30 backdrop-blur-md'
                    : 'border-transparent hover:bg-white/10'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleClose}
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
              {/* Left Sidebar - Moved inside Main Content for Vseobecne tab */}
              {activeTab === 'vseobecne' ? null : null}

              {/* Main Content Area (Form + Popis) */}
              <div className="flex-1 flex flex-col min-h-0 lg:h-full lg:overflow-y-auto">
                <div className="flex-1">
                  {activeTab === 'vseobecne' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                        <div className="w-full lg:w-96 flex-shrink-0 shadow-lg">
                          <VseobecneSidebar
                            formData={formData}
                            setFormData={setFormData}
                            isDark={isDark}
                            firmaOptions={firmaOptions}
                            isLocked={isEffectivelyLocked}
                          />
                        </div>
                        <div className="flex-1">
                          <VseobecneForm
                            formData={formData}
                            setFormData={setFormData}
                            isDark={isDark}
                            isLocked={isEffectivelyLocked}
                          />
                        </div>
                      </div>

                      <div
                        className={`rounded-lg p-4 flex-shrink-0 ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-white border-gray-200'} border`}
                        style={{
                          boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
                        }}
                      >
                        <datalist id="user-names">
                          {user && <option value={`${user.firstName} ${user.lastName}`} />}
                        </datalist>
                        <table className={`w-full text-xs border ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                          <thead>
                            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
                              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Poznámka</th>
                              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-28">Dátum</th>
                              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-48">Pridal</th>
                              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.popisItems.map((item, index) => (
                              <tr key={index} className={isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'}>
                                <td className={`border px-1 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                                  <input
                                    type="text"
                                    value={item.popis || ''}
                                    onChange={(e) => {
                                      const newItems = [...formData.popisItems];
                                      newItems[index].popis = e.target.value;
                                      setFormData(prev => ({ ...prev, popisItems: newItems }));
                                    }}
                                    disabled={isEffectivelyLocked}
                                    className={`w-full text-xs border-0 bg-transparent px-1 py-1 ${isDark ? 'text-white' : 'text-gray-900'} ${isEffectivelyLocked ? 'cursor-not-allowed' : ''}`}
                                  />
                                </td>
                                <td className={`border px-1 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                                  <CustomDatePicker
                                    value={item.datum || ''}
                                    onChange={(val) => {
                                      const newItems = [...formData.popisItems];
                                      newItems[index].datum = val;
                                      setFormData(prev => ({ ...prev, popisItems: newItems }));
                                    }}
                                    disabled={isEffectivelyLocked}
                                    className={`w-full text-xs border-0 bg-transparent px-1 py-1 ${isDark ? 'text-white' : 'text-gray-900'} ${isEffectivelyLocked ? 'cursor-not-allowed' : ''}`}
                                  />
                                </td>
                                <td className={`border px-1 py-1 ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                                  <input
                                    type="text"
                                    list="user-names"
                                    value={item.pridal || ''}
                                    onChange={(e) => {
                                      const newItems = [...formData.popisItems];
                                      newItems[index].pridal = e.target.value;
                                      setFormData(prev => ({ ...prev, popisItems: newItems }));
                                    }}
                                    disabled={isEffectivelyLocked}
                                    className={`w-full text-xs border-0 bg-transparent px-1 py-1 ${isDark ? 'text-white' : 'text-gray-900'} ${isEffectivelyLocked ? 'cursor-not-allowed' : ''}`}
                                  />
                                </td>
                                <td className={`border px-1 py-1 text-center ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                                  {/* Only show delete button if current user is the creator of this note */}
                                  {user && item.pridal === `${user.firstName} ${user.lastName}` && (
                                    <button
                                      onClick={() => {
                                        setNoteToDeleteIndex(index);
                                        setShowDeleteNoteConfirm(true);
                                      }}
                                      disabled={isEffectivelyLocked}
                                      className={`p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors ${isEffectivelyLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {/* Add row button */}
                        <div className="flex justify-center mt-2">
                          <button
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              const userName = user ? `${user.firstName} ${user.lastName}` : '';
                              setFormData(prev => ({
                                ...prev,
                                popisItems: [...prev.popisItems, { datum: today, popis: '', pridal: userName }]
                              }));
                            }}
                            disabled={isEffectivelyLocked}
                            className={`p-1 rounded-full border-2 transition-all duration-200 ${isLocked
                              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                              : 'border-[#e11b28] text-[#e11b28] hover:bg-[#e11b28] hover:text-white hover:scale-110 shadow-sm'
                              }`}
                            title="Pridať riadok"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'cenove-ponuky' && (
                    <TabErrorBoundary>
                      <Suspense fallback={<TabLoadingSpinner isDark={isDark} />}>
                        <CenovePonukyTab
                          items={formData.cenovePonukyItems}
                          onDelete={(index) => {
                            setFormData(prev => ({
                              ...prev,
                              cenovePonukyItems: prev.cenovePonukyItems.filter((_, i) => i !== index)
                            }));
                          }}
                          onUpdate={(items) => {
                            setFormData(prev => ({
                              ...prev,
                              cenovePonukyItems: items
                            }));
                          }}
                          onEdit={handleEditOffer}
                          onGeneratePDF={handleGeneratePDF}
                          onDownloadPDF={handleDownloadPDF}
                          isDark={isDark}
                          isLocked={isEffectivelyLocked}
                          onAddVzor={() => {
                            setVzorModalTabs(['dvere', 'nabytok', 'schody']);
                            setEditingOfferId(null);
                            // Always start with a fresh form when adding new quote
                            setEditingOfferData(undefined);
                            setShowVzorModal(true);
                          }}
                          onToggleSelect={handleToggleSelect}
                          onSave={performSave}
                          predmet={formData.predmet}
                          cisloZakazky={formData.cisloZakazky}
                        />
                      </Suspense>
                    </TabErrorBoundary>
                  )}

                  {activeTab === 'objednavky' && (
                    <TabErrorBoundary>
                      <Suspense fallback={<TabLoadingSpinner isDark={isDark} />}>
                        <ObjednavkyTab
                          items={formData.objednavkyItems}
                          onUpdate={(items) => setFormData(prev => ({ ...prev, objednavkyItems: items }))}
                          isDark={isDark}
                          user={user}
                          entries={entries}
                          selectedOrderIndex={selectedOrderIndex}
                          isLocked={isEffectivelyLocked}
                          onAddVzor={() => {
                            setShowOrderModal(true);
                          }}
                          onEdit={handleEditOrderAction}
                          headerInfo={{
                            vypracoval: formData.vypracoval,
                            telefon: userPhone,
                            email: user?.email || ''
                          }}
                        />
                      </Suspense>
                    </TabErrorBoundary>
                  )}

                  {activeTab === 'meranie-dokumenty' && (
                    <TabErrorBoundary>
                      <Suspense fallback={<TabLoadingSpinner isDark={isDark} />}>
                        <MeranieTab
                          isDark={isDark}
                          items={formData.meranieItems}
                          onUpdate={(items: any) => setFormData(prev => ({ ...prev, meranieItems: items }))}
                          isLocked={isEffectivelyLocked}
                          user={user}
                          spisEntryId={internalId}
                        />
                      </Suspense>
                    </TabErrorBoundary>
                  )}

                  {activeTab === 'fotky' && (
                    <TabErrorBoundary>
                      <Suspense fallback={<TabLoadingSpinner isDark={isDark} />}>
                        <FotkyTab
                          uploadedPhotos={uploadedPhotos}
                          setUploadedPhotos={setUploadedPhotos}
                          isLocked={isEffectivelyLocked}
                        />
                      </Suspense>
                    </TabErrorBoundary>
                  )}

                  {activeTab === 'vyrobne-vykresy' && (
                    <TabErrorBoundary>
                      <Suspense fallback={<TabLoadingSpinner isDark={isDark} />}>
                        <VyrobneVykresyTab
                          isDark={isDark}
                          items={formData.vyrobneVykresy}
                          onUpdate={(items: any) => setFormData(prev => ({ ...prev, vyrobneVykresy: items }))}
                          isLocked={isEffectivelyLocked}
                          user={user}
                          spisEntryId={internalId}
                        />
                      </Suspense>
                    </TabErrorBoundary>
                  )}

                  {activeTab === 'technicke-vykresy' && (
                    <TabErrorBoundary>
                      <Suspense fallback={<TabLoadingSpinner isDark={isDark} />}>
                        <TechnickeVykresyTab
                          isDark={isDark}
                          items={formData.technickeItems}
                          onUpdate={(items: any) => setFormData(prev => ({ ...prev, technickeItems: items }))}
                          isLocked={isEffectivelyLocked}
                          user={user}
                          spisEntryId={internalId}
                        />
                      </Suspense>
                    </TabErrorBoundary>
                  )}

                  {activeTab === 'preberaci-protokol' && (
                    <TabErrorBoundary>
                      <Suspense fallback={<TabLoadingSpinner isDark={isDark} />}>
                        <PreberaciProtokolTab
                          isDark={isDark}
                          cenovePonukyItems={formData.cenovePonukyItems}
                          data={formData.preberaciProtokol}
                          onChange={(data) => setFormData(prev => ({ ...prev, preberaciProtokol: data }))}
                          formData={formData} // Pass full form data for defaults
                        />
                      </Suspense>
                    </TabErrorBoundary>
                  )}
                </div>

                {/* Popis section - moved here to be part of main column flow */}
                {activeTab === 'vseobecne' ? null : null}
              </div>

              {/* Desktop Action Buttons Sidebar */}
              <div
                className={`hidden lg:flex w-48 rounded-lg flex-col justify-center gap-3 p-3 flex-shrink-0 h-fit ${isDark ? 'bg-dark-700 border border-dark-500' : 'bg-gray-50 border border-gray-200'}`}
                style={{
                  boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
                }}
              >
                <button
                  onClick={handleSaveClick}
                  disabled={isLocked || isSaving || isLockedByOther}
                  className={`px-3 py-3 text-sm flex items-center justify-center text-white rounded-lg text-center transition-colors font-semibold shadow-md ${isLocked || isSaving || isLockedByOther ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSaving ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  )}
                  {isSaving ? 'Ukladám...' : 'Uložiť'}
                </button>
                <button
                  onClick={() => setIsLocked(!isLocked)}
                  disabled={isLockedByOther}
                  className={`px-3 py-3 text-sm flex items-center justify-center rounded-lg text-center transition-colors font-semibold ${isLockedByOther ? 'bg-gray-400 text-white cursor-not-allowed' : (isLocked ? 'bg-yellow-500 text-white hover:bg-yellow-600' : (isDark ? 'text-gray-200 bg-dark-600 hover:bg-dark-500' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'))}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isLocked ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    )}
                  </svg>
                  {isLocked ? 'Odomknúť' : 'Zamknúť'}
                </button>

                <button
                  onClick={() => setShowTaskModal(true)}
                  className="px-3 py-3 text-sm flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors font-semibold shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Priradiť úlohu
                </button>

                <button
                  onClick={handleDeleteClick}
                  disabled={isLocked || isLockedByOther}
                  className={`px-3 py-3 text-sm flex items-center justify-center text-white rounded-lg text-center transition-colors font-semibold mt-2 shadow-md ${isLocked || isLockedByOther ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m-3 0h14"></path></svg>
                  Vymazať
                </button>

                {/* Document lock message */}
                {isLockedByOther && lockInfo && (
                  <div className={`mt-3 p-3 rounded-lg text-xs ${isDark ? 'bg-orange-900/30 border border-orange-700 text-orange-300' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-semibold">Dokument upravuje:</span>
                    </div>
                    <div className="font-medium">{lockInfo.lockedByName}</div>
                    {lockInfo.queuePosition > 1 && (
                      <div className="mt-1 text-[10px] opacity-75">
                        Vaša pozícia v rade: {lockInfo.queuePosition}
                      </div>
                    )}
                    <div className="mt-2 text-[10px] opacity-75">
                      Potom ako dokončia zmeny, budete môcť upravovať.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Fixed Buttons (Outside scroll area) */}
            <div className={`lg:hidden border-t flex-shrink-0 z-20 ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-white border-gray-200'}`}>
              {/* Mobile lock message */}
              {isLockedByOther && lockInfo && (
                <div className={`mx-3 mt-3 p-2 rounded-lg text-xs ${isDark ? 'bg-orange-900/30 border border-orange-700 text-orange-300' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Upravuje: <strong>{lockInfo.lockedByName}</strong></span>
                    {lockInfo.queuePosition > 1 && <span className="opacity-75">(#{lockInfo.queuePosition} v rade)</span>}
                  </div>
                </div>
              )}
              <div className="p-3 flex gap-2">
                <button
                  onClick={handleSaveClick}
                  disabled={isLocked || isSaving || isLockedByOther}
                  className={`flex-1 px-2 py-3 text-xs flex items-center justify-center text-white rounded-lg text-center transition-colors font-semibold shadow-sm ${isLocked || isSaving || isLockedByOther ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSaving ? (
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  )}
                  {isSaving ? 'Ukladám...' : 'Uložiť'}
                </button>
                <button
                  onClick={() => setIsLocked(!isLocked)}
                  disabled={isLockedByOther}
                  className={`flex-1 px-2 py-3 text-xs flex items-center justify-center rounded-lg text-center transition-colors font-semibold shadow-sm ${isLockedByOther ? 'bg-gray-400 text-white cursor-not-allowed' : (isLocked ? 'bg-yellow-500 text-white hover:bg-yellow-600' : (isDark ? 'text-gray-200 bg-dark-600 hover:bg-dark-500' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'))}`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isLocked ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    )}
                  </svg>
                  {isLocked ? 'Odomknúť' : 'Zamknúť'}
                </button>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex-1 px-2 py-3 text-xs flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors font-semibold shadow-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Úloha
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isLocked || isLockedByOther}
                  className={`flex-1 px-2 py-3 text-xs flex items-center justify-center text-white rounded-lg text-center transition-colors font-semibold shadow-sm ${isLocked || isLockedByOther ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m-3 0h14"></path></svg>
                  Vymazať
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTaskModal && (
        <Suspense fallback={null}>
          <TaskCreateModal
            isOpen={showTaskModal}
            onClose={() => setShowTaskModal(false)}
            spisId={internalId}
            spisCislo={formData.cisloZakazky || formData.predmet}
          />
        </Suspense>
      )}

      {showVzorModal && (
        <Suspense fallback={null}>
          <AddTemplateModal
            isOpen={showVzorModal}
            onClose={() => setShowVzorModal(false)}
            onSave={handleAddTemplateSave}
            onSaveAsNew={handleSaveAsNew}
            isEditing={!!editingOfferId}
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
            fullCisloCP={editingOfferData?.cisloCP || nextVariantCP}
            cisloZakazky={formData.cisloZakazky}
            onCisloZakazkyChange={(value) => setFormData(prev => ({ ...prev, cisloZakazky: value }))}
            creatorPhone={userPhone}
            creatorEmail={user?.email}
            architectInfo={{
              priezvisko: formData.architektonickyPriezvisko,
              meno: formData.architektonickeMeno,
              firma: "", // Assuming no specific company field for architect in the form data provided
              ulica: formData.architektonickyUlica,
              mesto: formData.architektonickyMesto,
              psc: formData.architektonickyPsc,
              telefon: formData.architektonickyTelefon,
              email: formData.architektonickyEmail
            }}
            editingData={editingOfferData}
            visibleTabs={vzorModalTabs}
            isLocked={isEffectivelyLocked}
          />
        </Suspense>
      )}

      {showOrderModal && (
        <Suspense fallback={null}>
          <AddOrderModal
            isOpen={showOrderModal}
            onClose={() => setShowOrderModal(false)}
            onSave={handleAddOrderSave}
            vypracoval={formData.vypracoval}
            telefon={userPhone} // Use user settings phone
            email={user?.email || ''} // Use user email
            editingData={editingOrderData}
            isLocked={isEffectivelyLocked}
            orderNumber={editingOrderNumber || nextOrderNumber}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Dialog for Notes */}
      <ConfirmDialog
        isOpen={showDeleteNoteConfirm}
        title="Vymazať poznámku"
        message="Naozaj chcete zmazať túto poznámku?"
        onConfirm={confirmDeleteNote}
        onCancel={() => {
          setShowDeleteNoteConfirm(false);
          setNoteToDeleteIndex(null);
        }}
        confirmText="Vymazať"
        cancelText="Zrušiť"
        isDark={isDark}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Vymazať záznam"
        message="Naozaj chcete vymazať tento záznam? Táto akcia sa nedá vrátiť späť."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Vymazať"
        cancelText="Zrušiť"
        isDark={isDark}
      />

      {/* Close Confirmation Dialog */}
      <CloseConfirmDialog
        isOpen={showCloseConfirm}
        onContinue={() => setShowCloseConfirm(false)}
        onSave={() => {
          performSave();
          setShowCloseConfirm(false);
          onClose();
        }}
        onDiscard={() => {
          setShowCloseConfirm(false);
          onClose();
        }}
        isDark={isDark}
      />

      {/* Contact Changes Modal */}
      {showContactChangesModal && (
        <Suspense fallback={null}>
          <ContactChangesModal
            isOpen={showContactChangesModal}
            onClose={handleCancelContactChanges}
            onApply={handleApplyContactChanges}
            changes={pendingContactChanges}
            isDark={isDark}
          />
        </Suspense>
      )}
    </>
  );
};