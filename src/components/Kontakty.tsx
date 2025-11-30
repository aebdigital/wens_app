import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../contexts/ContactsContext';
import { useTheme } from '../contexts/ThemeContext';

const Kontakty = () => {
  const navigate = useNavigate();
  const { contacts, addContact, updateContact, deleteContact } = useContacts();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    priezviskoMeno: '',
    telefon: '',
    email: '',
    ulica: '',
    mesto: '',
    psc: '',
    ico: '',
    icDph: '',
    kontaktnaPriezvisko: '',
    kontaktnaMeno: '',
    kontaktnaTelefon: '',
    kontaktnaEmail: '',
    popis: '',
    typ: 'zakaznik' as 'zakaznik' | 'architekt'
  });

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({});
  const [activeSearchColumn, setActiveSearchColumn] = useState<string | null>(null);

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

    // Split priezviskoMeno into meno and priezvisko
    const nameParts = formData.priezviskoMeno.trim().split(/\s+/);
    if (nameParts.length < 2) {
      errors.priezviskoMeno = 'Zadajte priezvisko aj meno';
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
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      priezviskoMeno: '',
      telefon: '',
      email: '',
      ulica: '',
      mesto: '',
      psc: '',
      ico: '',
      icDph: '',
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
      // Split priezviskoMeno into parts
      const nameParts = formData.priezviskoMeno.trim().split(/\s+/);
      const priezvisko = nameParts[0];
      const meno = nameParts.slice(1).join(' ');

      if (editingContactId) {
        // Update existing contact
        updateContact(editingContactId, {
          meno,
          priezvisko,
          telefon: formData.telefon,
          email: formData.email,
          ulica: formData.ulica,
          mesto: formData.mesto,
          psc: formData.psc,
          ico: formData.ico,
          icDph: formData.icDph,
          typ: formData.typ
        });
      } else {
        // Add new contact
        addContact({
          meno,
          priezvisko,
          telefon: formData.telefon,
          email: formData.email,
          ulica: formData.ulica,
          mesto: formData.mesto,
          psc: formData.psc,
          ico: formData.ico,
          icDph: formData.icDph,
          typ: formData.typ,
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleContactClick = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.projectIds.length > 0) {
      // Navigate to Spis page and highlight the projects
      navigate('/spis', { state: { highlightProjectIds: contact.projectIds } });
    }
  };

  const getSortedAndFilteredClients = () => {
    // Transform contacts to match the table format
    let filteredClients = contacts.map(contact => ({
      id: contact.id,
      meno: `${contact.priezvisko} ${contact.meno}`.trim(),
      firma: contact.typ === 'zakaznik' ? 'Zákazník' : 'Architekt',
      telefon: contact.telefon,
      email: contact.email,
      mesto: contact.mesto,
      ico: contact.ico,
      poznamka: `${contact.projectIds.length} projekt${contact.projectIds.length === 1 ? '' : 'y/ov'}`
    }));

    // Apply column filters
    Object.keys(columnFilters).forEach(column => {
      const filterValue = columnFilters[column];
      if (filterValue) {
        filteredClients = filteredClients.filter(client => {
          const value = client[column as keyof typeof client] || '';
          return value.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filteredClients.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key] || '';
        const bValue = (b as any)[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredClients;
  };

  return (
    <div className={`h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Kontakty</h1>
        <button
          onClick={() => setIsPopupOpen(true)}
          className="flex items-center px-4 py-2 bg-[#e11b28] text-white rounded-lg hover:bg-[#c71325] transition-colors"
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
          <div className={`rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Popup Header */}
            <div className={`flex justify-between items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Pridať nový kontakt</h2>
              <button
                onClick={() => setIsPopupOpen(false)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Popup Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Main form section with 2 columns layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priezvisko + Meno: *</label>
                  <input
                    type="text"
                    name="priezviskoMeno"
                    value={formData.priezviskoMeno}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.priezviskoMeno ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    required
                  />
                  {formErrors.priezviskoMeno && (
                    <span className="text-xs text-red-500">{formErrors.priezviskoMeno}</span>
                  )}
                </div>

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
              </div>

              {/* Kontaktná osoba section */}
              <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Kontaktná osoba:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priezvisko:</label>
                    <input
                      type="text"
                      name="kontaktnaPriezvisko"
                      value={formData.kontaktnaPriezvisko}
                      onChange={handleInputChange}
                      className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Meno:</label>
                    <input
                      type="text"
                      name="kontaktnaMeno"
                      value={formData.kontaktnaMeno}
                      onChange={handleInputChange}
                      className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Telefón:</label>
                    <input
                      type="tel"
                      name="kontaktnaTelefon"
                      value={formData.kontaktnaTelefon}
                      onChange={handleInputChange}
                      className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.kontaktnaTelefon ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                    {formErrors.kontaktnaTelefon && (
                      <span className="text-xs text-red-500">{formErrors.kontaktnaTelefon}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email:</label>
                    <input
                      type="email"
                      name="kontaktnaEmail"
                      value={formData.kontaktnaEmail}
                      onChange={handleInputChange}
                      className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${formErrors.kontaktnaEmail ? 'border-red-500' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                    {formErrors.kontaktnaEmail && (
                      <span className="text-xs text-red-500">{formErrors.kontaktnaEmail}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Popis section */}
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

              {/* Action Buttons */}
              <div className={`flex justify-end space-x-3 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className={`px-4 py-2 rounded ${isDark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Zrušiť
                </button>
                {editingContactId && (
                  <button
                    type="button"
                    onClick={handleDeleteContact}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Odstrániť
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e11b28] text-white rounded hover:bg-red-700"
                >
                  Uložiť
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className={`rounded-lg shadow-md overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <table className="w-full text-xs">
          <thead className={`sticky top-0 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <tr>
              {[
                { key: 'meno', label: 'Meno' },
                { key: 'firma', label: 'Firma' },
                { key: 'telefon', label: 'Telefón' },
                { key: 'email', label: 'Email' },
                { key: 'mesto', label: 'Mesto' },
                { key: 'ico', label: 'IČO' },
                { key: 'poznamka', label: 'Poznámka' }
              ].map((column, index, array) => (
                <th
                  key={column.key}
                  className={`px-2 py-2 text-left text-xs font-medium transition-all ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  } ${index < array.length - 1 ? (isDark ? 'border-r border-gray-600' : 'border-r border-gray-200') : ''}`}
                >
                  {activeSearchColumn === column.key ? (
                    <div className="flex items-center gap-2" style={{ animation: 'slideIn 0.2s ease-out' }}>
                      <svg className="w-4 h-4 flex-shrink-0 text-gray-400" style={{ animation: 'fadeIn 0.3s ease-out' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder={`Search...`}
                        value={columnFilters[column.key] || ''}
                        onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                        onBlur={() => {
                          if (!columnFilters[column.key]) {
                            setActiveSearchColumn(null);
                          }
                        }}
                        autoFocus
                        style={{ animation: 'expandWidth 0.25s ease-out' }}
                        className={`w-full text-xs px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#e11b28] transition-all ${
                          isDark ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {columnFilters[column.key] && (
                        <button
                          onClick={() => {
                            handleColumnFilter(column.key, '');
                            setActiveSearchColumn(null);
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => handleSort(column.key)}
                        className="cursor-pointer hover:text-[#e11b28] transition-colors"
                      >
                        {column.label}
                        {sortConfig?.key === column.key && (
                          <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                      <button
                        onClick={() => setActiveSearchColumn(column.key)}
                        className={`ml-2 p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
                          columnFilters[column.key] ? 'text-[#e11b28]' : ''
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getSortedAndFilteredClients().map((client) => (
              <tr
                key={client.id}
                className={`border-b cursor-pointer ${
                  isDark ? 'border-gray-700 bg-gray-800 hover:bg-gray-700' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                onClick={() => handleContactClick(client.id)}
              >
                <td className={`px-2 py-1 text-xs font-medium text-[#e11b28] ${isDark ? 'border-r border-gray-700' : 'border-r border-gray-200'}`}>{client.meno}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{client.firma}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{client.telefon}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{client.email}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{client.mesto}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300 border-r border-gray-700' : 'border-r border-gray-200'}`}>{client.ico}</td>
                <td className={`px-2 py-1 text-xs ${isDark ? 'text-gray-300' : ''}`}>{client.poznamka}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Kontakty;