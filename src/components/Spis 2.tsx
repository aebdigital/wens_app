import React, { useState } from 'react';

const Spis = () => {
  const [filters, setFilters] = useState({
    cisloCP: '',
    cisloZakazky: '',
    datum: '',
    od: '',
    do: '',
    popis: '',
    meno: '',
    kategoria: '',
    spracovatel: '',
    firma: '',
    sprostredkovatel: '',
    stav: '',
    limitRadkov: '100'
  });

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('vseobecne');
  const [entries, setEntries] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    // Všeobecné
    klientCislo: '',
    predmet: 'CP2025/0365',
    meno: '',
    telefon: '',
    ulica: '',
    mesto: '',
    psc: '',
    architektonicky: '',
    priezvisko: '',
    email: '',
    ico: '',
    dicDph: '',
    fakturaziaNazov: '',
    fakturaziaPriezvisko: '',
    fakturaziaTelefon: '',
    fakturaziaEmail: '',
    fakturaziaIco: '',
    fakturaziaUlica: '',
    fakturaziaKontaktna: '',
    fakturaziaAdresa: '',
    
    // Cenové ponuky
    verzia: '',
    datumVytvorenia: '',
    menoNabyvku: '',
    cenaBezDph: '',
    cenaSdph: '',
    kopiovat: false,
    spolucenaBezZlavy: '',
    zlava: '',
    konecnaCenaBezDph: '',
    konecnaCenaSdph: '',
    
    // Vzor - Nábytok
    nazov: '',
    datum2: '',
    popis2: '',
    cisloObjednavky: '',
    vyvoj: '',
    
    // Objednávky
    // Emaily
    // Meranie a Dokumenty
    // Fotky
    // Výrobné výkresy
    kategoria: '',
  });

  const sampleData = [
    {
      stav: 'CP',
      cisloCP: 'CP2025/0364',
      cisloZakazky: '',
      datum: '',
      kontaktnaOsoba: 'Salyamova Sofia',
      architekt: '',
      realizator: 'WENS door',
      popis: 'plastové dvere 1570*C2 - biele/antracit; zásuvkové krídla biele/antracit; parapetné dosky a parapety: rádiusok 7; BA',
      firma: 'Kyncilová Lucia',
      spracovatel: 'Dvere',
      kategoria: 'Náklerok',
      terminDodania: '21.11.2025',
      color: 'yellow'
    },
    {
      stav: 'CP',
      cisloCP: 'CP2025/0362',
      cisloZakazky: '130.25',
      datum: '',
      kontaktnaOsoba: 'Horváth Katarína',
      architekt: '',
      realizator: 'WENS door',
      popis: 'hliník okná; 1570*C2 4054/175; parapetné dosky a parapety: rádiusok 7; BA',
      firma: 'Kyncilová Lucia',
      spracovatel: 'Dvere',
      kategoria: 'Okná',
      terminDodania: '',
      color: 'yellow'
    },
    {
      stav: 'CP',
      cisloCP: 'CP2025/0361',
      cisloZakazky: '126.25',
      datum: '17.10.2025',
      kontaktnaOsoba: 'Galková B. Roman',
      architekt: 'INFO - e-mail',
      realizator: 'Belafonová Dália',
      popis: 'dvere',
      firma: 'Čistické',
      spracovatel: 'Náklerok',
      kategoria: '',
      terminDodania: '21.11.2025',
      color: 'yellow'
    },
    {
      stav: 'CP',
      cisloCP: 'CP2025/0360',
      cisloZakazky: '124.25',
      datum: '',
      kontaktnaOsoba: 'Sarkez Jozef Jaroslav',
      architekt: '',
      realizator: 'Belafonová Dália',
      popis: 'dvere, servis',
      firma: 'Čistické',
      spracovatel: 'Náklerok',
      kategoria: '',
      terminDodania: '',
      color: 'yellow'
    },
    {
      stav: 'ALOHA, FA',
      cisloCP: 'CP2025/0359',
      cisloZakazky: '129.25',
      datum: '15.10.2025',
      kontaktnaOsoba: 'MT3 Honett Zoran Mirodav',
      architekt: '',
      realizator: 'Richter Roman',
      popis: 'k úplnému vybaveniu základne 7; malej bezpečnostné-odhlušiaci; CTk buk grey',
      firma: 'WENS door',
      spracovatel: 'Dvere',
      kategoria: 'Čistické',
      terminDodania: '06.12.2025',
      color: 'red'
    }
  ];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEntry = () => {
    const newEntry = {
      stav: 'CP',
      cisloCP: formData.predmet || `CP2025/${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      cisloZakazky: formData.cisloObjednavky || '',
      datum: new Date().toLocaleDateString('sk-SK'),
      kontaktnaOsoba: `${formData.meno} ${formData.priezvisko}`.trim() || '',
      architekt: formData.architektonicky || '',
      realizator: formData.fakturaziaNazov || '',
      popis: formData.popis2 || formData.nazov || '',
      firma: formData.fakturaziaNazov || formData.meno || '',
      spracovatel: 'Nový záznam',
      kategoria: formData.kategoria || '',
      terminDodania: formData.datumVytvorenia || '',
      color: 'yellow'
    };
    
    setEntries(prev => [...prev, newEntry]);
    
    // Reset form
    setFormData({
      klientCislo: '',
      predmet: 'CP2025/0365',
      meno: '',
      telefon: '',
      ulica: '',
      mesto: '',
      psc: '',
      architektonicky: '',
      priezvisko: '',
      email: '',
      ico: '',
      dicDph: '',
      fakturaziaNazov: '',
      fakturaziaPriezvisko: '',
      fakturaziaTelefon: '',
      fakturaziaEmail: '',
      fakturaziaIco: '',
      fakturaziaUlica: '',
      fakturaziaKontaktna: '',
      fakturaziaAdresa: '',
      verzia: '',
      datumVytvorenia: '',
      menoNabyvku: '',
      cenaBezDph: '',
      cenaSdph: '',
      kopiovat: false,
      spolucenaBezZlavy: '',
      zlava: '',
      konecnaCenaBezDph: '',
      konecnaCenaSdph: '',
      nazov: '',
      datum2: '',
      popis2: '',
      cisloObjednavky: '',
      vyvoj: '',
      kategoria: '',
    });
    
    setShowModal(false);
  };

  return (
    <div className="h-full bg-[#f8faff] p-4">
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Spis</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Pridať
        </button>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Číslo CP:</label>
            <input 
              type="text" 
              value={filters.cisloCP}
              onChange={(e) => handleFilterChange('cisloCP', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Číslo zákazky:</label>
            <input 
              type="text" 
              value={filters.cisloZakazky}
              onChange={(e) => handleFilterChange('cisloZakazky', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Dátum:</label>
            <select 
              value={filters.datum}
              onChange={(e) => handleFilterChange('datum', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Nepoužiť</option>
              <option>Dátum vytvorenia</option>
              <option>Dátum úpravy</option>
              <option>Termín dokončenia</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Od:</label>
            <input 
              type="date" 
              value={filters.od}
              onChange={(e) => handleFilterChange('od', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Do:</label>
            <input 
              type="date" 
              value={filters.do}
              onChange={(e) => handleFilterChange('do', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Popis:</label>
            <input 
              type="text" 
              value={filters.popis}
              onChange={(e) => handleFilterChange('popis', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Meno:</label>
            <input 
              type="text" 
              value={filters.meno}
              onChange={(e) => handleFilterChange('meno', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Kategória:</label>
            <select 
              value={filters.kategoria}
              onChange={(e) => handleFilterChange('kategoria', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetky</option>
              <option>Dvere</option>
              <option>Okná</option>
              <option>Náklerok</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Vypracoval:</label>
            <select 
              value={filters.spracovatel}
              onChange={(e) => handleFilterChange('spracovatel', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetci</option>
              <option>Dvere</option>
              <option>Náklerok</option>
              <option>Čistické</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Firma:</label>
            <select 
              value={filters.firma}
              onChange={(e) => handleFilterChange('firma', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetky</option>
              <option>WENS door</option>
              <option>Kyncilová Lucia</option>
              <option>Čistické</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Sprostredkovateľ:</label>
            <select 
              value={filters.sprostredkovatel || ''}
              onChange={(e) => handleFilterChange('sprostredkovatel', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetci</option>
              <option>Kyncilová Lucia</option>
              <option>Belafonová Dália</option>
              <option>Richter Roman</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Stav:</label>
            <select 
              value={filters.stav}
              onChange={(e) => handleFilterChange('stav', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetky</option>
              <option>CP</option>
              <option>ALOHA, FA</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
            Reset Filters
          </button>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700">Limit:</label>
            <input 
              type="text" 
              value={filters.limitRadkov}
              onChange={(e) => handleFilterChange('limitRadkov', e.target.value)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Stav</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Číslo CP</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Číslo zákazky</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Dátum</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Konečný zákazník</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Architekt</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Realizátor</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Popis</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Firma</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Vypracoval</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Kategória</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Termín dokončenia</th>
            </tr>
          </thead>
          <tbody>
            {[...sampleData, ...entries].map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 bg-white">
                <td className={`px-2 py-1 text-xs border-r ${
                  item.color === 'yellow' ? 'bg-yellow-100' : 
                  item.color === 'red' ? 'bg-red-100' : 'bg-white'
                }`}>{item.stav}</td>
                <td className="px-2 py-1 text-xs border-r font-medium text-[#e11b28]">{item.cisloCP}</td>
                <td className="px-2 py-1 text-xs border-r">{item.cisloZakazky}</td>
                <td className="px-2 py-1 text-xs border-r">{item.datum}</td>
                <td className="px-2 py-1 text-xs border-r">{item.kontaktnaOsoba}</td>
                <td className="px-2 py-1 text-xs border-r">{item.architekt}</td>
                <td className="px-2 py-1 text-xs border-r">{item.realizator}</td>
                <td className="px-2 py-1 text-xs border-r max-w-xs truncate">{item.popis}</td>
                <td className="px-2 py-1 text-xs border-r">{item.firma}</td>
                <td className="px-2 py-1 text-xs border-r">{item.spracovatel}</td>
                <td className="px-2 py-1 text-xs border-r">{item.kategoria}</td>
                <td className="px-2 py-1 text-xs">{item.terminDodania}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Nová CP</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b bg-gray-50">
              {[
                { id: 'vseobecne', label: 'Všeobecné' },
                { id: 'cenove-ponuky', label: 'Cenové ponuky' },
                { id: 'vzor-nabytok', label: 'Vzor - Nábytok' },
                { id: 'objednavky', label: 'Objednávky' },
                { id: 'emaily', label: 'Emaily' },
                { id: 'meranie-dokumenty', label: 'Meranie a Dokumenty' },
                { id: 'fotky', label: 'Fotky' },
                { id: 'vyrobne-vykresy', label: 'Výrobné výkresy' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="flex h-[70vh]">
              {/* Left Sidebar - only show on first tab */}
              {activeTab === 'vseobecne' && (
                <div className="w-48 bg-gray-50 border-r overflow-y-auto">
                <div className="p-2">
                  {/* Ochrana section */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 px-2">Ochrana</h3>
                    <div className="space-y-1 text-xs">
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Číslo CP</label>
                        <input type="text" value={formData.predmet} className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Číslo zákazky</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">KS</label>
                        <div className="flex gap-1">
                          <input type="text" className="w-8 text-xs border border-gray-300 px-1 py-1 rounded" />
                          <input type="text" className="w-8 text-xs border border-gray-300 px-1 py-1 rounded" />
                        </div>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Dátum</label>
                        <div className="flex gap-1 items-center">
                          <input type="date" className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" />
                          <button className="text-xs border rounded px-1">⟲</button>
                        </div>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Firma</label>
                        <select className="w-full text-xs border border-gray-300 px-1 py-1 rounded">
                          <option>Slavo Zdenko</option>
                        </select>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Vypracoval</label>
                        <select className="w-full text-xs border border-gray-300 px-1 py-1 rounded">
                          <option>CP</option>
                        </select>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Stav</label>
                        <select className="w-full text-xs border border-gray-300 px-1 py-1 rounded">
                          <option>CP</option>
                        </select>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Kategória</label>
                        <select className="w-full text-xs border border-gray-300 px-1 py-1 rounded">
                          <option></option>
                        </select>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Sprostredkovateľ</label>
                        <select className="w-full text-xs border border-gray-300 px-1 py-1 rounded">
                          <option></option>
                        </select>
                      </div>
                      <div className="px-2 py-1">
                        <div className="flex items-center text-xs">
                          <input type="checkbox" className="mr-1" />
                          <label>Vybavené</label>
                        </div>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Termín dokončenia</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Finance section */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 px-2">Finance</h3>
                    <div className="space-y-1 text-xs">
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Provízia</label>
                        <input type="text" defaultValue="0" className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Cena</label>
                        <input type="text" defaultValue="0" className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Záloha 1</label>
                        <input type="text" defaultValue="0" className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Dátum</label>
                        <div className="flex gap-1 items-center">
                          <input type="text" className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" />
                          <button className="text-xs border rounded px-1">📅</button>
                          <button className="text-xs border rounded px-1">⟲</button>
                        </div>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Záloha 2</label>
                        <input type="text" defaultValue="0" className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Dátum</label>
                        <div className="flex gap-1 items-center">
                          <input type="text" className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" />
                          <button className="text-xs border rounded px-1">⟲</button>
                        </div>
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Doplatok</label>
                        <input type="text" defaultValue="0" className="w-full text-xs border border-gray-300 px-1 py-1 rounded" />
                      </div>
                      <div className="px-2 py-1">
                        <label className="block text-gray-600">Dátum</label>
                        <div className="flex gap-1 items-center">
                          <input type="text" className="flex-1 text-xs border border-gray-300 px-1 py-1 rounded" />
                          <button className="text-xs border rounded px-1">⟲</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popis section */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 px-2">Popis</h3>
                    <div className="px-2">
                      <table className="w-full text-xs border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-1 py-1">Dátum</th>
                            <th className="border border-gray-300 px-1 py-1">Popis</th>
                            <th className="border border-gray-300 px-1 py-1">Pridať</th>
                            <th className="border border-gray-300 px-1 py-1">Zospovedný</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-1 py-1"></td>
                            <td className="border border-gray-300 px-1 py-1"></td>
                            <td className="border border-gray-300 px-1 py-1"><input type="checkbox" /></td>
                            <td className="border border-gray-300 px-1 py-1"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'vseobecne' && (
                  <div className="p-4">
                    {/* Konečný zákazník section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Konečný zákazník</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <select className="w-full text-xs border border-gray-300 px-2 py-1 rounded">
                            <option value="">Priezvisko</option>
                          </select>
                        </div>
                        <div>
                          <input type="text" placeholder="Meno" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>
                        
                        <div>
                          <input type="text" placeholder="Telefón" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div>
                          <input type="text" placeholder="Email" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>
                        
                        <div>
                          <input type="text" placeholder="Ulica" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div>
                          <input type="text" placeholder="IČO" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Mesto + PSČ</label>
                          <div className="flex gap-1">
                            <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                            <input type="text" className="w-16 text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">IČ DPH/DIČ</label>
                          <div className="flex gap-1">
                            <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                            <input type="text" className="w-16 text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                        </div>
                        <div></div>

                        <div className="col-span-3">
                          <label className="block text-xs text-gray-600 mb-1">Popis</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Architekt - sprostredkovateľ section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Architekt - sprostredkovateľ</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Priezvisko</label>
                          <select className="w-full text-xs border border-gray-300 px-2 py-1 rounded">
                            <option></option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Meno</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Telefón</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Email</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ulica</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">IČO</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Mesto + PSČ</label>
                          <div className="flex gap-1">
                            <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                            <input type="text" className="w-16 text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">IČ DPH/DIČ</label>
                          <div className="flex gap-1">
                            <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                            <input type="text" className="w-16 text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                        </div>
                        <div></div>
                      </div>
                    </div>

                    {/* Fakturačná firma section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Fakturačná firma / Realizátor</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Priezvisko</label>
                          <select className="w-full text-xs border border-gray-300 px-2 py-1 rounded">
                            <option></option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Meno</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Telefón</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Email</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Ulica</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">IČO</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div></div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Mesto + PSČ</label>
                          <div className="flex gap-1">
                            <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                            <input type="text" className="w-16 text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">IČ DPH/DIČ</label>
                          <div className="flex gap-1">
                            <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                            <input type="text" className="w-16 text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                        </div>
                        <div></div>
                      </div>
                    </div>

                    {/* Bottom sections */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Kontaktná osoba</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Priezvisko</label>
                            <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Meno</label>
                            <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Telefón</label>
                            <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Email</label>
                            <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Fakturácia</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center">
                              <input type="radio" name="fakturacia" className="mr-1" />
                              Použiť
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-1" />
                              K10
                            </label>
                            <span>Konečný zákazník</span>
                            <span>Sprostredkovateľ</span>
                            <span>Fakturačná firma / Realizátor</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center">
                              <input type="radio" name="fakturacia" className="mr-1" defaultChecked />
                              Nepoužiť
                            </label>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Priezvisko</label>
                              <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Meno</label>
                              <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">Adresa</label>
                            <textarea className="w-full text-xs border border-gray-300 px-2 py-1 rounded" rows={3}></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {activeTab === 'cenove-ponuky' && (
                <div className="p-4">
                  <div className="mb-4">
                    <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs">
                      Nová CP
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Verzia</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Odoslané</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Výtvoriť</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Dátum vytvorenia CP</label>
                        <div className="flex gap-1 items-center">
                          <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                          <button className="text-xs border rounded px-1">⟲</button>
                        </div>
                      </div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <button className="px-3 py-1 bg-gray-300 text-black rounded text-xs mr-2">
                      Úlož Návštevu
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Meno nabývku</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Meno nabývku</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cena bez DPH</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cena z DPH</label>
                        <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <button className="bg-gray-200 border border-gray-300 px-2 py-1 rounded">Pridať</button>
                        <button className="bg-gray-200 border border-gray-300 px-2 py-1 rounded">Úprvaě</button>
                        <button className="bg-gray-200 border border-gray-300 px-2 py-1 rounded">Odstrániť</button>
                        <button className="bg-gray-200 border border-gray-300 px-2 py-1 rounded">Kopíruť</button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2">Zoznam kovaňí</h3>
                    <table className="w-full text-xs border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1">Položka</th>
                          <th className="border border-gray-300 px-2 py-1">Počet ks</th>
                          <th className="border border-gray-300 px-2 py-1">Cena za ks</th>
                          <th className="border border-gray-300 px-2 py-1">Cena</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-16"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-16"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-16"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-4 gap-4 text-center text-xs">
                      <div>
                        <div className="text-gray-600 mb-1">Spolu cena bez zľavy:</div>
                        <div className="font-bold">0 €</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Zľava</div>
                        <div className="font-bold">0%</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Konečná cena bez DPH:</div>
                        <div className="font-bold">0 €</div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Konečná cena s DPH:</div>
                        <div className="font-bold">0 €</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vzor-nabytok' && (
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Názov</label>
                      <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Vývojí</label>
                      <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Dátum</label>
                      <input type="date" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Popis</label>
                        <textarea 
                          className="w-full text-xs border border-gray-300 px-2 py-1 rounded" 
                          rows={6}
                        ></textarea>
                      </div>
                      <div>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-600 mb-1">Číslo objednávky</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Donúčené</label>
                          <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'objednavky' && (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-500">Prečítali ste si popis</p>
                </div>
              )}

              {activeTab === 'emaily' && (
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded border border-gray-400"></div>
                      <span className="text-xs">Odoslať</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Komu</label>
                      <div className="flex gap-1">
                        <select className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded">
                          <option></option>
                        </select>
                        <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
                      </div>
                    </div>
                    <div></div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Predmet</label>
                      <input type="text" defaultValue="CP2025/0365" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                    <div></div>
                  </div>
                  <div className="mt-4">
                    <textarea 
                      className="w-full text-xs border border-gray-300 px-2 py-1 rounded" 
                      rows={12}
                      placeholder="T"
                    ></textarea>
                  </div>
                  <div className="mt-4">
                    <table className="w-full text-xs border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1">Popis</th>
                          <th className="border border-gray-300 px-2 py-1">Názov</th>
                          <th className="border border-gray-300 px-2 py-1">Dátum</th>
                          <th className="border border-gray-300 px-2 py-1">Vývojí</th>
                          <th className="border border-gray-300 px-2 py-1">Stav</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-8"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-8"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1 h-8"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                          <td className="border border-gray-300 px-2 py-1"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'meranie-dokumenty' && (
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Dátum</label>
                      <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Popis</label>
                      <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Pridať</label>
                      <div className="text-center">
                        <input type="checkbox" className="mb-2" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Zodpovedný</label>
                      <input type="text" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
                    </div>
                  </div>
                  <div className="mt-4 text-center text-xs text-gray-500">
                    <p>Prečítali som si popis</p>
                  </div>
                </div>
              )}

              {activeTab === 'fotky' && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Popis</label>
                      <div className="border border-gray-300 h-32 bg-gray-50"></div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Názov</label>
                      <div className="border border-gray-300 h-32 bg-gray-50"></div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Odoslané</label>
                      <div className="border border-gray-300 h-32 bg-gray-50"></div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Vývojí</label>
                      <div className="border border-gray-300 h-32 bg-gray-50"></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vyrobne-vykresy' && (
                <div className="p-4">
                  <div className="text-center text-xs text-gray-500">
                    <p>Sekcia Výrobné výkresy</p>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
              >
                Zrušit
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Pridať vzor
              </button>
              <button 
                onClick={handleSaveEntry}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                OK
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Obnovit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Spis;