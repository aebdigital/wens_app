import React, { useState, useEffect, useCallback } from 'react';
import { useContacts } from '../contexts/ContactsContext';
import { useSpis } from '../contexts/SpisContext';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SortableTable, Column } from './common/SortableTable';
import { SpisEntryModal } from '../features/Spis/components/SpisEntryModal';
import { SpisEntry } from '../features/Spis/types';

const Spis = () => {
  const { addContact } = useContacts();
  const { entries, isLoading, firmaOptions, addEntry, deleteEntry, addFirmaOption } = useSpis();
  const location = useLocation();
  const { isDark } = useTheme();
  const { user } = useAuth();

  // --- UI State ---
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<SpisEntry | null>(null);
  const [highlightedProjectIds, setHighlightedProjectIds] = useState<string[]>([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number | null>(null);

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

  // --- Handlers ---

  const handleRowClick = (item: SpisEntry, index: number) => {
    setSelectedEntry(item);
    setEditingIndex(index);
    setSelectedOrderIndex(null);
    setShowModal(true);
  };

  const handleSaveEntry = useCallback(async (entryData: SpisEntry) => {
    try {
      const savedEntry = await addEntry(entryData);
      setSelectedEntry(savedEntry);
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Chyba pri ukladaní záznamu. Skúste to znova.');
    }
  }, [addEntry]);

  const handleDeleteEntry = useCallback(async (id: string | null) => {
    if (id) {
      try {
        await deleteEntry(id);
      } catch (error) {
        console.error('Failed to delete entry:', error);
        alert('Chyba pri mazaní záznamu. Skúste to znova.');
      }
    }
    setShowModal(false);
    setEditingIndex(null);
    setSelectedEntry(null);
  }, [deleteEntry]);

  const handleSetFirmaOptions = useCallback(async (options: string[]) => {
    // Find new options that don't exist yet
    for (const option of options) {
      if (!firmaOptions.includes(option)) {
        try {
          await addFirmaOption(option);
        } catch (error) {
          console.error('Failed to add firma option:', error);
        }
      }
    }
  }, [firmaOptions, addFirmaOption]);

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
    { key: 'datum', label: 'Dátum', isDate: true },
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
    { key: 'terminDodania', label: 'Termín dokončenia', isDate: true }
  ];

  if (isLoading) {
    return (
      <div className={`min-h-full p-4 flex items-center justify-center ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28]"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
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
        rowClassName={(item) => item.cisloZakazky ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : ''}
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
          setFirmaOptions={handleSetFirmaOptions}
          entries={entries}
          addContact={addContact}
          selectedOrderIndex={selectedOrderIndex}
        />
      )}
    </div>
  );
};

export default Spis;
