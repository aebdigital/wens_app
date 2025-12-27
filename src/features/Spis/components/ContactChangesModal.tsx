import React, { useState, useEffect } from 'react';

export interface ContactChange {
  section: 'zakaznik' | 'architekt' | 'realizator';
  sectionLabel: string;
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  selected: boolean;
  action: ContactAction; // Action for this specific change
}

export type ContactAction = 'ignore' | 'create_new' | 'update';

// Result structure passed to onApply - one action per section
export interface SectionActions {
  zakaznik?: ContactAction;
  architekt?: ContactAction;
  realizator?: ContactAction;
}

interface ContactChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (sectionActions: SectionActions) => void;
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
  const [changes, setChanges] = useState<ContactChange[]>(
    initialChanges.map(c => ({ ...c, action: 'update' as ContactAction }))
  );

  // Track which sections have "create new" toggled on
  const [createNewSections, setCreateNewSections] = useState<Record<string, boolean>>({});

  // Sync state when props change
  useEffect(() => {
    setChanges(initialChanges.map(c => ({ ...c, action: c.action || 'update' as ContactAction })));
    setCreateNewSections({});
  }, [initialChanges]);

  if (!isOpen) return null;

  const toggleCreateNew = (section: string) => {
    setCreateNewSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const setActionForChange = (index: number, action: 'ignore' | 'update') => {
    setChanges(prev => prev.map((change, i) =>
      i === index ? { ...change, action } : change
    ));
  };

  const setActionForSection = (section: string, action: 'ignore' | 'update') => {
    setChanges(prev => prev.map(change =>
      change.section === section ? { ...change, action } : change
    ));
  };

  const handleApply = () => {
    // Build section actions based on state
    const sectionActions: SectionActions = {};
    const sections = Array.from(new Set(changes.map(c => c.section)));

    for (const section of sections) {
      if (createNewSections[section]) {
        sectionActions[section] = 'create_new';
      } else {
        // Check if all changes in this section are ignored
        const sectionChanges = changes.filter(c => c.section === section);
        const allIgnored = sectionChanges.every(c => c.action === 'ignore');
        sectionActions[section] = allIgnored ? 'ignore' : 'update';
      }
    }

    onApply(sectionActions);
  };

  // Group changes by section
  const groupedChanges = changes.reduce((acc, change, index) => {
    if (!acc[change.section]) {
      acc[change.section] = { label: change.sectionLabel, items: [] };
    }
    acc[change.section].items.push({ ...change, index });
    return acc;
  }, {} as Record<string, { label: string; items: (ContactChange & { index: number })[] }>);

  const RadioButton = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => {
    return (
      <button
        onClick={onChange}
        disabled={disabled}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          disabled
            ? 'border-gray-400 opacity-40 cursor-not-allowed'
            : checked
              ? 'bg-[#e11b28] border-[#e11b28]'
              : (isDark ? 'border-gray-600 hover:border-[#e11b28]' : 'border-gray-300 hover:border-[#e11b28]')
        }`}
      >
        {checked && <div className="w-2 h-2 rounded-full bg-white" />}
      </button>
    );
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
    return (
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : (isDark ? 'bg-dark-600' : 'bg-gray-300')
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Boli zistené zmeny v kontaktoch
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Vyberte akciu pre každú sekciu
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedChanges).map(([section, { label, items }]) => {
            const isCreateNew = createNewSections[section] || false;

            return (
              <div key={section} className={`border-b ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                {/* Section header with "Create New" toggle */}
                <div className={`px-6 py-3 ${isDark ? 'bg-dark-700' : 'bg-gray-100'} flex items-center justify-between`}>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {label}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Vytvoriť nový kontakt
                    </span>
                    <ToggleSwitch
                      checked={isCreateNew}
                      onChange={() => toggleCreateNew(section)}
                    />
                  </div>
                </div>

                {/* Show message when creating new contact */}
                {isCreateNew && (
                  <div className={`px-6 py-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border-t ${isDark ? 'border-dark-600' : 'border-blue-100'}`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        Bude vytvorený nový kontakt s aktuálnymi údajmi. Pôvodný kontakt zostane nezmenený.
                      </span>
                    </div>
                  </div>
                )}

                {/* Table header - only show when not creating new */}
                {!isCreateNew && (
                  <>
                    <div className={`px-6 py-2 grid grid-cols-12 gap-2 text-xs font-medium ${isDark ? 'text-gray-500 bg-dark-750' : 'text-gray-500 bg-gray-50'}`}>
                      <div className="col-span-2">Pole</div>
                      <div className="col-span-4">Uložené</div>
                      <div className="col-span-4">Nové</div>
                      <div className="col-span-2 flex justify-end gap-4 pr-2">
                        <button
                          onClick={() => setActionForSection(section, 'ignore')}
                          className={`hover:underline ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          Ignorovať
                        </button>
                        <button
                          onClick={() => setActionForSection(section, 'update')}
                          className={`hover:underline ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          Aktualizovať
                        </button>
                      </div>
                    </div>

                    {/* Changes rows */}
                    {items.map((change) => (
                      <div
                        key={change.index}
                        className={`px-6 py-3 grid grid-cols-12 gap-2 items-center border-t ${isDark ? 'border-dark-600' : 'border-gray-100'}`}
                      >
                        <div className={`col-span-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {change.fieldLabel}
                        </div>
                        <div className={`col-span-4 text-sm ${isDark ? 'text-red-400' : 'text-red-600'} truncate`} title={change.oldValue}>
                          {change.oldValue || <span className="italic opacity-50">prázdne</span>}
                        </div>
                        <div className={`col-span-4 text-sm ${isDark ? 'text-green-400' : 'text-green-600'} truncate`} title={change.newValue}>
                          {change.newValue || <span className="italic opacity-50">prázdne</span>}
                        </div>
                        <div className="col-span-2 flex justify-end gap-6 pr-4">
                          <RadioButton
                            checked={change.action === 'ignore'}
                            onChange={() => setActionForChange(change.index, 'ignore')}
                          />
                          <RadioButton
                            checked={change.action === 'update'}
                            onChange={() => setActionForChange(change.index, 'update')}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-dark-500' : 'border-gray-200'} flex justify-end`}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Zrušiť
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg font-medium hover:from-[#c71325] hover:to-[#9e1019] shadow-lg"
            >
              Uložiť
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
      changes.push({
        section,
        sectionLabel: sectionLabels[section],
        field: contactField,
        fieldLabel: fieldLabels[contactField],
        oldValue,
        newValue,
        selected: true,
        action: 'update' // Default action
      });
    }
  }

  return changes;
};
