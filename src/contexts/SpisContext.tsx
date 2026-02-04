import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase, DbSpisEntry } from '../lib/supabase';
import { SpisEntry } from '../features/Spis/types';

// Pagination configuration
const PAGE_SIZE = 50;

interface SpisContextType {
  entries: SpisEntry[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  firmaOptions: string[];
  addEntry: (entry: SpisEntry) => Promise<SpisEntry>;
  updateEntry: (entry: SpisEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryById: (id: string) => SpisEntry | undefined;
  addFirmaOption: (option: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
  loadMoreEntries: () => Promise<void>;
  standaloneOrders: any[];
  refreshStandaloneOrders: () => Promise<void>;
}

const SpisContext = createContext<SpisContextType | undefined>(undefined);

// Helper to convert DB format to app format
const dbToSpisEntry = (db: DbSpisEntry): SpisEntry => {
  const fullFormData = db.full_form_data || {};
  const konecnyZakaznik = `${fullFormData.meno || ''} ${fullFormData.priezvisko || ''}`.trim();

  return {
    id: db.id,
    stav: db.stav || 'CP',
    cisloCP: db.cislo_cp,
    cisloZakazky: db.cislo_zakazky || '',
    datum: db.datum || '',
    kontaktnaOsoba: db.kontaktna_osoba || '',
    konecnyZakaznik: konecnyZakaznik,
    architekt: db.architekt || '',
    realizator: db.realizator || '',
    popis: db.popis || '',
    firma: db.firma || '',
    spracovatel: db.spracovatel || '',
    kategoria: db.kategoria || '',
    terminDodania: db.termin_dodania || '',
    color: db.color || 'white',
    isLocked: db.is_locked || false,
    fullFormData: db.full_form_data || undefined,
  };
};

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
  is_locked: entry.isLocked || false,
  full_form_data: entry.fullFormData || {},
});

export const SpisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SpisEntry[]>([]);
  const [standaloneOrders, setStandaloneOrders] = useState<any[]>([]);
  const [firmaOptions, setFirmaOptions] = useState<string[]>(['R1 Bratislava', 'WENS DOOR Prievidza']);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const currentPage = useRef(0);

  // Load initial entries from Supabase with pagination
  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      currentPage.current = 0;

      // Get total count first
      const { count, error: countError } = await supabase
        .from('spis_entries')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting count:', countError);
      } else {
        setTotalCount(count || 0);
      }

      // Load first page of spis entries (most recent first for display, but we reverse in UI)
      const { data: entriesData, error: entriesError } = await supabase
        .from('spis_entries')
        .select('*')
        .order('created_at', { ascending: true })
        .range(0, PAGE_SIZE - 1);

      if (entriesError) {
        console.error('Error loading entries:', entriesError);
        setEntries([]);
        setHasMore(false);
      } else {
        const loadedEntries = (entriesData || []).map(dbToSpisEntry);
        setEntries(loadedEntries);
        setHasMore(loadedEntries.length === PAGE_SIZE && loadedEntries.length < (count || 0));
        currentPage.current = 1;
      }

      // Load firma options (all options visible to all authenticated users)
      const { data: firmaData, error: firmaError } = await supabase
        .from('firma_options')
        .select('name');

      if (firmaError) {
        console.error('Error loading firma options:', firmaError);
      } else if (firmaData && firmaData.length > 0) {
        // Get unique firma names
        const uniqueFirmas = Array.from(new Set(firmaData.map((f: { name: string }) => f.name))) as string[];
        setFirmaOptions(uniqueFirmas);
      } else {
        // Insert default options
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

  const refreshStandaloneOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('standalone_orders')
        .select('*');

      if (error) throw error;
      setStandaloneOrders(data || []);
    } catch (error) {
      console.error('Error loading standalone orders:', error);
    }
  }, []);

  // Load standalone orders initially
  useEffect(() => {
    refreshStandaloneOrders();
  }, [refreshStandaloneOrders]);

  // Load more entries (pagination)
  const loadMoreEntries = useCallback(async () => {
    if (!user || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const offset = currentPage.current * PAGE_SIZE;

      const { data: entriesData, error: entriesError } = await supabase
        .from('spis_entries')
        .select('*')
        .order('created_at', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (entriesError) {
        console.error('Error loading more entries:', entriesError);
      } else {
        const newEntries = (entriesData || []).map(dbToSpisEntry);

        // Filter out any duplicates (in case of concurrent updates)
        const existingIds = new Set(entries.map(e => e.id));
        const uniqueNewEntries = newEntries.filter(e => !existingIds.has(e.id));

        setEntries(prev => [...prev, ...uniqueNewEntries]);
        setHasMore(newEntries.length === PAGE_SIZE);
        currentPage.current += 1;
      }
    } catch (error) {
      console.error('Failed to load more entries:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, isLoadingMore, hasMore, entries]);

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
        isLoadingMore,
        hasMore,
        totalCount,
        firmaOptions,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntryById,
        addFirmaOption,
        refreshEntries,
        loadMoreEntries,
        standaloneOrders,
        refreshStandaloneOrders
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
