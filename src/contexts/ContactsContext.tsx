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
  typ: 'zakaznik' | 'architekt';
  projectIds: string[]; // Array of project IDs this contact is associated with
  dateAdded: string;
}

interface ContactsContextType {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'dateAdded'>) => Contact;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContactById: (id: string) => Contact | undefined;
  getContactsByProject: (projectId: string) => Contact[];
  associateContactWithProject: (contactId: string, projectId: string) => void;
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

  const addContact = (contactData: Omit<Contact, 'id' | 'dateAdded'>): Contact => {
    // Check if contact already exists based on email or phone
    const existing = contacts.find(
      c => (c.email && c.email === contactData.email) ||
           (c.telefon && c.telefon === contactData.telefon)
    );

    if (existing) {
      // If contact exists, just associate with new project if not already associated
      if (contactData.projectIds.length > 0 && !existing.projectIds.includes(contactData.projectIds[0])) {
        updateContact(existing.id, {
          projectIds: [...existing.projectIds, ...contactData.projectIds]
        });
      }
      return existing;
    }

    // Create new contact
    const newContact: Contact = {
      ...contactData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      dateAdded: new Date().toISOString()
    };

    setContacts(prev => [...prev, newContact]);
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
        updateContact,
        deleteContact,
        getContactById,
        getContactsByProject,
        associateContactWithProject
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
