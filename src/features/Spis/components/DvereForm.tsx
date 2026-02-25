import React, { useRef, useState, useEffect, useCallback } from 'react';
import { DvereData, ProductPhoto } from '../types';
import { NOTES_DVERE } from '../utils/legalTexts';
import { QuoteLayout } from './common/QuoteLayout';
import { QuoteSummary } from './common/QuoteSummary';
import { GenericItemsTable } from './common/GenericItemsTable';
import { calculateDvereTotals } from '../utils/priceCalculations';
import { useResizableColumns } from '../hooks/useResizableColumns';
import { sortPinnedItems } from '../utils/itemSorting';
import { GalleryModal } from './common/GalleryModal';

interface DvereFormProps {
  data: DvereData;
  onChange: (data: DvereData) => void;
  isDark: boolean;
  headerInfo: {
    customer?: {
      firma: string;
      ulica: string;
      mesto: string;
      psc: string;
      telefon: string;
      email: string;
      meno: string;
      priezvisko: string;
      ico?: string;
      dic?: string;
      icDph?: string;
    };
    architect?: {
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
    billing?: {
      priezvisko: string;
      meno: string;
      adresa: string;
      ico: string;
      dic: string;
      icDph: string;
      telefon: string;
      email: string;
    };
    vypracoval?: string;
    // Legacy / Flat support
    firma?: string;
    ulica?: string;
    mesto?: string;
    psc?: string;
    telefon?: string;
    email?: string;
    activeSource?: string;
  };
  onRefreshBilling?: () => void;
  usingSnapshot?: boolean;
}

// Default payment percentages
const DEFAULT_PLATBA1 = 60;
const DEFAULT_PLATBA2 = 30;
const DEFAULT_PLATBA3 = 10;

const DEFAULT_WIDTHS = {
  miestnost: 8,
  polozka: 10,
  typRozmer: 12,
  pl: 5,
  zamok: 6,
  sklo: 5,
  povrch: 8,
  poznamka: 17,
  ks: 5,
  cenaKs: 8,
  cenaCelkom: 10
};

export const DvereForm: React.FC<DvereFormProps> = ({ data, onChange, isDark, headerInfo, onRefreshBilling, usingSnapshot }) => {
  const totals = calculateDvereTotals(data);
  const tableRef = useRef<HTMLTableElement>(null);

  // Hidden columns logic
  const hiddenColumns = data.hiddenColumns || [];
  const isColumnVisible = (key: string) => !hiddenColumns.includes(key);

  const visibleColumns = [
    'miestnost',
    'polozka',
    'typRozmer',
    ...(isColumnVisible('pl') ? ['pl'] : []),
    ...(isColumnVisible('zamok') ? ['zamok'] : []),
    ...(isColumnVisible('sklo') ? ['sklo'] : []),
    ...(isColumnVisible('povrch') ? ['povrch'] : []),
    ...(isColumnVisible('poznamka') ? ['poznamka'] : [])
  ];

  const { columnWidths, startResizing, setColumnWidths } = useResizableColumns({
    defaultWidths: DEFAULT_WIDTHS,
    visibleColumns,
    tableRef,
    savedWidths: data.columnWidths,
    onWidthsChange: (widths) => onChange({ ...data, columnWidths: widths })
  });

  // State for príplatok from výrobky modal
  const [showPriplatokModal, setShowPriplatokModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // Format: "roomIndex-itemType" e.g. "0-dvere", "1-zarubna"
  const [priplatokPercent, setPriplatokPercent] = useState<number>(10);
  const [priplatokNazov, setPriplatokNazov] = useState<string>('Príplatok z výrobkov');
  const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Helper to calculate price for specific item IDs from vyrobky
  const calculatePriceForItemIds = useCallback((itemIds: string[]): number => {
    return itemIds.reduce((sum, itemId) => {
      const [roomIndexStr, type] = itemId.split('-');
      const roomIndex = parseInt(roomIndexStr, 10);
      const vyrobok = (data.vyrobky || [])[roomIndex];
      if (!vyrobok) return sum;

      let price = 0;
      if (type === 'dvere' && vyrobok.hasDvere) {
        price = (vyrobok.ks || 0) * (vyrobok.cenaDvere || 0);
      } else if (type === 'zarubna' && vyrobok.hasZarubna) {
        price = (vyrobok.ksZarubna || 0) * (vyrobok.cenaZarubna || 0);
      } else if (type === 'obklad' && vyrobok.hasObklad) {
        price = (vyrobok.ksObklad || 0) * (vyrobok.cenaObklad || 0);
      } else if (type === 'prazdne' && vyrobok.hasPrazdne) {
        price = (vyrobok.ksPrazdne || 0) * (vyrobok.cenaPrazdne || 0);
      }
      return sum + price;
    }, 0);
  }, [data.vyrobky]);

  // Recalculate percentage-based príplatky when vyrobky prices change
  useEffect(() => {
    const hasPercentPriplatky = data.priplatky?.some((p: any) => p.percentFromVyrobky && p.selectedVyrobkyIds);
    if (!hasPercentPriplatky) return;

    const updatedPriplatky = (data.priplatky || []).map((priplatok: any) => {
      if (priplatok.percentFromVyrobky && priplatok.selectedVyrobkyIds) {
        const selectedTotal = calculatePriceForItemIds(priplatok.selectedVyrobkyIds);
        const newValue = selectedTotal * (priplatok.percentFromVyrobky / 100);
        return {
          ...priplatok,
          cenaKs: newValue,
          cenaCelkom: newValue
        };
      }
      return priplatok;
    });

    // Only update if values actually changed
    const hasChanged = updatedPriplatky.some((p: any, i: number) =>
      p.cenaCelkom !== data.priplatky[i]?.cenaCelkom
    );

    if (hasChanged) {
      onChange({ ...data, priplatky: updatedPriplatky });
    }
  }, [data.vyrobky, calculatePriceForItemIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleColumnVisibility = (columnKey: string) => {
    const currentHidden = data.hiddenColumns || [];
    const isNowHidden = !currentHidden.includes(columnKey);

    if (isNowHidden) {
      // HIDING LOGIC (Keep existing approach: transfer width to elastic column)
      setColumnWidths(prev => {
        const currentWidth = prev[columnKey] || 5;
        const targetCol = 'typRozmer';
        const targetWidth = prev[targetCol] || 15;
        return {
          ...prev,
          [targetCol]: targetWidth + currentWidth
        };
      });
    } else {
      // SHOWING LOGIC: RESET TO DEFAULTS + REDISTRIBUTE HIDDEN
      // This resets all columns to their original proportional state, correcting any drift/corruption.
      const defaultState: any = DEFAULT_WIDTHS;

      // Calculate width of columns that will REMAIN hidden after this operation
      const remainingHidden = currentHidden.filter(c => c !== columnKey);

      let extraWidthForTypRozmer = 0;
      remainingHidden.forEach(hiddenKey => {
        // Accumulate width from defaultState for still-hidden columns
        extraWidthForTypRozmer += (defaultState[hiddenKey] || 0);
      });

      // Apply the reset state with compensated width
      setColumnWidths({
        ...defaultState,
        typRozmer: defaultState.typRozmer + extraWidthForTypRozmer
      });
    }

    const newHidden = isNowHidden
      ? [...currentHidden, columnKey]
      : currentHidden.filter(c => c !== columnKey);
    onChange({ ...data, hiddenColumns: newHidden });
  };

  // Generate list of all individual items from výrobky


  // Generate list of all individual items from výrobky
  const getAllItems = () => {
    const items: { id: string; label: string; price: number; roomIndex: number; type: string }[] = [];
    (data.vyrobky || []).forEach((vyrobok, roomIndex) => {
      const roomName = vyrobok.miestnost || `Miestnosť ${roomIndex + 1}`;
      if (vyrobok.hasDvere && vyrobok.cenaDvere > 0) {
        items.push({
          id: `${roomIndex}-dvere`,
          label: `${roomName} - Dvere`,
          price: (vyrobok.ks || 0) * (vyrobok.cenaDvere || 0),
          roomIndex,
          type: 'dvere'
        });
      }
      if (vyrobok.hasZarubna && vyrobok.cenaZarubna > 0) {
        items.push({
          id: `${roomIndex}-zarubna`,
          label: `${roomName} - Zárubňa`,
          price: (vyrobok.ksZarubna || 0) * (vyrobok.cenaZarubna || 0),
          roomIndex,
          type: 'zarubna'
        });
      }
      if (vyrobok.hasObklad && vyrobok.cenaObklad > 0) {
        items.push({
          id: `${roomIndex}-obklad`,
          label: `${roomName} - Obklad`,
          price: (vyrobok.ksObklad || 0) * (vyrobok.cenaObklad || 0),
          roomIndex,
          type: 'obklad'
        });
      }
      if (vyrobok.hasPrazdne && vyrobok.cenaPrazdne > 0) {
        items.push({
          id: `${roomIndex}-prazdne`,
          label: `${roomName} - Prázdne`,
          price: (vyrobok.ksPrazdne || 0) * (vyrobok.cenaPrazdne || 0),
          roomIndex,
          type: 'prazdne'
        });
      }
    });
    return items;
  };

  // Helper to reset payment overrides when items change
  const onChangeWithPaymentReset = (newData: DvereData) => {
    onChange({
      ...newData,
      manualCenaSDPH: undefined,
      platba1Percent: DEFAULT_PLATBA1,
      platba2Percent: DEFAULT_PLATBA2,
      platba3Percent: DEFAULT_PLATBA3,
      platba1Amount: null,
      platba2Amount: null,
      platba3Amount: null,
      deposits: newData.deposits ? newData.deposits.map(d => ({ ...d, amount: null })) : undefined
    });
  };

  // Helper to reset only payment amounts (forcing recalculation from %) when totals change (e.g. discount)
  const onChangeWithPaymentRecalc = (newData: DvereData) => {
    onChange({
      ...newData,
      manualCenaSDPH: undefined,
      platba1Amount: null,
      platba2Amount: null,
      platba3Amount: null,
      deposits: newData.deposits ? newData.deposits.map(d => ({ ...d, amount: null })) : undefined
    });
  };

  // Helper to create columns with auto-calc logic
  const createColumns = () => [
    { key: 'nazov', label: 'názov', width: 'min-w-[280px]' },
    {
      key: 'ks',
      label: 'ks',
      width: 'w-10',
      align: 'right' as const,
      render: (item: any, _idx: number, update: (i: any) => void) => (
        <input
          type="number"
          value={item.ks}
          onChange={(e) => {
            const ks = parseInt(e.target.value) || 0;
            update({ ...item, ks, cenaCelkom: ks * item.cenaKs });
          }}
          className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
        />
      )
    },
    {
      key: 'cenaKs',
      label: 'cena / ks',
      width: 'w-14',
      align: 'right' as const,
      render: (item: any, _idx: number, update: (i: any) => void) => (
        <div className="flex items-center justify-end">
          <input
            type="number"
            value={item.cenaKs}
            onChange={(e) => {
              const cenaKs = parseFloat(e.target.value) || 0;
              update({ ...item, cenaKs, cenaCelkom: item.ks * cenaKs });
            }}
            className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
          />
          <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
        </div>
      )
    },
    {
      key: 'cenaCelkom',
      label: 'cena celkom',
      width: 'w-24 min-w-[100px]',
      align: 'right' as const,
      render: (item: any) => <span>{(item.ks * item.cenaKs).toFixed(2)} €</span>
    }
  ];

  const commonColumns = createColumns();

  const handleAddSpecification = (type: 'dvere' | 'zarubna' | 'obklad') => {
    const newSpec = {
      id: Date.now(),
      type,
      value: ''
    };
    // Ensure specifications array exists
    const specs = data.specifications || [];
    onChange({ ...data, specifications: [...specs, newSpec] });
  };

  const handleRemoveSpecification = (index: number) => {
    const specs = [...(data.specifications || [])];
    specs.splice(index, 1);
    onChange({ ...data, specifications: specs });
  };

  const handleUpdateSpecification = (index: number, value: string) => {
    const specs = [...(data.specifications || [])];
    specs[index].value = value;
    onChange({ ...data, specifications: specs });
  };

  // Add a new room with all parts (Dvere, Zárubňa, Obklad, Prázdne) enabled by default
  const handleAddRoom = () => {
    const newVyrobok = {
      id: Date.now(),
      miestnost: '',
      dvereTypRozmer: '',
      dvereOtvor: '',
      pL: 'P dnu',
      zamok: 'BB',
      sklo: '',
      povrch: '',
      povrchZarubna: '',
      povrchObklad: '',
      poznamkaDvere: '',
      poznamkaZarubna: '',
      poznamkaObklad: '',
      poznamkaPrazdne: '',
      typObklad: '',
      typPrazdne: '',
      polozkaPrazdne: '',
      pLPrazdne: '',
      zamokPrazdne: '',
      skloPrazdne: '',
      povrchPrazdne: '',
      ks: 1,
      ksZarubna: 1,
      ksObklad: 1,
      ksPrazdne: 1,
      cenaDvere: 0,
      cenaZarubna: 0,
      cenaObklad: 0,
      cenaPrazdne: 0,
      hasDvere: true,
      hasZarubna: true,
      hasObklad: true,
      hasPrazdne: true,
    };
    onChangeWithPaymentReset({ ...data, vyrobky: [...data.vyrobky, newVyrobok] });
  };

  // Toggle parts of an existing item
  const toggleItemPart = (index: number, part: 'hasDvere' | 'hasZarubna' | 'hasObklad' | 'hasPrazdne') => {
    const newVyrobky = [...data.vyrobky];
    const item = { ...newVyrobky[index] }; // Deep copy the item to avoid mutation
    const isRemoving = item[part]; // Currently true → toggling to false = removing

    item[part] = !item[part];

    // Zero out ks/cena when removing a part so totals and PDF update correctly
    if (isRemoving) {
      if (part === 'hasDvere') {
        item.ks = 0;
        item.cenaDvere = 0;
      } else if (part === 'hasZarubna') {
        item.ksZarubna = 0;
        item.cenaZarubna = 0;
      } else if (part === 'hasObklad') {
        item.ksObklad = 0;
        item.cenaObklad = 0;
      } else if (part === 'hasPrazdne') {
        item.ksPrazdne = 0;
        item.cenaPrazdne = 0;
      }
    }

    newVyrobky[index] = item;
    onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
  };

  // Photo upload handling
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;

        // Create an image to get dimensions and crop to centered square
        const img = new Image();
        img.onload = () => {
          // Calculate crop dimensions for centered square
          const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
          const srcX = (img.naturalWidth - srcSize) / 2;
          const srcY = (img.naturalHeight - srcSize) / 2;

          // Create canvas to crop the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Target size for stored image (good quality but not too large)
          const targetSize = 800;
          canvas.width = targetSize;
          canvas.height = targetSize;

          if (ctx) {
            // Draw the centered square portion of the image
            ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, targetSize, targetSize);

            // Get the cropped square image as base64
            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            const newPhoto: ProductPhoto = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              base64: croppedBase64,
              description: ''
            };
            const currentPhotos = data.productPhotos || [];
            onChange({ ...data, productPhotos: [...currentPhotos, newPhoto] });
          }
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    });

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGallerySelect = (base64: string) => {
    const newPhoto: ProductPhoto = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      base64: base64,
      description: ''
    };
    const currentPhotos = data.productPhotos || [];
    onChange({ ...data, productPhotos: [...currentPhotos, newPhoto] });
  };

