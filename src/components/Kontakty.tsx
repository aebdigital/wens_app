import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../contexts/ContactsContext';
import { useTheme } from '../contexts/ThemeContext';
import { SortableTable, Column } from './common/SortableTable';

const Kontakty = () => {
  const navigate = useNavigate();
  const { contacts, addContact, updateContact, deleteContact } = useContacts();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    priezvisko: '',
    meno: '',
    telefon: '',
    email: '',
    ulica: '',
    mesto: '',
    psc: '',
    ico: '',
    icDph: '',
    dic: '',
    kontaktnaPriezvisko: '',
    kontaktnaMeno: '',
    kontaktnaTelefon: '',
    kontaktnaEmail: '',
    popis: '',
    typ: 'zakaznik' as 'zakaznik' | 'architekt' | 'fakturacna_firma'
  });

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    return /^[+]?[\d\s()-]+$/.test(phone);
  };

  const validateICO = (ico: string): boolean => {
    if (!ico) return true; // Optional field
    return /^\d{8}$/.test(ico.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.priezvisko.trim()) {
      errors.priezvisko = 'Priezvisko je povinné';
    }

    if (formData.telefon && !validatePhone(formData.telefon)) {
      errors.telefon = 'Neplatný formát telefónneho čísla';
    }

    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Neplatný formát emailu';
    }

    if (formData.kontaktnaEmail && !validateEmail(formData.kontaktnaEmail)) {
      errors.kontaktnaEmail = 'Neplatný formát emailu';
    }

    if (formData.kontaktnaTelefon && !validatePhone(formData.kontaktnaTelefon)) {
      errors.kontaktnaTelefon = 'Neplatný formát telefónneho čísla';
    }

    if (formData.ico && !validateICO(formData.ico)) {
      errors.ico = 'IČO musí obsahovať 8 číslic';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    // Input sanitization
    if (['telefon', 'kontaktnaTelefon'].includes(name)) {
      newValue = value.replace(/[^0-9+\s-]/g, '');
    } else if (['ico', 'dic'].includes(name)) {
      newValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'psc') {
      newValue = value.replace(/[^0-9\s]/g, '');
    } else if (name === 'icDph') {
      newValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      priezvisko: '',
      meno: '',
      telefon: '',
      email: '',
      ulica: '',
      mesto: '',
      psc: '',
      ico: '',
      icDph: '',
      dic: '',
      kontaktnaPriezvisko: '',
      kontaktnaMeno: '',
      kontaktnaTelefon: '',
      kontaktnaEmail: '',
      popis: '',
      typ: 'zakaznik'
    });
    setFormErrors({});
    setEditingContactId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingContactId) {
        // Update existing contact
        updateContact(editingContactId, {
          meno: formData.meno,
          priezvisko: formData.priezvisko,
          telefon: formData.telefon,
          email: formData.email,
          ulica: formData.ulica,
          mesto: formData.mesto,
          psc: formData.psc,
          ico: formData.ico,
          icDph: formData.icDph,
          dic: formData.dic,
          typ: formData.typ,
          kontaktnaPriezvisko: formData.kontaktnaPriezvisko,
          kontaktnaMeno: formData.kontaktnaMeno,
          kontaktnaTelefon: formData.kontaktnaTelefon,
          kontaktnaEmail: formData.kontaktnaEmail,
          popis: formData.popis
        });
      } else {
        // Add new contact
        addContact({
          meno: formData.meno,
          priezvisko: formData.priezvisko,
          telefon: formData.telefon,
          email: formData.email,
          ulica: formData.ulica,
          mesto: formData.mesto,
          psc: formData.psc,
          ico: formData.ico,
          icDph: formData.icDph,
          dic: formData.dic,
          typ: formData.typ,
          kontaktnaPriezvisko: formData.kontaktnaPriezvisko,
          kontaktnaMeno: formData.kontaktnaMeno,
          kontaktnaTelefon: formData.kontaktnaTelefon,
          kontaktnaEmail: formData.kontaktnaEmail,
          popis: formData.popis,
          projectIds: []
        });
      }

      resetForm();
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Chyba pri ukladaní kontaktu. Skúste to znova.');
    }
  };

  const handleDeleteContact = () => {
    if (editingContactId && window.confirm('Naozaj chcete odstrániť tento kontakt?')) {
      deleteContact(editingContactId);
      setIsPopupOpen(false);
      resetForm();
    }
  };

  const handleContactClick = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      // Load contact data into form for editing
      setEditingContactId(contactId);
      setFormData({
        priezvisko: contact.priezvisko || '',
        meno: contact.meno || '',
        telefon: contact.telefon,
        email: contact.email,
        ulica: contact.ulica,
        mesto: contact.mesto,
        psc: contact.psc,
        ico: contact.ico || '',
        icDph: contact.icDph || '',
        dic: contact.dic || '',
        kontaktnaPriezvisko: contact.kontaktnaPriezvisko || '',
        kontaktnaMeno: contact.kontaktnaMeno || '',
        kontaktnaTelefon: contact.kontaktnaTelefon || '',
        kontaktnaEmail: contact.kontaktnaEmail || '',
        popis: contact.popis || '',
        typ: contact.typ
      });
      setIsPopupOpen(true);
    }
  };

  const handleNavigateToSpis = (contactId: string, e?: React.MouseEvent) => {
    // If e is provided (clicked from note), we stop propagation there too just in case
    if (e) e.stopPropagation();
    
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.projectIds.length > 0) {
      // Navigate to Spis page and highlight the projects
      navigate('/spis', { state: { highlightProjectIds: contact.projectIds } });
    }
  };

  // Transform contacts for the table
  const tableData = useMemo(() => {
    return [...contacts].reverse().map(contact => ({
      id: contact.id,
      meno: `${contact.priezvisko} ${contact.meno}`.trim(),
      firma: contact.typ === 'zakaznik' ? 'Zákazník' : (contact.typ === 'architekt' ? 'Architekt' : 'Fakturačná firma'),
      telefon: contact.telefon,
      email: contact.email,
      mesto: contact.mesto,
      ico: contact.ico,
      poznamka: `${contact.projectIds.length} projekt${contact.projectIds.length === 1 ? '' : 'y/ov'}`,
      rawContact: contact // Keep reference to original object if needed
    }));
  }, [contacts]);

  const columns: Column<typeof tableData[0]>[] = [
    { 
      key: 'meno', 
      label: 'Meno',
      render: (val, item) => (
        <span 
          className="font-medium text-[#e11b28] cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            handleContactClick(item.id);
          }}
        >
          {val}
        </span>
      )
    },
    { key: 'firma', label: 'Firma' },
    { key: 'telefon', label: 'Telefón' },
    { key: 'email', label: 'Email' },
    { key: 'mesto', label: 'Mesto' },
    { key: 'ico', label: 'IČO' },
    { 
      key: 'poznamka', 
      label: 'Poznámka',
      render: (val, item) => (
        <span 
          className="cursor-pointer hover:text-[#e11b28] transition-colors"
          onClick={(e) => handleNavigateToSpis(item.id, e as any)}
        >
          {val}
        </span>
      )
    }
  ];

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Kontakty</h1>
        <button
          onClick={() => setIsPopupOpen(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Pridať kontakt
        </button>
      </div>

      {/* Contact Form Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div
            className={`rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-500 ease-in-out ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{
              boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
            }}
          >
            {/* Popup Header */}
            <div className={`flex justify-between items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingContactId ? 'Upraviť kontakt' : 'Pridať nový kontakt'}
              </h2>
              <button
                onClick={() => {
                  setIsPopupOpen(false);
                  resetForm();
                }}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Popup Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Type Selection - Only for new contacts */}
              <div className="flex items-center gap-4">
                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Typ kontaktu:</label>
                {editingContactId ? (
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    formData.typ === 'zakaznik' 
                      ? 'bg-blue-100 text-blue-800' 
                      : formData.typ === 'architekt'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {formData.typ === 'zakaznik' ? 'Zákazník' : (formData.typ === 'architekt' ? 'Architekt' : 'Fakturačná firma')}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, typ: 'zakaznik' }))}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        formData.typ === 'zakaznik'
                          ? 'bg-blue-600 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Zákazník
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, typ: 'architekt' }))}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        formData.typ === 'architekt'
                          ? 'bg-purple-600 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Architekt
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, typ: 'fakturacna_firma' }))}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        formData.typ === 'fakturacna_firma'
                          ? 'bg-green-600 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Fakturačná firma
                    </button>
                  </div>
                )}
              </div>

              {/* Main form section with 2 columns layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {formData.typ === 'zakaznik' ? (
                  <>
                    <div className="flex flex-col space-y-1">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priezvisko: *</label>
                      <input
                        type="text"
                        name="priezvisko"
                        value={formData.priezvisko}
                        onChange={handleInputChange}
                        className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.priezvisko ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        required
                      />
                      {formErrors.priezvisko && (
                        <span className="text-xs text-red-500">{formErrors.priezvisko}</span>
                      )}
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Meno:</label>
                      <input
                        type="text"
                        name="meno"
                        value={formData.meno}
                        onChange={handleInputChange}
                        className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-1 md:col-span-2 flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Odberateľ: *</label>
                    <input
                      type="text"
                      name="priezvisko"
                      value={formData.priezvisko}
                      onChange={handleInputChange}
                      className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.priezvisko ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      required
                    />
                    {formErrors.priezvisko && (
                      <span className="text-xs text-red-500">{formErrors.priezvisko}</span>
                    )}
                  </div>
                )}

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Telefón:</label>
                  <input
                    type="tel"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.telefon ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                  {formErrors.telefon && (
                    <span className="text-xs text-red-500">{formErrors.telefon}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.email ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                  {formErrors.email && (
                    <span className="text-xs text-red-500">{formErrors.email}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ulica:</label>
                  <input
                    type="text"
                    name="ulica"
                    value={formData.ulica}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mesto:</label>
                  <input
                    type="text"
                    name="mesto"
                    value={formData.mesto}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>PSČ:</label>
                  <input
                    type="text"
                    name="psc"
                    value={formData.psc}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>IČO:</label>
                  <input
                    type="text"
                    name="ico"
                    value={formData.ico}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.ico ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                  {formErrors.ico && (
                    <span className="text-xs text-red-500">{formErrors.ico}</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>IČ DPH:</label>
                  <input
                    type="text"
                    name="icDph"
                    value={formData.icDph}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>DIČ:</label>
                  <input
                    type="text"
                    name="dic"
                    value={formData.dic}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>

              {/* Kontaktná osoba section - Removed for all types based on request */}
              
              {/* Popis section - Only for Zakaznik */}
              {formData.typ === 'zakaznik' && (
                <div className="pt-4">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Popis:</label>
                  <textarea
                    name="popis"
                    value={formData.popis}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Pridajte ďalšie informácie o kontakte..."
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className={`flex justify-end space-x-3 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPopupOpen(false);
                    resetForm();
                  }}
                  className={`px-4 py-2 rounded ${isDark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Zrušiť
                </button>
                {editingContactId && (
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                  >
                    Odstrániť
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Uložiť
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <SortableTable
        columns={columns}
        data={tableData}
        rowClassName={(item) => {
          if (item.rawContact.typ === 'architekt') return isDark ? 'bg-red-900/20' : 'bg-red-50';
          if (item.rawContact.typ === 'fakturacna_firma') return isDark ? 'bg-blue-900/20' : 'bg-blue-50';
          return '';
        }}
        onRowClick={(item) => handleNavigateToSpis(item.id)}
      />
    </div>
  );
};

export default Kontakty;