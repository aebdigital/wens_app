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
  kontaktnaPriezvisko?: string;
  kontaktnaMeno?: string;
  kontaktnaTelefon?: string;
  kontaktnaEmail?: string;
  popis?: string;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.reduce((acc: Contact[], c: any) => {
           // check if it had the bad project
           const hadBadProject = c.projectIds && c.projectIds.some((pid: string) => pid.includes('0367'));
           // clean the project ids
           const cleanedProjectIds = c.projectIds ? c.projectIds.filter((pid: string) => !pid.includes('0367')) : [];
           
           // If it had the bad project AND now has no projects, it's likely a dummy contact we want to remove.
           if (hadBadProject && cleanedProjectIds.length === 0) {
               return acc; // Skip this contact (delete it)
           }
           
           // Otherwise keep it with cleaned IDs
           acc.push({ ...c, projectIds: cleanedProjectIds });
           return acc;
        }, []);
      }
      return [];
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
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.reduce((acc: Contact[], c: any) => {
           // check if it had the bad project
           const hadBadProject = c.projectIds && c.projectIds.some((pid: string) => pid.includes('0367'));
           // clean the project ids
           const cleanedProjectIds = c.projectIds ? c.projectIds.filter((pid: string) => !pid.includes('0367')) : [];
           
           // If it had the bad project AND now has no projects, it's likely a dummy contact we want to remove.
           if (hadBadProject && cleanedProjectIds.length === 0) {
               return acc; // Skip this contact (delete it)
           }
           
           // Otherwise keep it with cleaned IDs
           acc.push({ ...c, projectIds: cleanedProjectIds });
           return acc;
        }, []);
        setContacts(cleaned);
      } else {
        setContacts([]);
      }
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

  const addContact = (contactData: Omit<Contact, 'id' | 'dateAdded'> & { id?: string }): Contact => {
    let nextContacts = [...contacts];
    const projectId = contactData.projectIds[0];

    let resultContact: Contact | undefined;

    // Helper to update local state
    const updateLocal = (id: string, updates: Partial<Contact>) => {
        const idx = nextContacts.findIndex(c => c.id === id);
        if (idx !== -1) {
            nextContacts[idx] = { ...nextContacts[idx], ...updates };
        }
    };
    
    // Helper to delete from local state
    const deleteLocal = (id: string) => {
        nextContacts = nextContacts.filter(c => c.id !== id);
    };

    // 0. Explicit ID provided (e.g. from autocomplete)
    if (contactData.id) {
      const explicit = nextContacts.find(c => c.id === contactData.id);
      if (explicit) {
        // FORKING LOGIC
        const isNameChanged = 
            (explicit.priezvisko || '').toLowerCase().trim() !== (contactData.priezvisko || '').toLowerCase().trim() ||
            (explicit.meno || '').toLowerCase().trim() !== (contactData.meno || '').toLowerCase().trim();
        
        const otherProjects = explicit.projectIds.filter(pid => pid !== projectId);
        
        if (isNameChanged && otherProjects.length > 0) {
            // "Fork" - Unlink old contact from this project
            updateLocal(explicit.id, { projectIds: otherProjects });
            
            // Now we proceed to find/create NEW contact for this project (fall through to step 1-4 logic below)
            // We do this by NOT setting resultContact here, and ensuring the code below runs.
            // effectively treating this as if no ID was provided for the *new* identity.
            
            // NOTE: We must NOT pass 'contactData.id' to the logic below, as that ID belongs to the old contact we just forked away from.
            // We will let the standard matching logic run.
        } else {
            // Normal Update (Same name OR unique to this project)
            
            // Deduplication logic
            const contactsToRemove: string[] = [];
            let projectsToMerge: string[] = [];
    
            if (projectId) {
                const linkedContacts = nextContacts.filter(c => 
                    c.projectIds.includes(projectId) && 
                    c.id !== contactData.id &&
                    c.typ === contactData.typ
                );
    
                linkedContacts.forEach(duplicate => {
                    projectsToMerge = [...projectsToMerge, ...duplicate.projectIds];
                    const remainingProjects = duplicate.projectIds.filter(p => p !== projectId);
                    if (remainingProjects.length === 0) {
                        contactsToRemove.push(duplicate.id);
                    } else {
                        updateLocal(duplicate.id, { projectIds: remainingProjects });
                    }
                });
            }
    
            if (contactsToRemove.length > 0) {
                contactsToRemove.forEach(id => deleteLocal(id));
            }
    
            const mergedProjectIds = Array.from(new Set([
                ...explicit.projectIds, 
                ...contactData.projectIds,
                ...projectsToMerge 
            ]));
            
            updateLocal(explicit.id, {
               ...contactData,
               projectIds: mergedProjectIds
            });
            
            resultContact = nextContacts.find(c => c.id === explicit.id);
        }
      }
    }

    // If we haven't resolved a contact yet (either no ID provided, or we Forked), proceed to standard logic
    if (!resultContact) {
        // 1. Try to find a contact already linked to this project
        const existingByProject = projectId 
          ? nextContacts.find(c => c.projectIds.includes(projectId) && c.typ === contactData.typ)
          : undefined;

        if (existingByProject) {
           const mergedProjectIds = Array.from(new Set([...existingByProject.projectIds, ...contactData.projectIds]));
           
           const hasDataChanged = 
            existingByProject.meno !== contactData.meno ||
            existingByProject.priezvisko !== contactData.priezvisko ||
            existingByProject.ulica !== contactData.ulica ||
            existingByProject.mesto !== contactData.mesto ||
            existingByProject.psc !== contactData.psc ||
            existingByProject.ico !== contactData.ico ||
            existingByProject.icDph !== contactData.icDph ||
            existingByProject.email !== contactData.email ||
            existingByProject.telefon !== contactData.telefon ||
            existingByProject.kontaktnaPriezvisko !== contactData.kontaktnaPriezvisko ||
            existingByProject.kontaktnaMeno !== contactData.kontaktnaMeno ||
            existingByProject.kontaktnaTelefon !== contactData.kontaktnaTelefon ||
            existingByProject.kontaktnaEmail !== contactData.kontaktnaEmail ||
            existingByProject.popis !== contactData.popis;

           if (hasDataChanged) {
             updateLocal(existingByProject.id, {
               ...contactData,
               projectIds: mergedProjectIds
             });
           }
           resultContact = nextContacts.find(c => c.id === existingByProject.id);
        }
    }

    if (!resultContact) {
        // 2. Lookup by unique identifiers (email/phone)
        let existing = nextContacts.find(
          c => (c.email && contactData.email && c.email === contactData.email) ||
               (c.telefon && contactData.telefon && c.telefon === contactData.telefon)
        );

        // 3. Fallback: Lookup by Name
        if (!existing) {
            existing = nextContacts.find(c => {
                if (c.typ !== contactData.typ) return false;
                const matchMeno = (c.meno || '').toLowerCase().trim() === (contactData.meno || '').toLowerCase().trim();
                const matchPriezvisko = (c.priezvisko || '').toLowerCase().trim() === (contactData.priezvisko || '').toLowerCase().trim();
                return matchMeno && matchPriezvisko;
            });
        }

        if (existing) {
          const mergedProjectIds = Array.from(new Set([...existing.projectIds, ...contactData.projectIds]));
          updateLocal(existing.id, {
              ...contactData,
              projectIds: mergedProjectIds
          });
          resultContact = nextContacts.find(c => c.id === existing!.id);
        }
    }

    if (!resultContact) {
        // 4. Create new contact
        const newContact: Contact = {
          ...contactData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dateAdded: new Date().toISOString()
        };
        nextContacts.push(newContact);
        resultContact = newContact;
    }

    setContacts(nextContacts);
    return resultContact!;
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