  const handleRemovePhoto = (photoId: string) => {
    const currentPhotos = data.productPhotos || [];
    onChange({ ...data, productPhotos: currentPhotos.filter(p => p.id !== photoId) });
  };

  const handleUpdatePhotoDescription = (photoId: string, description: string) => {
    const currentPhotos = data.productPhotos || [];
    onChange({
      ...data,
      productPhotos: currentPhotos.map(p => p.id === photoId ? { ...p, description } : p)
    });
  };

  // Calculate total price for selected items
  const calculateSelectedItemsTotal = (): number => {
    const allItems = getAllItems();
    return selectedItems.reduce((sum, itemId) => {
      const item = allItems.find(i => i.id === itemId);
      return sum + (item?.price || 0);
    }, 0);
  };

  // Handle opening the príplatok modal
  const handleOpenPriplatokModal = () => {
    setSelectedItems([]);
    setPriplatokPercent(15);
    setPriplatokNazov('dyha dub morený');
    setShowPriplatokModal(true);
  };

  // Handle adding the príplatok from selected items
  const handleAddPriplatokFromVyrobky = () => {
    if (selectedItems.length === 0) {
      alert('Vyberte aspoň jednu položku');
      return;
    }

    const selectedTotal = calculateSelectedItemsTotal();
    const priplatokValue = selectedTotal * (priplatokPercent / 100);

    // Format name with percentage
    const formattedNazov = `${priplatokNazov} - ${priplatokPercent}%`;

    const newPriplatok = {
      id: Date.now(),
      nazov: formattedNazov,
      ks: 1,
      cenaKs: priplatokValue,
      cenaCelkom: priplatokValue,
      // Store percentage info for dynamic recalculation
      percentFromVyrobky: priplatokPercent,
      selectedVyrobkyIds: [...selectedItems]
    };

    onChangeWithPaymentReset({
      ...data,
      priplatky: [...(data.priplatky || []), newPriplatok]
    });

    setShowPriplatokModal(false);
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Select/deselect all items
  const toggleSelectAll = () => {
    const allItems = getAllItems();
    if (selectedItems.length === allItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allItems.map(item => item.id));
    }
  };

