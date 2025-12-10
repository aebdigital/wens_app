import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
  projectIds: string[]; // Array of project IDs this contact is associated with
  dateAdded: string;
  originalContactId?: string; // New field to track original if forked
}

interface ContactsContextType {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'dateAdded' | 'id'> & { id?: string }) => Contact;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContactById: (id: string) => Contact | undefined;
  getContactsByProject: (projectId: string) => Contact[];
  associateContactWithProject: (contactId: string, projectId: string) => void;
  // New method to get contact by name and type, to be used by useSpisEntryLogic for initial lookup
  getContactByNameAndType: (priezvisko: string, meno: string, typ: 'zakaznik' | 'architekt' | 'fakturacna_firma') => Contact | undefined;
  forkContact: (originalId: string, newContactData: Omit<Contact, 'dateAdded' | 'id'>) => Contact;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const storageKey = user ? `contacts_${user.id}` : 'contacts';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse contacts from localStorage:', error);
      return [];
    }
  });

  // Reload contacts when user changes
  useEffect(() => {
    try {
      const storageKey = user ? `contacts_${user.id}` : 'contacts';
      const saved = localStorage.getItem(storageKey);
      setContacts(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error('Failed to load contacts for user:', error);
      setContacts([]);
    }
  }, [user]);

  useEffect(() => {
    try {
      const storageKey = user ? `contacts_${user.id}` : 'contacts';
      localStorage.setItem(storageKey, JSON.stringify(contacts));
    } catch (error) {
      console.error('Failed to save contacts to localStorage:', error);
      if (error instanceof DOMException && error.code === 22) {
        alert('Nedostatok miesta v úložisku. Kontakty nemožno uložiť. Vymažte prosím staré dáta.');
      }
    }
  }, [contacts, user]);

  const getContactByNameAndType = (priezvisko: string, meno: string, typ: 'zakaznik' | 'architekt' | 'fakturacna_firma') => {
    return contacts.find(c =>
      c.typ === typ &&
      (c.priezvisko || '').toLowerCase().trim() === (priezvisko || '').toLowerCase().trim() &&
      (c.meno || '').toLowerCase().trim() === (meno || '').toLowerCase().trim()
    );
  };

  const addContact = (contactData: Omit<Contact, 'dateAdded' | 'id'> & { id?: string }): Contact => {
    let nextContacts = [...contacts];
    let resultContact: Contact | undefined;

    // 1. If explicit ID provided, try to update existing
    if (contactData.id) {
        const existing = nextContacts.find(c => c.id === contactData.id);
        if (existing) {
            const mergedProjectIds = Array.from(new Set([...existing.projectIds, ...contactData.projectIds]));
            const updatedContact = {
                ...existing, // Keep existing fields unless explicitly overridden
                ...contactData,
                projectIds: mergedProjectIds,
                // Ensure originalContactId is preserved if it exists
                originalContactId: existing.originalContactId || contactData.originalContactId
            };
            const idx = nextContacts.findIndex(c => c.id === contactData.id);
            nextContacts[idx] = updatedContact;
            resultContact = updatedContact;
        }
    }

    // 2. If no ID or not found, always create a new contact
    if (!resultContact) {
        const newContact: Contact = {
            ...contactData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            dateAdded: new Date().toISOString(),
            originalContactId: contactData.originalContactId // Preserve if passed
        };
        nextContacts.push(newContact);
        resultContact = newContact;
    }

    setContacts(nextContacts);
    return resultContact!;
  };

  const forkContact = (originalId: string, newContactData: Omit<Contact, 'dateAdded' | 'id'>): Contact => {
    const nextContacts = [...contacts];
    const originalIndex = nextContacts.findIndex(c => c.id === originalId);
    
    if (originalIndex === -1) {
        return addContact(newContactData);
    }
    
    const originalContact = nextContacts[originalIndex];
    const projectIdsToMove = newContactData.projectIds;
    
    // Remove these projects from original
    const updatedOriginal = {
        ...originalContact,
        projectIds: originalContact.projectIds.filter(pid => !projectIdsToMove.includes(pid))
    };
    nextContacts[originalIndex] = updatedOriginal;
    
    // Create new contact
    const newContact: Contact = {
        ...newContactData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        dateAdded: new Date().toISOString(),
        originalContactId: originalId
    };
    nextContacts.push(newContact);
    
    setContacts(nextContacts);
    return newContact;
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev =>
      prev.map(contact =>
        contact.id === id ? { ...contact, ...updates } : contact
      )
    );
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const getContactById = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  const getContactsByProject = (projectId: string) => {
    return contacts.filter(c => c.projectIds.includes(projectId));
  };

  const associateContactWithProject = (contactId: string, projectId: string) => {
    const contact = getContactById(contactId);
    if (contact && !contact.projectIds.includes(projectId)) {
      updateContact(contactId, {
        projectIds: [...contact.projectIds, projectId]
      });
    }
  };

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        addContact,
        forkContact,
        updateContact,
        deleteContact,
        getContactById,
        getContactsByProject,
        associateContactWithProject,
        getContactByNameAndType
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