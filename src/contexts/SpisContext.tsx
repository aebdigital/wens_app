import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, DbSpisEntry } from '../lib/supabase';
import { SpisEntry } from '../features/Spis/types';

interface SpisContextType {
  entries: SpisEntry[];
  isLoading: boolean;
  firmaOptions: string[];
  addEntry: (entry: SpisEntry) => Promise<SpisEntry>;
  updateEntry: (entry: SpisEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryById: (id: string) => SpisEntry | undefined;
  addFirmaOption: (option: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
}

const SpisContext = createContext<SpisContextType | undefined>(undefined);

// Helper to convert DB format to app format
const dbToSpisEntry = (db: DbSpisEntry): SpisEntry => ({
  id: db.id,
  stav: db.stav || 'CP',
  cisloCP: db.cislo_cp,
  cisloZakazky: db.cislo_zakazky || '',
  datum: db.datum || '',
  kontaktnaOsoba: db.kontaktna_osoba || '',
  architekt: db.architekt || '',
  realizator: db.realizator || '',
  popis: db.popis || '',
  firma: db.firma || '',
  spracovatel: db.spracovatel || '',
  kategoria: db.kategoria || '',
  terminDodania: db.termin_dodania || '',
  color: db.color || 'white',
  fullFormData: db.full_form_data || undefined,
});

// Helper to convert app format to DB format
const spisEntryToDb = (entry: SpisEntry, userId: string): Partial<DbSpisEntry> => ({
  user_id: userId,
  stav: entry.stav || 'CP',
  cislo_cp: entry.cisloCP,
  cislo_zakazky: entry.cisloZakazky || '',
  datum: entry.datum || '',
  kontaktna_osoba: entry.kontaktnaOsoba || '',
  architekt: entry.architekt || '',
  realizator: entry.realizator || '',
  popis: entry.popis || '',
  firma: entry.firma || '',
  spracovatel: entry.spracovatel || '',
  kategoria: entry.kategoria || '',
  termin_dodania: entry.terminDodania || '',
  color: entry.color || 'white',
  full_form_data: entry.fullFormData || {},
});

export const SpisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SpisEntry[]>([]);
  const [firmaOptions, setFirmaOptions] = useState<string[]>(['R1 Bratislava', 'WENS DOOR Prievidza']);
  const [isLoading, setIsLoading] = useState(true);

  // Load entries from Supabase
  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load spis entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('spis_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (entriesError) {
        console.error('Error loading entries:', entriesError);
        setEntries([]);
      } else {
        setEntries((entriesData || []).map(dbToSpisEntry));
      }

      // Load firma options
      const { data: firmaData, error: firmaError } = await supabase
        .from('firma_options')
        .select('name')
        .eq('user_id', user.id);

      if (firmaError) {
        console.error('Error loading firma options:', firmaError);
      } else if (firmaData && firmaData.length > 0) {
        setFirmaOptions(firmaData.map(f => f.name));
      } else {
        // Insert default options for new user
        const defaultOptions = ['R1 Bratislava', 'WENS DOOR Prievidza'];
        await supabase.from('firma_options').insert(
          defaultOptions.map(name => ({ user_id: user.id, name }))
        );
        setFirmaOptions(defaultOptions);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Reload entries when user changes
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const refreshEntries = useCallback(async () => {
    await loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (entry: SpisEntry): Promise<SpisEntry> => {
    if (!user) throw new Error('User not authenticated');

    // Check if entry already exists (update case)
    const existingIndex = entries.findIndex(e => e.id === entry.id);

    if (existingIndex !== -1) {
      // Update existing entry
      const dbData = spisEntryToDb(entry, user.id);
      delete (dbData as any).user_id; // Don't update user_id

      const { data, error } = await supabase
        .from('spis_entries')
        .update(dbData)
        .eq('id', entry.id)
        .select()
        .single();

      if (error) throw error;

      const updatedEntry = dbToSpisEntry(data);
      setEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e));
      return updatedEntry;
    } else {
      // Create new entry
      const dbData = spisEntryToDb(entry, user.id);

      const { data, error } = await supabase
        .from('spis_entries')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      const newEntry = dbToSpisEntry(data);
      setEntries(prev => [...prev, newEntry]);
      return newEntry;
    }
  }, [user, entries]);

  const updateEntry = useCallback(async (entry: SpisEntry) => {
    if (!user) throw new Error('User not authenticated');

    const dbData = spisEntryToDb(entry, user.id);
    delete (dbData as any).user_id;

    const { error } = await supabase
      .from('spis_entries')
      .update(dbData)
      .eq('id', entry.id);

    if (error) throw error;

    setEntries(prev =>
      prev.map(e => e.id === entry.id ? entry : e)
    );
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('spis_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const getEntryById = useCallback((id: string) => {
    return entries.find(e => e.id === id);
  }, [entries]);

  const addFirmaOption = useCallback(async (option: string) => {
    if (!user) throw new Error('User not authenticated');
    if (firmaOptions.includes(option)) return;

    const { error } = await supabase
      .from('firma_options')
      .insert({ user_id: user.id, name: option });

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      throw error;
    }

    setFirmaOptions(prev => [...prev, option]);
  }, [user, firmaOptions]);

  return (
    <SpisContext.Provider
      value={{
        entries,
        isLoading,
        firmaOptions,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntryById,
        addFirmaOption,
        refreshEntries
      }}
    >
      {children}
    </SpisContext.Provider>
  );
};

export const useSpis = () => {
  const context = useContext(SpisContext);
  if (!context) {
    throw new Error('useSpis must be used within SpisProvider');
  }
  return context;
};