  return (
    <QuoteLayout
      isDark={isDark}
      headerInfo={headerInfo}
      data={data}
      onChange={onChange}
      totals={totals}
      defaultLegalText={NOTES_DVERE}
      onRefreshBilling={onRefreshBilling}
      usingSnapshot={usingSnapshot}
    >
      {/* Product description */}
      <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>Popis zakázky:</h3>
        <div className="mt-1">
          <input
            type="text"
            value={data.popisVyrobkov}
            onChange={(e) => onChange({ ...data, popisVyrobkov: e.target.value })}
            placeholder="Popis zakázky"
            className={`w-full px-3 py-1.5 text-sm font-normal rounded border ${isDark ? 'bg-dark-800 text-white border-gray-500' : 'bg-white text-gray-800 border-gray-300'} focus:outline-none focus:ring-1 focus:ring-[#e11b28]`}
          />
        </div>
      </div>

      {/* Specifications Section with Photos */}
      <div className={`rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} p-4`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>Výrobky:</h3>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left side - Specifications */}
          <div className="flex-1 space-y-3">
            {/* Dvere group */}
            {(() => {
              const dvereSpecs = (data.specifications || [])
                .map((spec, idx) => ({ ...spec, originalIndex: idx }))
                .filter(spec => spec.type === 'dvere');
              if (dvereSpecs.length === 0) return null;
              return (
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <span className={`md:w-20 text-xs text-left md:text-right md:pt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Dvere:</span>
                  <div className="flex-1 space-y-1">
                    {dvereSpecs.map((spec) => (
                      <div key={spec.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleUpdateSpecification(spec.originalIndex, e.target.value)}
                          className={`flex-1 px-2 py-1 text-xs rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border`}
                        />
                        <button
                          onClick={() => handleRemoveSpecification(spec.originalIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => handleAddSpecification('dvere')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+</button>
                  </div>
                </div>
              );
            })()}

            {/* Zárubňa group */}
            {(() => {
              const zarubnaSpecs = (data.specifications || [])
                .map((spec, idx) => ({ ...spec, originalIndex: idx }))
                .filter(spec => spec.type === 'zarubna');
              if (zarubnaSpecs.length === 0) return null;
              return (
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <span className={`md:w-20 text-xs text-left md:text-right md:pt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Zárubňa:</span>
                  <div className="flex-1 space-y-1">
                    {zarubnaSpecs.map((spec) => (
                      <div key={spec.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleUpdateSpecification(spec.originalIndex, e.target.value)}
                          className={`flex-1 px-2 py-1 text-xs rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border`}
                        />
                        <button
                          onClick={() => handleRemoveSpecification(spec.originalIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => handleAddSpecification('zarubna')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+</button>
                  </div>
                </div>
              );
            })()}

            {/* Obklad group */}
            {(() => {
              const obkladSpecs = (data.specifications || [])
                .map((spec, idx) => ({ ...spec, originalIndex: idx }))
                .filter(spec => spec.type === 'obklad');
              if (obkladSpecs.length === 0) return null;
              return (
                <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                  <span className={`md:w-20 text-xs text-left md:text-right md:pt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>Obklad:</span>
                  <div className="flex-1 space-y-1">
                    {obkladSpecs.map((spec) => (
                      <div key={spec.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => handleUpdateSpecification(spec.originalIndex, e.target.value)}
                          className={`flex-1 px-2 py-1 text-xs rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-300'} border`}
                        />
                        <button
                          onClick={() => handleRemoveSpecification(spec.originalIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => handleAddSpecification('obklad')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+</button>
                  </div>
                </div>
              );
            })()}

            {/* Add buttons for types that don't have any entries yet */}
            <div className="flex flex-wrap gap-2 md:ml-[88px]">
              {!(data.specifications || []).some(s => s.type === 'dvere') && (
                <button onClick={() => handleAddSpecification('dvere')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+ Dvere</button>
              )}
              {!(data.specifications || []).some(s => s.type === 'zarubna') && (
                <button onClick={() => handleAddSpecification('zarubna')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+ Zárubňa</button>
              )}
              {!(data.specifications || []).some(s => s.type === 'obklad') && (
                <button onClick={() => handleAddSpecification('obklad')} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>+ Obklad</button>
              )}
            </div>
          </div>

          {/* Right side - Photo Upload */}
          <div className={`w-full md:w-64 border-t md:border-t-0 md:border-l ${isDark ? 'border-dark-500' : 'border-gray-200'} pt-4 md:pt-0 pl-0 md:pl-4 mt-2 md:mt-0`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fotky výrobkov:</span>
              <button
                onClick={handleAddPhoto}
                className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                + Pridať
              </button>
              <button
                onClick={() => setShowGalleryModal(true)}
                className={`text-xs px-2 py-1 rounded border ml-2 ${isDark ? 'border-gray-500 text-gray-300 hover:bg-dark-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                + Galéria
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Photos Grid - 2 per row */}
            <div className="grid grid-cols-2 gap-2">
              {(data.productPhotos || []).map((photo) => (
                <div key={photo.id} className={`relative rounded border ${isDark ? 'border-dark-500 bg-dark-600' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="aspect-square relative overflow-hidden rounded-t">
                    <img
                      src={photo.base64}
                      alt={photo.description || 'Product photo'}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    value={photo.description}
                    onChange={(e) => handleUpdatePhotoDescription(photo.id, e.target.value)}
                    placeholder="Popis..."
                    className={`w-full px-1 py-1 text-[10px] border-t ${isDark ? 'bg-dark-600 text-white border-dark-500' : 'bg-white text-gray-800 border-gray-200'} focus:outline-none rounded-b`}
                  />
                </div>
              ))}

              {/* Empty placeholder if no photos */}
              {(!data.productPhotos || data.productPhotos.length === 0) && (
                <div
                  onClick={handleAddPhoto}
                  className={`aspect-square rounded border-2 border-dashed ${isDark ? 'border-dark-500 hover:border-gray-400' : 'border-gray-300 hover:border-gray-400'} flex items-center justify-center cursor-pointer transition-colors col-span-2`}
                >
                  <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">Kliknite pre pridanie</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Výrobky Table */}
      <div className={`rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="text-xs quote-table table-fixed bg-white isolate w-full"
          >
            <colgroup>
              <col style={{ width: '32px' }} />
              <col style={{ width: `${columnWidths.miestnost || 8}%` }} />
              <col style={{ width: `${columnWidths.polozka || 15}%` }} />
              <col style={{ width: `${columnWidths.typRozmer || 15}%` }} />
              {isColumnVisible('pl') && <col style={{ width: `${columnWidths.pl || 5}%` }} />}
              {isColumnVisible('zamok') && <col style={{ width: `${columnWidths.zamok || 5}%` }} />}
              {isColumnVisible('sklo') && <col style={{ width: `${columnWidths.sklo || 8}%` }} />}
              {isColumnVisible('povrch') && <col style={{ width: `${columnWidths.povrch || 8}%` }} />}
              {isColumnVisible('poznamka') && <col style={{ width: `${columnWidths.poznamka || 15}%` }} />}
              <col style={{ width: '40px' }} />
              <col style={{ width: '75px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '50px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-center border-r border-white/20 w-8 relative group">
                  {hiddenColumns.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowHiddenColumnsMenu(!showHiddenColumnsMenu)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-xs font-bold mx-auto"
                        title="Zobraziť skryté stĺpce"
                      >
                        +
                      </button>
                      {showHiddenColumnsMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowHiddenColumnsMenu(false)} />
                          <div className={`absolute left-0 top-full mt-1 z-20 w-48 rounded shadow-lg border p-1 ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-white border-gray-200'}`}>
                            {hiddenColumns.map(col => (
                              <button
                                key={col}
                                onClick={() => {
                                  toggleColumnVisibility(col);
                                  if (hiddenColumns.length <= 1) setShowHiddenColumnsMenu(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 ${isDark ? 'text-gray-200 hover:bg-dark-700' : 'text-gray-700 hover:bg-gray-100'}`}
                              >
                                <span className="text-green-500">+</span>
                                {col === 'pl' ? 'P / Ľ' : col.charAt(0).toUpperCase() + col.slice(1)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </th>
                <th className="relative px-2 py-2 text-left border-r border-white/20 select-none">
                  miestnosť
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50"
                    onMouseDown={(e) => startResizing('miestnost', e)}
                  />
                </th>
                <th className="relative px-2 py-2 text-left border-r border-white/20 select-none">
                  položka
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50"
                    onMouseDown={(e) => startResizing('polozka', e)}
                  />
                </th>
                <th className="relative px-2 py-2 text-left border-r border-white/20 select-none">
                  typ / rozmer
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/50"
                    onMouseDown={(e) => startResizing('typRozmer', e)}
                  />
                </th>
                {isColumnVisible('pl') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>P / Ľ</span>
                      <button onClick={() => toggleColumnVisibility('pl')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                    <div
                      className="absolute right-0 top-0 h-full w-4 translate-x-1/2 cursor-col-resize hover:bg-white/50 z-10"
                      onMouseDown={(e) => startResizing('pl', e)}
                    />
                  </th>
                )}
                {isColumnVisible('zamok') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>zámok</span>
                      <button onClick={() => toggleColumnVisibility('zamok')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                    <div
                      className="absolute right-0 top-0 h-full w-4 translate-x-1/2 cursor-col-resize hover:bg-white/50 z-10"
                      onMouseDown={(e) => startResizing('zamok', e)}
                    />
                  </th>
                )}
                {isColumnVisible('sklo') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>sklo</span>
                      <button onClick={() => toggleColumnVisibility('sklo')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                    <div
                      className="absolute right-0 top-0 h-full w-4 translate-x-1/2 cursor-col-resize hover:bg-white/50 z-10"
                      onMouseDown={(e) => startResizing('sklo', e)}
                    />
                  </th>
                )}
                {isColumnVisible('povrch') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>povrch</span>
                      <button onClick={() => toggleColumnVisibility('povrch')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                    <div
                      className="absolute right-0 top-0 h-full w-4 translate-x-1/2 cursor-col-resize hover:bg-white/50 z-10"
                      onMouseDown={(e) => startResizing('povrch', e)}
                    />
                  </th>
                )}
                {isColumnVisible('poznamka') && (
                  <th className="relative px-2 py-2 text-left border-r border-white/20 select-none group">
                    <div className="flex justify-between items-center">
                      <span>poznámka</span>
                      <button onClick={() => toggleColumnVisibility('poznamka')} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white p-0.5" title="Skryť stĺpec">×</button>
                    </div>
                  </th>
                )}
                <th className="relative px-2 py-2 text-right border-r border-white/20 select-none w-10">
                  ks
                </th>
                <th className="relative px-2 py-2 text-right border-r border-white/20 select-none w-14">
                  cena / ks
                </th>
                <th className="relative px-2 py-2 text-right border-r border-white/20 whitespace-nowrap select-none w-24 min-w-[100px]">
                  cena celkom
                </th>
                <th className="px-2 py-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {(data.vyrobky || []).map((item, index) => {
                const rows = [];
                // Determine row span based on visible parts
                let rowSpan = 0;
                if (item.hasDvere) rowSpan++;
                if (item.hasZarubna) rowSpan++;
                if (item.hasObklad) rowSpan++;
                if (item.hasPrazdne) rowSpan++;
                if (rowSpan === 0) rowSpan = 1; // Empty row

                // Helper to render shared cells (Miestnost)
                const renderMiestnostCell = (rowIndex: number) => {
                  if (rowIndex === 0) {
                    return (
                      <>
                        <td rowSpan={rowSpan} className={`px-2 py-1 text-center border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} font-medium`}>{index + 1}</td>
                        <td rowSpan={rowSpan} className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'} align-top`}>
                          <input
                            type="text"
                            value={item.miestnost}
                            placeholder="Izba"
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].miestnost = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none focus:bg-gray-100`}
                          />
                          {/* Add controls to add sub-items to this room */}
                          <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center flex-wrap">
                            {!item.hasDvere && <button onClick={() => toggleItemPart(index, 'hasDvere')} title="Pridať Dvere" className={`text-[10px] px-1 rounded ${isDark ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Dvere</button>}
                            {!item.hasZarubna && <button onClick={() => toggleItemPart(index, 'hasZarubna')} title="Pridať Zárubňu" className={`text-[10px] px-1 rounded ${isDark ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Zárubňa</button>}
                            {!item.hasObklad && <button onClick={() => toggleItemPart(index, 'hasObklad')} title="Pridať Obklad" className={`text-[10px] px-1 rounded ${isDark ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Obklad</button>}
                            {!item.hasPrazdne && <button onClick={() => toggleItemPart(index, 'hasPrazdne')} title="Pridať Prázdne" className={`text-[10px] px-1 rounded ${isDark ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Prázdne</button>}
                          </div>
                        </td>
                      </>
                    );
                  }
                  return null;
                };

                const actionButtons = (
                  <td rowSpan={rowSpan} className={`px-1 py-1 text-center align-middle border-l ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <div className="flex flex-row items-center justify-center gap-0.5">
                      <button
                        onClick={() => {
                          const itemToDuplicate = data.vyrobky[index];
                          const newItem = { ...itemToDuplicate, id: Date.now() + Math.random(), miestnost: `${itemToDuplicate.miestnost} (kopia)` };
                          const newVyrobky = [...data.vyrobky];
                          newVyrobky.splice(index + 1, 0, newItem);
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} p-1`}
                        title="Kopírovať miestnosť"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          const newVyrobky = data.vyrobky.filter((_, i) => i !== index);
                          onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Odstrániť"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                );

                let currentRow = 0;

                // DVERE ROW
                if (item.hasDvere) {
                  rows.push(
                    <tr key={`${item.id}-dvere`} className={`group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')}`}>
                      {renderMiestnostCell(currentRow)}
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500 text-gray-400' : 'border-gray-200 text-gray-800'}`}>
                        <div className="flex justify-between items-center group/cell">
                          <input
                            type="text"
                            value={item.polozkaDvere ?? 'Dvere'}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].polozkaDvere = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`flex-1 px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <button onClick={() => toggleItemPart(index, 'hasDvere')} className="text-red-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100" title="Odstrániť Dvere">×</button>
                        </div>
                      </td>
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="text"
                          value={item.dvereTypRozmer}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].dvereTypRozmer = e.target.value;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      {isColumnVisible('pl') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.pL}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].pL = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('zamok') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.zamok}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].zamok = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('sklo') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.sklo}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].sklo = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('povrch') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.povrch}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].povrch = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('poznamka') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.poznamkaDvere}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].poznamkaDvere = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="number"
                          value={item.ks}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].ks = parseInt(e.target.value) || 0;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            value={item.cenaDvere}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].cenaDvere = parseFloat(e.target.value) || 0;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
                        </div>
                      </td>
                      <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {((item.ks || 0) * (item.cenaDvere || 0)).toFixed(2)} €
                      </td>
                      {currentRow === 0 && actionButtons}
                    </tr>
                  );
                  currentRow++;
                }

                // ZARUBNA ROW
                if (item.hasZarubna) {
                  const visibleMiddleCols = (isColumnVisible('pl') ? 1 : 0) + (isColumnVisible('zamok') ? 1 : 0) + (isColumnVisible('sklo') ? 1 : 0);
                  rows.push(
                    <tr key={`${item.id}-zarubna`} className={`group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')}`}>
                      {renderMiestnostCell(currentRow)}
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500 text-gray-400' : 'border-gray-200 text-gray-800'}`}>
                        <div className="flex justify-between items-center group/cell">
                          <input
                            type="text"
                            value={item.polozkaZarubna ?? 'Zárubňa'}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].polozkaZarubna = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`flex-1 px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <button onClick={() => toggleItemPart(index, 'hasZarubna')} className="text-red-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100" title="Odstrániť Zárubňu">×</button>
                        </div>
                      </td>
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="text"
                          value={item.dvereOtvor}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].dvereOtvor = e.target.value;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          placeholder="otvor"
                          className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      {visibleMiddleCols > 0 && <td colSpan={visibleMiddleCols} className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}></td>}
                      {isColumnVisible('povrch') && (
                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.povrchZarubna || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].povrchZarubna = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            placeholder="povrch"
                            className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('poznamka') && (
                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.poznamkaZarubna}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].poznamkaZarubna = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="number"
                          value={item.ksZarubna}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].ksZarubna = parseInt(e.target.value) || 0;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            value={item.cenaZarubna}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].cenaZarubna = parseFloat(e.target.value) || 0;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
                        </div>
                      </td>
                      <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {((item.ksZarubna || 0) * (item.cenaZarubna || 0)).toFixed(2)} €
                      </td>
                      {currentRow === 0 && actionButtons}
                    </tr>
                  );
                  currentRow++;
                }

                // OBKLAD ROW
                if (item.hasObklad) {
                  const visibleMiddleCols = (isColumnVisible('pl') ? 1 : 0) + (isColumnVisible('zamok') ? 1 : 0) + (isColumnVisible('sklo') ? 1 : 0);
                  rows.push(
                    <tr key={`${item.id}-obklad`} className={`group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')}`}>
                      {renderMiestnostCell(currentRow)}
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500 text-gray-400' : 'border-gray-200 text-gray-800'}`}>
                        <div className="flex justify-between items-center group/cell">
                          <input
                            type="text"
                            value={item.polozkaObklad ?? 'Obklad'}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].polozkaObklad = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`flex-1 px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <button onClick={() => toggleItemPart(index, 'hasObklad')} className="text-red-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100" title="Odstrániť Obklad">×</button>
                        </div>
                      </td>
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="text"
                          value={item.typObklad || ''}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].typObklad = e.target.value;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          placeholder="typ/rozmer"
                          className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      {visibleMiddleCols > 0 && <td colSpan={visibleMiddleCols} className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}></td>}
                      {isColumnVisible('povrch') && (
                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.povrchObklad || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].povrchObklad = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            placeholder="povrch"
                            className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('poznamka') && (
                        <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.poznamkaObklad || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].poznamkaObklad = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="number"
                          value={item.ksObklad}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].ksObklad = parseInt(e.target.value) || 0;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            value={item.cenaObklad}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].cenaObklad = parseFloat(e.target.value) || 0;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
                        </div>
                      </td>
                      <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {((item.ksObklad || 0) * (item.cenaObklad || 0)).toFixed(2)} €
                      </td>
                      {currentRow === 0 && actionButtons}
                    </tr>
                  );
                  currentRow++;
                }

                // PRÁZDNE ROW
                if (item.hasPrazdne) {
                  rows.push(
                    <tr key={`${item.id}-prazdne`} className={`group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')}`}>
                      {renderMiestnostCell(currentRow)}
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500 text-gray-400' : 'border-gray-200 text-gray-800'}`}>
                        <div className="flex justify-between items-center group/cell">
                          <input
                            type="text"
                            value={item.polozkaPrazdne ?? 'Prázdne'}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].polozkaPrazdne = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`flex-1 px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <button onClick={() => toggleItemPart(index, 'hasPrazdne')} className="text-red-400 hover:text-red-600 opacity-0 group-hover/cell:opacity-100" title="Odstrániť Prázdne">×</button>
                        </div>
                      </td>
                      <td className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="text"
                          value={item.typPrazdne || ''}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].typPrazdne = e.target.value;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          placeholder="typ/rozmer"
                          className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      {isColumnVisible('pl') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.pLPrazdne || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].pLPrazdne = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('zamok') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.zamokPrazdne || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].zamokPrazdne = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('sklo') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.skloPrazdne || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].skloPrazdne = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('povrch') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.povrchPrazdne || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].povrchPrazdne = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      {isColumnVisible('poznamka') && (
                        <td className={`px-2 py-1 text-left border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                          <input
                            type="text"
                            value={item.poznamkaPrazdne || ''}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].poznamkaPrazdne = e.target.value;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-full px-1 py-0.5 text-xs text-left ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                        </td>
                      )}
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="number"
                          value={item.ksPrazdne || 0}
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].ksPrazdne = parseInt(e.target.value) || 0;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          className={`w-full px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                        />
                      </td>
                      <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-end">
                          <input
                            type="number"
                            value={item.cenaPrazdne || 0}
                            onChange={(e) => {
                              const newVyrobky = [...data.vyrobky];
                              newVyrobky[index].cenaPrazdne = parseFloat(e.target.value) || 0;
                              onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                            }}
                            className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                          />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-800'}> €</span>
                        </div>
                      </td>
                      <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {((item.ksPrazdne || 0) * (item.cenaPrazdne || 0)).toFixed(2)} €
                      </td>
                      {currentRow === 0 && actionButtons}
                    </tr>
                  );
                  currentRow++;
                }

                // EMPTY ROW (if nothing selected)
                if (rowSpan === 1 && !item.hasDvere && !item.hasZarubna && !item.hasObklad && !item.hasPrazdne) {
                  const visibleOptionalCount = (isColumnVisible('pl') ? 1 : 0) +
                    (isColumnVisible('zamok') ? 1 : 0) +
                    (isColumnVisible('sklo') ? 1 : 0) +
                    (isColumnVisible('povrch') ? 1 : 0) +
                    (isColumnVisible('poznamka') ? 1 : 0);
                  const emptyRowColSpan = 5 + visibleOptionalCount;

                  rows.push(
                    <tr key={`${item.id}-empty`} className={`group ${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')}`}>
                      {renderMiestnostCell(0)}
                      <td colSpan={emptyRowColSpan} className={`px-2 py-1 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                        <input
                          type="text"
                          value={item.poznamkaDvere || ''} // Reusing poznamkaDvere as generic text container for empty row
                          onChange={(e) => {
                            const newVyrobky = [...data.vyrobky];
                            newVyrobky[index].poznamkaDvere = e.target.value;
                            onChangeWithPaymentReset({ ...data, vyrobky: newVyrobky });
                          }}
                          placeholder="Vlastný text..."
                          className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none italic`}
                        />
                      </td>
                      {actionButtons}
                    </tr>
                  );
                }

                return rows;
              })}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
                <td colSpan={6 + (isColumnVisible('pl') ? 1 : 0) + (isColumnVisible('zamok') ? 1 : 0) + (isColumnVisible('sklo') ? 1 : 0) + (isColumnVisible('povrch') ? 1 : 0) + (isColumnVisible('poznamka') ? 1 : 0)} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {totals.vyrobkyTotal.toFixed(2)} €
                </td>
                <td className={isDark ? 'bg-dark-600' : 'bg-gray-100'}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Add Room Button */}
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
          <button
            onClick={handleAddRoom}
            className={`p-1 rounded-full ${isDark ? 'bg-dark-800 hover:bg-dark-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať miestnosť"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <GenericItemsTable
        title="Príplatky:"
        items={data.priplatky || []}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => onChangeWithPaymentReset({ ...data, priplatky: items })}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          onChangeWithPaymentReset({ ...data, priplatky: [...(data.priplatky || []), newItem] });
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.priplatkyTotal.toFixed(2)} €
            </td>
          </tr>
        }
        extraButtons={
          (data.vyrobky || []).length > 0 && (
            <button
              onClick={handleOpenPriplatokModal}
              className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} transition-colors shadow-sm`}
              title="Vypočítať príplatok z výrobkov"
            >
              % z výrobkov
            </button>
          )
        }
      />

      <QuoteSummary
        isDark={isDark}
        totals={totals}
        zlavaPercent={data.zlavaPercent}
        zlavaEur={data.zlavaEur || 0}
        useZlavaPercent={data.useZlavaPercent !== false}
        useZlavaEur={data.useZlavaEur || false}
        onZlavaChange={(val) => onChangeWithPaymentRecalc({ ...data, zlavaPercent: val })}
        onZlavaEurChange={(val) => onChangeWithPaymentRecalc({ ...data, zlavaEur: val })}
        onUseZlavaPercentChange={(val) => onChangeWithPaymentRecalc({ ...data, useZlavaPercent: val })}
        onUseZlavaEurChange={(val) => onChangeWithPaymentRecalc({ ...data, useZlavaEur: val })}
      />

      <GenericItemsTable
        title="Kovanie:"
        items={data.kovanie || []}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => {
          const sorted = sortPinnedItems(items, ['kľučky - doplniť', 'kľučka - doplniť', 'kovanie - doplniť', 'klucky - doplnit', 'klucka - doplnit', 'kovanie - doplnit']);
          onChangeWithPaymentReset({ ...data, kovanie: sorted });
        }}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          const newKovanie = sortPinnedItems([...(data.kovanie || []), newItem], ['kľučky - doplniť', 'kľučka - doplniť', 'kovanie - doplniť', 'klucky - doplnit', 'klucka - doplnit', 'kovanie - doplnit']);
          onChangeWithPaymentReset({ ...data, kovanie: newKovanie });
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.kovanieTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />

      <GenericItemsTable
        title={data.montazLabel || "Montáž - Neumožnená kompletná montáž z dôvodu nepripravenosti stavby bude spoplatnená dopravou."}
        onTitleChange={(newTitle) => onChange({ ...data, montazLabel: newTitle })}
        items={data.montaz || []}
        columns={commonColumns}
        isDark={isDark}
        onChange={(items) => {
          const sorted = sortPinnedItems(items, ['montáž kľučky', 'montáž kľučiek', 'montaz kluciek', 'montaz klucky', 'vynášanie – doceniť po obhliadke', 'vynášanie - doceniť po obhliadke']);
          onChangeWithPaymentReset({ ...data, montaz: sorted });
        }}
        onAddItem={() => {
          const newItem = { id: Date.now(), nazov: '', ks: 0, cenaKs: 0, cenaCelkom: 0 };
          const newMontaz = [...(data.montaz || [])];

          // Ensure predefined item exists
          const predefinedText = "vynášanie – doceniť po obhliadke";
          const hasPredefined = newMontaz.some(item => item.nazov === predefinedText);

          if (!hasPredefined) {
            newMontaz.push({
              id: Date.now() + 1,
              nazov: predefinedText,
              ks: 1,
              cenaKs: 0,
              cenaCelkom: 0
            });
          }

          const sorted = sortPinnedItems([...newMontaz, newItem], ['montáž kľučky', 'montáž kľučiek', 'montaz kluciek', 'montaz klucky', 'vynášanie – doceniť po obhliadke', 'vynášanie - doceniť po obhliadke']);
          onChangeWithPaymentReset({ ...data, montaz: sorted });
        }}
        mergeFirstTwoHeaders={true}
        footerContent={
          <tr className={isDark ? 'bg-dark-600' : 'bg-gray-100'}>
            <td colSpan={3} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Spolu bez DPH:
            </td>
            <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {totals.montazTotal.toFixed(2)} €
            </td>
          </tr>
        }
      />

      {/* Príplatok from výrobky modal */}
      {showPriplatokModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className={`rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto ${isDark ? 'bg-dark-800' : 'bg-white'}`}
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Príplatok z výrobkov
            </h3>

            {/* Príplatok name input */}
            <div className="mb-4">
              <label className={`block text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Názov príplatku:</label>
              <input
                type="text"
                value={priplatokNazov}
                onChange={(e) => setPriplatokNazov(e.target.value)}
                className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-dark-700 text-white border-dark-500' : 'bg-white text-gray-800 border-gray-300'}`}
              />
            </div>

            {/* Percentage input */}
            <div className="mb-4">
              <label className={`block text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Percento z vybraných výrobkov:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priplatokPercent}
                  onChange={(e) => setPriplatokPercent(parseFloat(e.target.value) || 0)}
                  className={`w-24 px-3 py-2 rounded border text-right ${isDark ? 'bg-dark-700 text-white border-dark-500' : 'bg-white text-gray-800 border-gray-300'}`}
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>%</span>
              </div>
            </div>

            {/* Items selection */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Vyberte položky:</label>
                <button
                  onClick={toggleSelectAll}
                  className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-gray-300 hover:bg-dark-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {selectedItems.length === getAllItems().length ? 'Zrušiť všetky' : 'Vybrať všetky'}
                </button>
              </div>
              <div className={`border rounded max-h-64 overflow-y-auto ${isDark ? 'border-dark-500' : 'border-gray-300'}`}>
                {getAllItems().map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer ${selectedItems.includes(item.id)
                      ? (isDark ? 'bg-blue-900/50' : 'bg-blue-100')
                      : (isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50')
                      } ${index > 0 ? `border-t ${isDark ? 'border-dark-500' : 'border-gray-200'}` : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => { }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {item.label}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.price.toFixed(2)} €
                    </span>
                  </div>
                ))}
                {getAllItems().length === 0 && (
                  <div className={`px-3 py-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Žiadne položky s cenou
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className={`mb-6 p-3 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between text-sm mb-1">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Suma vybraných položiek:</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {calculateSelectedItemsTotal().toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Príplatok ({priplatokPercent}%):</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {(calculateSelectedItemsTotal() * (priplatokPercent / 100)).toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPriplatokModal(false)}
                className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Zrušiť
              </button>
              <button
                onClick={handleAddPriplatokFromVyrobky}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                disabled={selectedItems.length === 0}
              >
                Pridať príplatok
              </button>
            </div>
          </div>
        </div>
      )}
      <GalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onSelect={handleGallerySelect}
        isDark={isDark}
      />
    </QuoteLayout>
  );
};