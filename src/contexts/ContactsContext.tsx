import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, DbContact } from '../lib/supabase';

export interface Contact {
  id: string;
  meno: string;
  priezvisko: string;
  telefon: string;
  email: string;
  ulica: string;
  mesto: string;
  psc: string;
  ico: string;
  icDph: string;
  dic?: string;
  kontaktnaPriezvisko?: string;
  kontaktnaMeno?: string;
  kontaktnaTelefon?: string;
  kontaktnaEmail?: string;
  popis?: string;
  typ: 'zakaznik' | 'architekt' | 'fakturacna_firma';
  projectIds: string[];
  dateAdded: string;
  originalContactId?: string;
}

interface ContactsContextType {
  contacts: Contact[];
  isLoading: boolean;
  addContact: (contact: Omit<Contact, 'dateAdded' | 'id'> & { id?: string }) => Promise<Contact>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  getContactsByProject: (projectId: string) => Contact[];
  associateContactWithProject: (contactId: string, projectId: string) => Promise<void>;
  getContactByNameAndType: (priezvisko: string, meno: string, typ: 'zakaznik' | 'architekt' | 'fakturacna_firma') => Contact | undefined;
  forkContact: (originalId: string, newContactData: Omit<Contact, 'dateAdded' | 'id'>) => Promise<Contact>;
  refreshContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

// Helper to convert DB format to app format
const dbToContact = (db: DbContact): Contact => ({
  id: db.id,
  meno: db.meno || '',
  priezvisko: db.priezvisko || '',
  telefon: db.telefon || '',
  email: db.email || '',
  ulica: db.ulica || '',
  mesto: db.mesto || '',
  psc: db.psc || '',
  ico: db.ico || '',
  icDph: db.ic_dph || '',
  dic: db.dic || '',
  kontaktnaPriezvisko: db.kontaktna_priezvisko || '',
  kontaktnaMeno: db.kontaktna_meno || '',
  kontaktnaTelefon: db.kontaktna_telefon || '',
  kontaktnaEmail: db.kontaktna_email || '',
  popis: db.popis || '',
  typ: db.typ,
  projectIds: db.project_ids || [],
  dateAdded: db.date_added,
  originalContactId: db.original_contact_id || undefined,
});

// Helper to convert app format to DB format
const contactToDb = (contact: Partial<Contact>, userId: string): Partial<DbContact> => ({
  user_id: userId,
  meno: contact.meno || '',
  priezvisko: contact.priezvisko || '',
  telefon: contact.telefon || '',
  email: contact.email || '',
  ulica: contact.ulica || '',
  mesto: contact.mesto || '',
  psc: contact.psc || '',
  ico: contact.ico || '',
  ic_dph: contact.icDph || '',
  dic: contact.dic || '',
  kontaktna_priezvisko: contact.kontaktnaPriezvisko || '',
  kontaktna_meno: contact.kontaktnaMeno || '',
  kontaktna_telefon: contact.kontaktnaTelefon || '',
  kontaktna_email: contact.kontaktnaEmail || '',
  popis: contact.popis || '',
  typ: contact.typ,
  project_ids: contact.projectIds || [],
  original_contact_id: contact.originalContactId || null,
});

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load contacts from Supabase
  const loadContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Load all contacts (visible to all authenticated users)
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('date_added', { ascending: false });

