import React, { useState } from 'react';

const CennikMaterialov = () => {
  const [filters, setFilters] = useState({
    kod: '',
    kategoria: '',
    dostupnost: '',
    hladat: ''
  });

  const materialData = [
    {
      kategoria: 'Profily',
      nazov: 'AL Profil Rainbow 58/58',
      rozmer: '58',
      cenaNakup: '12.50',
      nasobnaVelkost: '1.5',
      cenaPredaj: '18.75',
      marza: '50%',
      poznamka: 'eloxovaný',
      color: 'white'
    },
    {
      kategoria: 'Sklo',
      nazov: 'GLATT Izolačné 4+16+4',
      rozmer: '24',
      cenaNakup: '45.60',
      nasobnaVelkost: '1.8',
      cenaPredaj: '82.08',
      marza: '80%',
      poznamka: 'trojsklo, argón',
      color: 'white'
    },
    {
      kategoria: 'Kovanie',
      nazov: 'MACO Kovanie Multi-Trend 7/8',
      rozmer: '',
      cenaNakup: '65.50',
      nasobnaVelkost: '2.0',
      cenaPredaj: '131.00',
      marza: '100%',
      poznamka: 'kompletná sada',
      color: 'white'
    },
    {
      kategoria: 'Tesnenie',
      nazov: 'EPDM Tesniaci profil Standard',
      rozmer: '',
      cenaNakup: '2.30',
      nasobnaVelkost: '1.4',
      cenaPredaj: '3.22',
      marza: '40%',
      poznamka: 'čierny, UV stabilný',
      color: 'white'
    }
  ];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full bg-[#f8faff] p-4">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Cenník materiálov</h1>
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
            <label className="text-xs font-medium text-gray-700">Kategória:</label>
            <select 
              value={filters.kategoria}
              onChange={(e) => handleFilterChange('kategoria', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetky</option>
              <option>Profily</option>
              <option>Sklo</option>
              <option>Kovanie</option>
              <option>Tesnenie</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Dodávateľ:</label>
            <select className="px-2 py-1 border border-gray-300 rounded text-xs">
              <option value="">Všetci</option>
              <option>MACO</option>
              <option>GLATT</option>
              <option>AL Profil</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Dostupnosť:</label>
            <select 
              value={filters.dostupnost}
              onChange={(e) => handleFilterChange('dostupnost', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="">Všetko</option>
              <option>Skladom</option>
              <option>Na objednávku</option>
              <option>Nedostupné</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Cena Od (€):</label>
            <input 
              type="number" 
              className="px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Od"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Cena Do (€):</label>
            <input 
              type="number" 
              className="px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Do"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">Hľadať:</label>
            <input 
              type="text" 
              value={filters.hladat}
              onChange={(e) => handleFilterChange('hladat', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Materiál..."
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
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Kategória</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Položka</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Rozmer</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Cena nákupu</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Merná jednotka</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Cena predaju</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Rozdiel cena</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-r">Rozdiel %</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Dodávateľ</th>
            </tr>
          </thead>
          <tbody>
            {materialData.map((material, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 bg-white">
                <td className="px-2 py-1 text-xs border-r">{material.kategoria}</td>
                <td className="px-2 py-1 text-xs border-r">{material.nazov}</td>
                <td className="px-2 py-1 text-xs border-r">{material.rozmer}</td>
                <td className="px-2 py-1 text-xs border-r">{material.cenaNakup} €</td>
                <td className="px-2 py-1 text-xs border-r">{material.nasobnaVelkost}</td>
                <td className="px-2 py-1 text-xs border-r font-medium">{material.cenaPredaj} €</td>
                <td className="px-2 py-1 text-xs border-r">{(parseFloat(material.cenaPredaj) - parseFloat(material.cenaNakup)).toFixed(2)} €</td>
                <td className="px-2 py-1 text-xs border-r">{material.marza}</td>
                <td className="px-2 py-1 text-xs">{material.poznamka}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CennikMaterialov;