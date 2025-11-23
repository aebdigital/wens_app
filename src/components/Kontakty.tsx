import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '../contexts/ContactsContext';
import { useTheme } from '../contexts/ThemeContext';

const Kontakty = () => {
  const navigate = useNavigate();
  const { contacts } = useContacts();
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
    popis: ''
  });

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setIsPopupOpen(false);
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
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priezvisko + Meno:</label>
                  <input
                    type="text"
                    name="priezviskoMeno"
                    value={formData.priezviskoMeno}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Telefón:</label>
                  <input
                    type="tel"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
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
                    className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
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
                      className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email:</label>
                    <input
                      type="email"
                      name="kontaktnaEmail"
                      value={formData.kontaktnaEmail}
                      onChange={handleInputChange}
                      className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
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
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Odstrániť
                </button>
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
                  className={`px-2 py-1 text-left text-xs font-medium cursor-pointer ${
                    isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                  } ${index < array.length - 1 ? (isDark ? 'border-r border-gray-600' : 'border-r border-gray-200') : ''}`}
                >
                  <div className="space-y-1">
                    <div
                      onClick={() => handleSort(column.key)}
                      className="flex items-center justify-between"
                    >
                      <span>{column.label}</span>
                      <span>
                        {sortConfig?.key === column.key
                          ? (sortConfig.direction === 'asc' ? '▲' : '▼')
                          : '▼'
                        }
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder={`Filter ${column.label}...`}
                      value={columnFilters[column.key] || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleColumnFilter(column.key, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full text-xs px-1 py-1 border rounded focus:outline-none focus:border-blue-500 ${
                        isDark ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
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