      if (error) {
        console.error('Error loading contacts:', error);
        setContacts([]);
      } else {
        setContacts((data || []).map(dbToContact));
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Reload contacts when user changes
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const refreshContacts = useCallback(async () => {
    await loadContacts();
  }, [loadContacts]);

  const getContactByNameAndType = useCallback((priezvisko: string, meno: string, typ: 'zakaznik' | 'architekt' | 'fakturacna_firma') => {
    return contacts.find(c =>
      c.typ === typ &&
      (c.priezvisko || '').toLowerCase().trim() === (priezvisko || '').toLowerCase().trim() &&
      (c.meno || '').toLowerCase().trim() === (meno || '').toLowerCase().trim()
    );
  }, [contacts]);

  const addContact = useCallback(async (contactData: Omit<Contact, 'dateAdded' | 'id'> & { id?: string }): Promise<Contact> => {
    if (!user) throw new Error('User not authenticated');

    // If explicit ID provided, try to update existing
    if (contactData.id) {
      const existing = contacts.find(c => c.id === contactData.id);
      if (existing) {
        const mergedProjectIds = Array.from(new Set([...existing.projectIds, ...contactData.projectIds]));
        const updatedData = {
          ...contactData,
          projectIds: mergedProjectIds,
          originalContactId: existing.originalContactId || contactData.originalContactId
        };

        const { data, error } = await supabase
          .from('contacts')
          .update(contactToDb(updatedData, user.id))
          .eq('id', contactData.id)
          .select()
          .single();

        if (error) throw error;

        const updatedContact = dbToContact(data);
        setContacts(prev => prev.map(c => c.id === contactData.id ? updatedContact : c));
        return updatedContact;
      }
    }

    // Create new contact
    const dbData = contactToDb(contactData, user.id);
    const { data, error } = await supabase
      .from('contacts')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    const newContact = dbToContact(data);
    setContacts(prev => [newContact, ...prev]);
    return newContact;
  }, [user, contacts]);

  const forkContact = useCallback(async (originalId: string, newContactData: Omit<Contact, 'dateAdded' | 'id'>): Promise<Contact> => {
    if (!user) throw new Error('User not authenticated');

    const originalIndex = contacts.findIndex(c => c.id === originalId);

    if (originalIndex === -1) {
      return addContact(newContactData);
    }

    const originalContact = contacts[originalIndex];
    const projectIdsToMove = newContactData.projectIds;

    // Remove these projects from original
    const updatedOriginalProjectIds = originalContact.projectIds.filter(pid => !projectIdsToMove.includes(pid));

    // Update original contact in DB
    await supabase
      .from('contacts')
      .update({ project_ids: updatedOriginalProjectIds })
      .eq('id', originalId);

    // Create new contact with reference to original
    const dbData = {
      ...contactToDb({ ...newContactData, originalContactId: originalId }, user.id),
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    const newContact = dbToContact(data);

    // Update local state
    setContacts(prev => {
      const updated = [...prev];
      updated[originalIndex] = { ...originalContact, projectIds: updatedOriginalProjectIds };
      return [newContact, ...updated];
    });

    return newContact;
  }, [user, contacts, addContact]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    if (!user) throw new Error('User not authenticated');

    const dbUpdates = contactToDb(updates, user.id);
    // Remove user_id from updates as it shouldn't change
    delete (dbUpdates as any).user_id;

    const { error } = await supabase
      .from('contacts')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;

    setContacts(prev =>
      prev.map(contact =>
        contact.id === id ? { ...contact, ...updates } : contact
      )
    );
  }, [user]);

  const deleteContact = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setContacts(prev => prev.filter(contact => contact.id !== id));
  }, []);

  const getContactById = useCallback((id: string) => {
    return contacts.find(c => c.id === id);
  }, [contacts]);

  const getContactsByProject = useCallback((projectId: string) => {
    return contacts.filter(c => c.projectIds.includes(projectId));
  }, [contacts]);

  const associateContactWithProject = useCallback(async (contactId: string, projectId: string) => {
    const contact = getContactById(contactId);
    if (contact && !contact.projectIds.includes(projectId)) {
      await updateContact(contactId, {
        projectIds: [...contact.projectIds, projectId]
      });
    }
  }, [getContactById, updateContact]);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        isLoading,
        addContact,
        forkContact,
        updateContact,
        deleteContact,
        getContactById,
        getContactsByProject,
        associateContactWithProject,
        getContactByNameAndType,
        refreshContacts
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within ContactsProvider');
  }
  return context;
};
