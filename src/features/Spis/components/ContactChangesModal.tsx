import React, { useState, useEffect } from 'react';

export interface ContactChange {
  section: 'zakaznik' | 'architekt' | 'realizator';
  sectionLabel: string;
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  selected: boolean;
}

export type ContactAction = 'ignore' | 'create_new' | 'update';

interface ContactChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (action: ContactAction, selectedChanges: ContactChange[]) => void;
  changes: ContactChange[];
  isDark: boolean;
}

export const ContactChangesModal: React.FC<ContactChangesModalProps> = ({
  isOpen,
  onClose,
  onApply,
  changes: initialChanges,
  isDark
}) => {
  const [changes, setChanges] = useState<ContactChange[]>(initialChanges);

  // Sync state when props change
  useEffect(() => {
    setChanges(initialChanges);
  }, [initialChanges]);

  if (!isOpen) return null;

  const handleAction = (action: ContactAction) => {
    onApply(action, changes);
  };

  // Group changes by section
  const groupedChanges = changes.reduce((acc, change, index) => {
    if (!acc[change.section]) {
      acc[change.section] = { label: change.sectionLabel, items: [] };
    }
    acc[change.section].items.push({ ...change, index });
    return acc;
  }, {} as Record<string, { label: string; items: (ContactChange & { index: number })[] }>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Boli zistené zmeny v rámci kontaktov
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Vyberte zmeny, ktoré chcete aplikovať na uložené kontakty
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Changes grouped by section */}
          {Object.entries(groupedChanges).map(([section, { label, items }]) => (
            <div key={section} className="mb-6">
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {label}
              </h3>
              <div className="space-y-2">
                {items.map((change) => (
                  <div
                    key={change.index}
                    className={`p-3 rounded-lg ${isDark ? 'bg-dark-700 border border-dark-500' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {change.fieldLabel}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-4 mt-1">
                        <div className="flex-1">
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Uložené:</span>
                          <div className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'} break-words`}>
                            {change.oldValue || <span className="italic opacity-50">prázdne</span>}
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nové:</span>
                          <div className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'} break-words`}>
                            {change.newValue || <span className="italic opacity-50">prázdne</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with 3 action buttons */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAction('ignore')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <span>Ignorovať</span>
                <span className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Ponechať zmeny len v projekte</span>
              </div>
            </button>
            <button
              onClick={() => handleAction('create_new')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <div className="flex flex-col items-center">
                <span>Vytvoriť nový kontakt</span>
                <span className={`text-xs mt-1 opacity-80`}>Vytvorí sa nový kontakt s novými údajmi</span>
              </div>
            </button>
            <button
              onClick={() => handleAction('update')}
              className="flex-1 px-4 py-3 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg font-medium hover:from-[#c71325] hover:to-[#9e1019] shadow-lg"
            >
              <div className="flex flex-col items-center">
                <span>Aktualizovať kontakt</span>
                <span className={`text-xs mt-1 opacity-80`}>Prepíše údaje v uloženom kontakte</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to detect changes between saved contact and form data
export const detectContactChanges = (
  savedContact: any | undefined,
  formData: any,
  section: 'zakaznik' | 'architekt' | 'realizator'
): ContactChange[] => {
  if (!savedContact) return [];

  const changes: ContactChange[] = [];

  const sectionLabels: Record<string, string> = {
    zakaznik: 'Konečný zákazník',
    architekt: 'Architekt - sprostredkovateľ',
    realizator: 'Fakturačná firma / Realizátor'
  };

  // Field mappings for future use if needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _fieldMappings: Record<string, { formField: string; label: string }[]> = {
    zakaznik: [
      { formField: 'priezvisko', label: 'Priezvisko' },
      { formField: 'meno', label: 'Meno' },
      { formField: 'telefon', label: 'Telefón' },
      { formField: 'email', label: 'Email' },
      { formField: 'ulica', label: 'Ulica' },
      { formField: 'mesto', label: 'Mesto' },
      { formField: 'psc', label: 'PSČ' },
      { formField: 'ico', label: 'IČO' },
      { formField: 'icDph', label: 'IČ DPH' },
      { formField: 'dic', label: 'DIČ' }
    ],
    architekt: [
      { formField: 'architektonickyPriezvisko', label: 'Názov / Priezvisko' },
      { formField: 'architektonickeMeno', label: 'Meno' },
      { formField: 'architektonickyTelefon', label: 'Telefón' },
      { formField: 'architektonickyEmail', label: 'Email' },
      { formField: 'architektonickyUlica', label: 'Ulica' },
      { formField: 'architektonickyMesto', label: 'Mesto' },
      { formField: 'architektonickyPsc', label: 'PSČ' },
      { formField: 'architektonickyIco', label: 'IČO' },
      { formField: 'architektonickyIcDph', label: 'IČ DPH' },
      { formField: 'architektonickyDic', label: 'DIČ' }
    ],
    realizator: [
      { formField: 'realizatorPriezvisko', label: 'Názov / Priezvisko' },
      { formField: 'realizatorMeno', label: 'Meno' },
      { formField: 'realizatorTelefon', label: 'Telefón' },
      { formField: 'realizatorEmail', label: 'Email' },
      { formField: 'realizatorUlica', label: 'Ulica' },
      { formField: 'realizatorMesto', label: 'Mesto' },
      { formField: 'realizatorPsc', label: 'PSČ' },
      { formField: 'realizatorIco', label: 'IČO' },
      { formField: 'realizatorIcDph', label: 'IČ DPH' },
      { formField: 'realizatorDic', label: 'DIČ' }
    ]
  };

  // Map contact field names to form field names
  const contactToFormField: Record<string, string> = {
    priezvisko: section === 'zakaznik' ? 'priezvisko' : section === 'architekt' ? 'architektonickyPriezvisko' : 'realizatorPriezvisko',
    meno: section === 'zakaznik' ? 'meno' : section === 'architekt' ? 'architektonickeMeno' : 'realizatorMeno',
    telefon: section === 'zakaznik' ? 'telefon' : section === 'architekt' ? 'architektonickyTelefon' : 'realizatorTelefon',
    email: section === 'zakaznik' ? 'email' : section === 'architekt' ? 'architektonickyEmail' : 'realizatorEmail',
    ulica: section === 'zakaznik' ? 'ulica' : section === 'architekt' ? 'architektonickyUlica' : 'realizatorUlica',
    mesto: section === 'zakaznik' ? 'mesto' : section === 'architekt' ? 'architektonickyMesto' : 'realizatorMesto',
    psc: section === 'zakaznik' ? 'psc' : section === 'architekt' ? 'architektonickyPsc' : 'realizatorPsc',
    ico: section === 'zakaznik' ? 'ico' : section === 'architekt' ? 'architektonickyIco' : 'realizatorIco',
    icDph: section === 'zakaznik' ? 'icDph' : section === 'architekt' ? 'architektonickyIcDph' : 'realizatorIcDph',
    dic: section === 'zakaznik' ? 'dic' : section === 'architekt' ? 'architektonickyDic' : 'realizatorDic'
  };

  const contactFields = ['priezvisko', 'meno', 'telefon', 'email', 'ulica', 'mesto', 'psc', 'ico', 'icDph', 'dic'];
  const fieldLabels: Record<string, string> = {
    priezvisko: section === 'zakaznik' ? 'Priezvisko' : 'Názov / Priezvisko',
    meno: 'Meno',
    telefon: 'Telefón',
    email: 'Email',
    ulica: 'Ulica',
    mesto: 'Mesto',
    psc: 'PSČ',
    ico: 'IČO',
    icDph: 'IČ DPH',
    dic: 'DIČ'
  };

  for (const contactField of contactFields) {
    const formField = contactToFormField[contactField];
    // Normalize both values: convert to string, trim whitespace, handle null/undefined
    const oldValue = savedContact[contactField] != null ? String(savedContact[contactField]).trim() : '';
    const newValue = formData[formField] != null ? String(formData[formField]).trim() : '';

    // Only add if values actually differ (skip if both are empty)
    if (oldValue !== newValue) {
      // Debug log to help identify issues
      console.log(`[ContactChanges] ${section}.${contactField}: "${oldValue}" vs "${newValue}"`);
      changes.push({
        section,
        sectionLabel: sectionLabels[section],
        field: contactField,
        fieldLabel: fieldLabels[contactField],
        oldValue,
        newValue,
        selected: true // Default to selected
      });
    }
  }

  return changes;
};
