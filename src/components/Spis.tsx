import React, { useState, useEffect } from 'react';
import { useContacts } from '../contexts/ContactsContext';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SortableTable, Column } from './common/SortableTable';
import { SpisEntryModal } from '../features/Spis/components/SpisEntryModal';
import { SpisEntry } from '../features/Spis/types';

const Spis = () => {
  const { addContact } = useContacts();
  const location = useLocation();
  const { isDark } = useTheme();
  const { user } = useAuth();

  // --- Data State ---
  // Helper to load and migrate data
  const loadEntries = (key: string): SpisEntry[] => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 1. Hard Delete: Filter out corrupted/dummy items containing '0367'
        const cleaned = parsed.filter((item: any) => !item.cisloCP?.includes('0367'));
        
        // 2. Migration: Ensure EVERY entry has a unique ID
        const migrated = cleaned.map((item: any) => ({
           ...item,
           id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }));
        return migrated;
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
    return [];
  };

  // --- Data State ---
  const [entries, setEntries] = useState<SpisEntry[]>(() => {
    const storageKey = user ? `spisEntries_${user.id}` : 'spisEntries';
    return loadEntries(storageKey);
  });

  const [firmaOptions, setFirmaOptions] = useState<string[]>(() => {
    try {
      const storageKey = user ? `firmaOptions_${user.id}` : 'firmaOptions';
      const saved = localStorage.getItem(storageKey);
      let options = saved ? JSON.parse(saved) : ['R1 Bratislava', 'WENS DOOR Prievidza'];
      if (options.includes('Slavo Zdenko')) {
        options = options.filter((o: string) => o !== 'Slavo Zdenko');
        if (!options.includes('R1 Bratislava')) options.push('R1 Bratislava');
        if (!options.includes('WENS DOOR Prievidza')) options.push('WENS DOOR Prievidza');
      }
      return options;
    } catch (error) {
      console.error('Failed to parse firmaOptions from localStorage:', error);
      return ['R1 Bratislava', 'WENS DOOR Prievidza'];
    }
  });

  // --- UI State ---
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<SpisEntry | null>(null);
  const [highlightedProjectIds, setHighlightedProjectIds] = useState<string[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null);

  // --- Effects ---

  // Reload data when user changes
  useEffect(() => {
    if (user) {
      try {
        const storageKey = `spisEntries_${user.id}`;
        setEntries(loadEntries(storageKey));

        const firmaKey = `firmaOptions_${user.id}`;
        const firmaSaved = localStorage.getItem(firmaKey);
        let loadedFirma = firmaSaved ? JSON.parse(firmaSaved) : ['R1 Bratislava', 'WENS DOOR Prievidza'];
        if (loadedFirma.includes('Slavo Zdenko')) {
          loadedFirma = loadedFirma.filter((o: string) => o !== 'Slavo Zdenko');
          if (!loadedFirma.includes('R1 Bratislava')) loadedFirma.push('R1 Bratislava');
          if (!loadedFirma.includes('WENS DOOR Prievidza')) loadedFirma.push('WENS DOOR Prievidza');
        }
        setFirmaOptions(loadedFirma);
      } catch (error) {
        console.error('Failed to reload user data:', error);
      }
    }
  }, [user]);

  // Auto-save entries to localStorage
  useEffect(() => {
    try {
      // Don't save empty array if we haven't loaded yet? 
      // No, entries initial state is loaded from storage.
      // But we must ensure we don't save BEFORE loading completes if it was async (it's sync here).
      const storageKey = user ? `spisEntries_${user.id}` : 'spisEntries';
      
      // Prevent saving empty list if we just started and haven't potentially loaded?
      // loadEntries is synchronous so initial state is correct.
      // However, let's log to be sure.
      // console.log('Saving entries:', entries.length);
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save spisEntries:', error);
      if (error instanceof DOMException && error.code === 22) {
        alert('Nedostatok miesta v úložisku. Záznam nemožno uložiť.');
      }
    }
  }, [entries, user]);

  // Handle highlighting rows when navigating from Kontakty page
  useEffect(() => {
    if (location.state?.highlightProjectIds) {
      const projectIds = location.state.highlightProjectIds as string[];
      setHighlightedProjectIds(projectIds);
      
      // Clear highlights after 5 seconds
      const timer = setTimeout(() => {
        setHighlightedProjectIds([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Check for selected order from navigation
  useEffect(() => {
    try {
      const selectedOrder = localStorage.getItem('selectedOrder');
      if (selectedOrder) {
        const orderData = JSON.parse(selectedOrder);
        // Find the parent Spis entry
        const parentEntry = entries.find(entry => entry.cisloCP === orderData.parentSpisId);
        if (parentEntry) {
          // We just want to highlight the row in Spis table, NOT open the modal/tab
          // Set highlighted IDs which SortableTable uses
          setHighlightedProjectIds([parentEntry.cisloCP]);
          
          // Clear the selection after highlight duration
          setTimeout(() => {
            setHighlightedProjectIds([]);
            localStorage.removeItem('selectedOrder');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Failed to process selected order:', error);
      localStorage.removeItem('selectedOrder');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]); // Depend on entries so we run when they load

  // --- Handlers ---

  const handleRowClick = (item: SpisEntry, index: number) => {
    setSelectedEntry(item);
    setEditingIndex(index);
    setSelectedOrderIndex(null); // Reset highlighted order when opening manually
    setShowModal(true);
  };

  const handleSaveEntry = (entryData: SpisEntry) => {
    // If we have an ID, look for existing entry to update
    if (entryData.id) {
      setEntries(prev => {
        const index = prev.findIndex(e => e.id === entryData.id);
        if (index !== -1) {
          // Update existing
          const updated = [...prev];
          updated[index] = entryData;
          return updated;
        } else {
          // Add new (ID provided but not found)
          return [...prev, entryData];
        }
      });
    } else {
      // Fallback for legacy entries without ID or if somehow ID is missing
      if (editingIndex !== null) {
        setEntries(prev => {
          const updated = [...prev];
          updated[editingIndex] = entryData;
          return updated;
        });
      } else {
        setEntries(prev => [...prev, entryData]);
      }
    }
    
    // We don't rely on editingIndex for identification anymore, but we update it if we can find the new index
    // Note: Since setEntries is async, we can't get the new index immediately here easily for 'new' items
    // But since the Modal now manages its own identity via internalId, we don't strictly need to update editingIndex 
    // for the *Modal's* sake during the session.
    setSelectedEntry(entryData);
  };

  const handleDeleteEntry = (id: string | null) => {
    if (id) {
      setEntries(prev => prev.filter(item => item.id !== id));
    }
    setShowModal(false);
    setEditingIndex(null);
    setSelectedEntry(null);
  };

  // --- Table Configuration ---

  const columns: Column<SpisEntry>[] = [
    { 
      key: 'stav', 
      label: 'Stav', 
      render: (val, item) => (
        <span className={`px-2 py-1 rounded ${
          item.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          item.color === 'red' ? 'bg-red-100 text-red-800' : ''
        }`}>
          {val}
        </span>
      ) 
    },
    { 
      key: 'cisloCP', 
      label: 'Číslo CP', 
      render: (val) => <span className="font-medium text-[#e11b28]">{val}</span> 
    },
    { key: 'cisloZakazky', label: 'Číslo zákazky' },
    { key: 'datum', label: 'Dátum' },
    { key: 'kontaktnaOsoba', label: 'Konečný zákazník' },
    { key: 'architekt', label: 'Architekt' },
    { key: 'realizator', label: 'Realizátor' },
    { 
      key: 'popis', 
      label: 'Popis', 
      render: (val) => <div className="max-w-xs truncate" title={val}>{val}</div> 
    },
    { key: 'firma', label: 'Firma' },
    { key: 'spracovatel', label: 'Vypracoval' },
    { key: 'kategoria', label: 'Kategória' },
    { key: 'terminDodania', label: 'Termín dokončenia' }
  ];

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Spis</h1>
        <button
          onClick={() => {
            setSelectedEntry(null);
            setEditingIndex(null);
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Pridať
        </button>
      </div>

      {/* Table */}
      <SortableTable
        columns={columns}
        data={[...entries].reverse()}
        onRowClick={handleRowClick}
        highlightedIds={highlightedProjectIds}
        highlightKey="cisloCP"
      />

      {/* Modal */}
      {showModal && (
        <SpisEntryModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingIndex(null);
            setSelectedEntry(null);
          }}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
          initialEntry={selectedEntry}
          editingIndex={editingIndex}
          user={user}
          firmaOptions={firmaOptions}
          setFirmaOptions={setFirmaOptions}
          entries={entries}
          addContact={addContact}
          selectedOrderIndex={selectedOrderIndex}
        />
      )}
    </div>
  );
};

export default Spis;
