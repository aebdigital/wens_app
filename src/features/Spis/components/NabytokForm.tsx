import React from 'react';
import { NabytokData } from '../types';

interface NabytokFormProps {
  data: NabytokData;
  onChange: (data: NabytokData) => void;
  isDark: boolean;
  headerInfo: {
    firma: string;
    ulica: string;
    mesto: string;
    psc: string;
    telefon: string;
    email: string;
    vypracoval: string;
  };
}

export const NabytokForm: React.FC<NabytokFormProps> = ({ data, onChange, isDark, headerInfo }) => {
  return (
    <div className="space-y-4">
      {/* Company header info */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="text-xs space-y-1">
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>WENS door, s.r.o., Vápenická 12, 971 01 Prievidza</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>zap.v OR SR Trenčín od.Sro,Vl.č. 17931 / R, č. ŽR 340-24428</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>IČO: 36792942, IČ DPH: SK2022396904</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>PRIMABANKA Slovensko a.s. č.ú.: 4520001507/3100</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>IBAN: SK4431000000004520001507, BIC (SWIFT): LUBASKBX</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>tel./fax.: 046 / 542 2057, e-mail: info@wens.sk</p>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex gap-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#firma:</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{headerInfo.firma}</span>
          </div>
          <div className="flex gap-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#ulica:</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.ulica}</span>
          </div>
          <div className="flex gap-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#mesto:</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.mesto} {headerInfo.psc}</span>
          </div>
          <div className="flex gap-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#kontakt:</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.telefon}</span>
          </div>
          <div className="flex gap-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>#email:</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{headerInfo.email}</span>
          </div>
        </div>
      </div>

      {/* Product description */}
      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
        <input
          type="text"
          value={data.popisVyrobkov}
          onChange={(e) => onChange({...data, popisVyrobkov: e.target.value})}
          className={`w-full text-sm font-medium ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} border-none focus:outline-none`}
        />
      </div>

      {/* Výrobky section */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} overflow-hidden`}>
        <div className={`px-4 py-2 ${isDark ? 'bg-gray-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>Výrobky:</h3>
          <div className="flex gap-4 mt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{data.vyrobkyTyp}:</span>
              <input
                type="text"
                value={data.vyrobkyPopis}
                onChange={(e) => onChange({...data, vyrobkyPopis: e.target.value})}
                className={`flex-1 px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-white border-gray-500' : 'bg-white text-gray-800 border-gray-300'} border`}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-visible mr-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-left border-r border-white/20 w-8"></th>
                <th className="px-2 py-2 text-left border-r border-white/20">názov</th>
                <th className="px-2 py-2 text-left border-r border-white/20">rozmer</th>
                <th className="px-2 py-2 text-left border-r border-white/20">materiál</th>
                <th className="px-2 py-2 text-left border-r border-white/20">poznámka</th>
                <th className="px-2 py-2 text-center border-r border-white/20 w-16">ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20 w-24">cena / ks</th>
                <th className="px-2 py-2 text-right w-24">cena celkom</th>
              </tr>
            </thead>
            <tbody>
              {data.vyrobky.map((item, index) => (
                <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-gray-700' : 'bg-white') : (isDark ? 'bg-gray-750' : 'bg-gray-50')}`}>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{index + 1}</td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.nazov}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].nazov = e.target.value;
                        onChange({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.rozmer}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].rozmer = e.target.value;
                        onChange({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.material}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].material = e.target.value;
                        onChange({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.poznamka}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].poznamka = e.target.value;
                        onChange({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.ks}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].ks = parseInt(e.target.value) || 0;
                        newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                        onChange({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.cenaKs}
                      onChange={(e) => {
                        const newVyrobky = [...data.vyrobky];
                        newVyrobky[index].cenaKs = parseFloat(e.target.value) || 0;
                        newVyrobky[index].cenaCelkom = newVyrobky[index].ks * newVyrobky[index].cenaKs;
                        onChange({...data, vyrobky: newVyrobky});
                      }}
                      className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
                  </td>
                  <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {item.cenaCelkom.toFixed(2)} €
                  </td>
                  <td className="w-0 p-0 border-none relative">
                    <button
                      onClick={() => {
                        const newVyrobky = data.vyrobky.filter((_, i) => i !== index);
                        onChange({...data, vyrobky: newVyrobky});
                      }}
                      className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm z-10`}
                      title="Odstrániť riadok"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                <td colSpan={7} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {data.vyrobky.reduce((sum, item) => sum + item.cenaCelkom, 0).toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => {
              const newVyrobok = {
                id: data.vyrobky.length + 1,
                nazov: '',
                rozmer: '',
                material: '',
                poznamka: '',
                ks: 0,
                cenaKs: 0,
                cenaCelkom: 0,
              };
              onChange({...data, vyrobky: [...data.vyrobky, newVyrobok]});
            }}
            className={`p-1 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať riadok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Príplatky section */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} overflow-hidden`}>
        <div className={`px-4 py-2 ${isDark ? 'bg-gray-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>Príplatky:</h3>
        </div>
        <div className="overflow-x-visible mr-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-left border-r border-white/20 w-8"></th>
                <th className="px-2 py-2 text-left border-r border-white/20">názov</th>
                <th className="px-2 py-2 text-center border-r border-white/20 w-16">ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20 w-24">cena / ks</th>
                <th className="px-2 py-2 text-right w-24">cena celkom</th>
              </tr>
            </thead>
            <tbody>
              {data.priplatky.map((item, index) => (
                <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{index + 1}</td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.nazov}
                      onChange={(e) => {
                        const newPriplatky = [...data.priplatky];
                        newPriplatky[index].nazov = e.target.value;
                        onChange({...data, priplatky: newPriplatky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.ks}
                      onChange={(e) => {
                        const newPriplatky = [...data.priplatky];
                        newPriplatky[index].ks = parseInt(e.target.value) || 0;
                        newPriplatky[index].cenaCelkom = newPriplatky[index].ks * newPriplatky[index].cenaKs;
                        onChange({...data, priplatky: newPriplatky});
                      }}
                      className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.cenaKs}
                      onChange={(e) => {
                        const newPriplatky = [...data.priplatky];
                        newPriplatky[index].cenaKs = parseFloat(e.target.value) || 0;
                        newPriplatky[index].cenaCelkom = newPriplatky[index].ks * newPriplatky[index].cenaKs;
                        onChange({...data, priplatky: newPriplatky});
                      }}
                      className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
                  </td>
                  <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {item.cenaCelkom.toFixed(2)} €
                  </td>
                  <td className="w-0 p-0 border-none relative">
                    <button
                      onClick={() => {
                        const newPriplatky = data.priplatky.filter((_, i) => i !== index);
                        onChange({...data, priplatky: newPriplatky});
                      }}
                      className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm z-10`}
                      title="Odstrániť riadok"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                <td colSpan={4} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {data.priplatky.reduce((sum, item) => sum + item.cenaCelkom, 0).toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => {
              const newPriplatok = {
                id: data.priplatky.length + 1,
                nazov: '',
                ks: 0,
                cenaKs: 0,
                cenaCelkom: 0,
              };
              onChange({...data, priplatky: [...data.priplatky, newPriplatok]});
            }}
            className={`p-1 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať riadok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cena za výrobky a príplatky + Zľava */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} p-4`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col sm:flex-row justify-between">
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Cena za výrobky a príplatky spolu:</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {(data.vyrobky.reduce((sum, item) => sum + item.cenaCelkom, 0) + data.priplatky.reduce((sum, item) => sum + item.cenaCelkom, 0)).toFixed(2)} €
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Zľava z ceny výrobkov a príplatkov:</span>
            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <input
                type="number"
                value={data.zlavaPercent}
                onChange={(e) => onChange({...data, zlavaPercent: parseFloat(e.target.value) || 0})}
                className={`w-16 px-2 py-1 text-xs text-right rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-100 text-gray-800 border-gray-300'} border`}
              />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>%</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {((data.vyrobky.reduce((sum, item) => sum + item.cenaCelkom, 0) + data.priplatky.reduce((sum, item) => sum + item.cenaCelkom, 0)) * data.zlavaPercent / 100).toFixed(2)} €
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between">
            <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Cena výrobkov a príplatkov po odpočítaní zľavy spolu:</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {(() => {
                const subtotal = data.vyrobky.reduce((sum, item) => sum + item.cenaCelkom, 0) + data.priplatky.reduce((sum, item) => sum + item.cenaCelkom, 0);
                return (subtotal - (subtotal * data.zlavaPercent / 100)).toFixed(2);
              })()} €
            </span>
          </div>
        </div>
      </div>

      {/* Kovanie section */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} overflow-hidden`}>
        <div className={`px-4 py-2 ${isDark ? 'bg-gray-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>Kovanie:</h3>
        </div>
        <div className="overflow-x-visible mr-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-left border-r border-white/20 w-8"></th>
                <th className="px-2 py-2 text-left border-r border-white/20">názov</th>
                <th className="px-2 py-2 text-center border-r border-white/20 w-16">ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20 w-24">cena / ks</th>
                <th className="px-2 py-2 text-right w-24">cena celkom</th>
              </tr>
            </thead>
            <tbody>
              {data.kovanie.map((item, index) => (
                <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{index + 1}</td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.nazov}
                      onChange={(e) => {
                        const newKovanie = [...data.kovanie];
                        newKovanie[index].nazov = e.target.value;
                        onChange({...data, kovanie: newKovanie});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.ks}
                      onChange={(e) => {
                        const newKovanie = [...data.kovanie];
                        newKovanie[index].ks = parseInt(e.target.value) || 0;
                        newKovanie[index].cenaCelkom = newKovanie[index].ks * newKovanie[index].cenaKs;
                        onChange({...data, kovanie: newKovanie});
                      }}
                      className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.cenaKs}
                      onChange={(e) => {
                        const newKovanie = [...data.kovanie];
                        newKovanie[index].cenaKs = parseFloat(e.target.value) || 0;
                        newKovanie[index].cenaCelkom = newKovanie[index].ks * newKovanie[index].cenaKs;
                        onChange({...data, kovanie: newKovanie});
                      }}
                      className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
                  </td>
                  <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {item.cenaCelkom.toFixed(2)} €
                  </td>
                  <td className="w-0 p-0 border-none relative">
                    <button
                      onClick={() => {
                        const newKovanie = data.kovanie.filter((_, i) => i !== index);
                        onChange({...data, kovanie: newKovanie});
                      }}
                      className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm z-10`}
                      title="Odstrániť riadok"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                <td colSpan={4} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {data.kovanie.reduce((sum, item) => sum + item.cenaCelkom, 0).toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => {
              const newKovanie = {
                id: data.kovanie.length + 1,
                nazov: '',
                ks: 0,
                cenaKs: 0,
                cenaCelkom: 0,
              };
              onChange({...data, kovanie: [...data.kovanie, newKovanie]});
            }}
            className={`p-1 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať riadok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Montáž section */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} overflow-hidden`}>
        <div className={`px-4 py-2 ${isDark ? 'bg-gray-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>Montáž:</h3>
          </div>
        </div>
        <div className="overflow-x-visible mr-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-2 py-2 text-left border-r border-white/20 w-8"></th>
                <th className="px-2 py-2 text-left border-r border-white/20">názov</th>
                <th className="px-2 py-2 text-center border-r border-white/20 w-16">ks</th>
                <th className="px-2 py-2 text-right border-r border-white/20 w-24">cena / ks</th>
                <th className="px-2 py-2 text-right w-24">cena celkom</th>
              </tr>
            </thead>
            <tbody>
              {data.montaz.map((item, index) => (
                <tr key={item.id} className={`relative group ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>{index + 1}</td>
                  <td className={`px-2 py-1 border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.nazov}
                      onChange={(e) => {
                        const newMontaz = [...data.montaz];
                        newMontaz[index].nazov = e.target.value;
                        onChange({...data, montaz: newMontaz});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-center border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.ks}
                      onChange={(e) => {
                        const newMontaz = [...data.montaz];
                        newMontaz[index].ks = parseInt(e.target.value) || 0;
                        newMontaz[index].cenaCelkom = newMontaz[index].ks * newMontaz[index].cenaKs;
                        onChange({...data, montaz: newMontaz});
                      }}
                      className={`w-12 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-1 text-right border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.cenaKs}
                      onChange={(e) => {
                        const newMontaz = [...data.montaz];
                        newMontaz[index].cenaKs = parseFloat(e.target.value) || 0;
                        newMontaz[index].cenaCelkom = newMontaz[index].ks * newMontaz[index].cenaKs;
                        onChange({...data, montaz: newMontaz});
                      }}
                      className={`w-16 px-1 py-0.5 text-xs text-right ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}> €</span>
                  </td>
                  <td className={`px-2 py-1 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {item.cenaCelkom.toFixed(2)} €
                  </td>
                  <td className="w-0 p-0 border-none relative">
                    <button
                      onClick={() => {
                        const newMontaz = data.montaz.filter((_, i) => i !== index);
                        onChange({...data, montaz: newMontaz});
                      }}
                      className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm z-10`}
                      title="Odstrániť riadok"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={isDark ? 'bg-gray-600' : 'bg-gray-100'}>
                <td colSpan={4} className={`px-2 py-2 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Spolu bez DPH:
                </td>
                <td className={`px-2 py-2 text-right font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {data.montaz.reduce((sum, item) => sum + item.cenaCelkom, 0).toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => {
              const newMontaz = {
                id: data.montaz.length + 1,
                nazov: '',
                ks: 0,
                cenaKs: 0,
                cenaCelkom: 0,
              };
              onChange({...data, montaz: [...data.montaz, newMontaz]});
            }}
            className={`p-1 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať riadok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer with totals and payment info */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} p-4`}>
        {/* Left side - delivery info */}
        <div className="space-y-2 text-xs">
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Platnosť ponuky:</span>
            <input
              type="text"
              value={data.platnostPonuky}
              onChange={(e) => onChange({...data, platnostPonuky: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Miesto dodávky:</span>
            <input
              type="text"
              value={data.miestoDodavky}
              onChange={(e) => onChange({...data, miestoDodavky: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Zameranie:</span>
            <input
              type="text"
              value={data.zameranie}
              onChange={(e) => onChange({...data, zameranie: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Termín dodania:</span>
            <input
              type="text"
              value={data.terminDodania}
              onChange={(e) => onChange({...data, terminDodania: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vypracoval:</span>
            <span className={isDark ? 'text-white' : 'text-gray-800'}>{headerInfo.vypracoval}</span>
          </div>
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kontakt:</span>
            <span className={isDark ? 'text-white' : 'text-gray-800'}>{headerInfo.telefon}</span>
          </div>
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>E-mail:</span>
            <span className={isDark ? 'text-white' : 'text-gray-800'}>{headerInfo.email}</span>
          </div>
          <div className="flex gap-2">
            <span className={`w-32 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dátum:</span>
            <span className={isDark ? 'text-white' : 'text-gray-800'}>{new Date().toLocaleDateString('sk-SK')}</span>
          </div>
        </div>
        {/* Right side - totals and payment */}
        <div className="space-y-2">
          {(() => {
            const vyrobkyTotal = data.vyrobky.reduce((sum, item) => sum + item.cenaCelkom, 0);
            const priplatkyTotal = data.priplatky.reduce((sum, item) => sum + item.cenaCelkom, 0);
            const subtotal = vyrobkyTotal + priplatkyTotal;
            const zlava = subtotal * data.zlavaPercent / 100;
            const afterZlava = subtotal - zlava;
            const kovanieTotal = data.kovanie.reduce((sum, item) => sum + item.cenaCelkom, 0);
            const montazTotal = data.montaz.reduce((sum, item) => sum + item.cenaCelkom, 0);
            const cenaBezDPH = afterZlava + kovanieTotal + montazTotal;
            const dph = cenaBezDPH * 0.23;
            const cenaSDPH = cenaBezDPH + dph;

            return (
              <>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Cena bez DPH:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{cenaBezDPH.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>DPH 23%:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{dph.toFixed(2)} €</span>
                </div>
                <div className={`flex justify-between text-lg p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Cena s DPH:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{cenaSDPH.toFixed(2)} €</span>
                </div>
                <div className="mt-4 space-y-1 text-xs">
                  <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Platby:</p>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>1. záloha - pri objednávke</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.platba1Percent}%</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{(cenaSDPH * data.platba1Percent / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>2. platba - pred montážou</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.platba2Percent}%</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{(cenaSDPH * data.platba2Percent / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>3. platba - po montáži</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{data.platba3Percent}%</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{(cenaSDPH * data.platba3Percent / 100).toFixed(2)} €</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
