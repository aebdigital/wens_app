import React, { useState } from 'react';

const Technicke = () => {
  const [filters, setFilters] = useState({
    hladat: '',
    kategoria: '',
    dodavatel: '',
    datum: ''
  });

  const technicalData = [
    {
      nazov: 'MACO WE Stavebnica Okno 2.62',
      datum: '28.09.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
      color: 'white'
    },
    {
      nazov: 'MACO Vektorové Okno Stavby Tabuľka 27',
      datum: '01.11.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
      color: 'white'
    },
    {
      nazov: 'MACO Multi Trend Okno 7/8',
      datum: '28.11.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
      color: 'white'
    },
    {
      nazov: 'MACO Stavebnica Okno 62mm',
      datum: '15.09.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
      color: 'white'
    },
    {
      nazov: 'MACO Stavebnica Okno 87',
      datum: '03.09.14',
      kategoria: 'Okná',
      dodavatel: 'MACO',
      color: 'white'
    },
    {
      nazov: 'MACO Stavebnica Okno RC-3',
      datum: '12.09.14',
      kategoria: 'Bezpečnosť',
      dodavatel: 'MACO',
      color: 'white'
    },
    {
      nazov: 'WERU Tabuľka Okno ľahostné Okno',
      datum: '02.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
      color: 'white'
    },
    {
      nazov: 'WERU Okno RU0 Stavebnica okno TechnoB',
      datum: '08.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
      color: 'white'
    },
    {
      nazov: 'WERU Stavebnica okno Thermo',
      datum: '23.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
      color: 'white'
    },
    {
      nazov: 'WERU Thermo okno stavebnica tabuľka',
      datum: '22.09.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
      color: 'white'
    },
    {
      nazov: 'NTE okno stavebnica okno',
      datum: '10.09.14',
      kategoria: 'Okná',
      dodavatel: 'NTE',
      color: 'white'
    },
    {
      nazov: 'NTE okno okno stavebnica Techno',
      datum: '11.09.14',
      kategoria: 'Okná',
      dodavatel: 'NTE',
      color: 'white'
    },
    {
      nazov: 'NTE Prel R0 okno 87',
      datum: '12.09.14',
      kategoria: 'Okná',
      dodavatel: 'NTE',
      color: 'white'
    },
    {
      nazov: 'Protipožiarna technika 10',
      datum: '05.09.14',
      kategoria: 'Bezpečnosť',
      dodavatel: 'Ostatné',
      color: 'white'
    },
    {
      nazov: 'Po kotáže aktíva okno 8mm stanice',
      datum: '03.09.14',
      kategoria: 'Inštalácia',
      dodavatel: 'Ostatné',
      color: 'white'
    },
    {
      nazov: 'WERU Techno Multi-Trend 12',
      datum: '06.12.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
      color: 'white'
    },
    {
      nazov: 'WERU Techno stavby',
      datum: '06.12.14',
      kategoria: 'Stavby',
      dodavatel: 'WERU',
      color: 'white'
    },
    {
      nazov: 'WERU Thermo stavebnica 71',
      datum: '12.10.14',
      kategoria: 'Okná',
      dodavatel: 'WERU',
      color: 'white'
    },
    {
      nazov: 'WE Thermo RC okno aktíva',
      datum: '11.09.14',
      kategoria: 'Bezpečnosť',
      dodavatel: 'WERU',
      color: 'white'
    }
  ];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredDocuments = technicalData.filter(doc =>
    doc.nazov.toLowerCase().includes(filters.hladat.toLowerCase()) &&
    (filters.kategoria === '' || doc.kategoria === filters.kategoria) &&
    (filters.dodavatel === '' || doc.dodavatel === filters.dodavatel)
  );

  return (
    <div className="h-full bg-[#f8faff] p-4">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Technické výkresy</h1>
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
            <label className="text-xs font-medium text-gray-700">Hľadať:</label>
            <input 
              type="text" 
              value={filters.hladat}
              onChange={(e) => handleFilterChange('hladat', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Názov dokumentu..."
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
              <option>Okná</option>
              <option>Dvere</option>
              <option>Bezpečnosť</option>
              <option>Stavby</option>
              <option>Inštalácia</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Dodávateľ:</label>
            <select 
              value={filters.dodavatel}
              onChange={(e) => handleFilterChange('dodavatel', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetci</option>
              <option>MACO</option>
              <option>WERU</option>
              <option>NTE</option>
              <option>Ostatné</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Dátum od:</label>
            <input 
              type="date" 
              value={filters.datum}
              onChange={(e) => handleFilterChange('datum', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
        </div>

        <div className="flex justify-start items-center mt-4">
          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Názov</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Dátum</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Kategória</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Dodávateľ</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 bg-white">
                <td className="px-2 py-1 text-xs border-r font-medium text-[#e11b28]">{doc.nazov}</td>
                <td className="px-2 py-1 text-xs border-r">{doc.datum}</td>
                <td className="px-2 py-1 text-xs border-r">{doc.kategoria}</td>
                <td className="px-2 py-1 text-xs">{doc.dodavatel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Technicke;