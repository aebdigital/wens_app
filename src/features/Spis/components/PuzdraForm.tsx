import React, { useState } from 'react';
import { PuzdraData } from '../types';
import { Product } from '../../../contexts/ProductsContext';

interface PuzdraFormProps {
  data: PuzdraData;
  onChange: (data: PuzdraData) => void;
  isDark: boolean;
  headerInfo: {
    vypracoval: string;
    telefon: string;
    email: string;
  };
  availableProducts?: Product[];
}

export const PuzdraForm: React.FC<PuzdraFormProps> = ({ data, onChange, isDark, headerInfo, availableProducts = [] }) => {
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  const handleProductSelect = (index: number, product: Product) => {
    const newPolozky = [...data.polozky];
    newPolozky[index].nazov = product.name;
    newPolozky[index].kod = product.kod || ''; // Autofill code
    
    // Auto-fill supplier name if provided
    let newDodavatel = { ...data.dodavatel };
    if (product.supplier) {
        newDodavatel.nazov = product.supplier;
        if (product.supplierDetails) {
            newDodavatel.ulica = product.supplierDetails.ulica || '';
            newDodavatel.mesto = product.supplierDetails.mesto || '';
            newDodavatel.tel = product.supplierDetails.tel || '';
            newDodavatel.email = product.supplierDetails.email || '';
        }
    }

    onChange({
        ...data,
        polozky: newPolozky,
        dodavatel: newDodavatel
    });
    setActiveRowIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header with Odberateľ */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
        {/* Left - Odberateľ (WENS) */}
        <div className="text-xs space-y-1">
          <p className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Odberateľ:</p>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>WENS door.s.r.o.,Vápenická 12,Prievidza 971 01</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>zap.v OR SR Trenčín od.Sro, Vl.č. 17931 / R</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>IČO: 36792942, IČ DPH: SK2022396904</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>banka:PRIMABANKA Slovensko a.s.o :4520 001 507/3100</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>IBAN: SK4431000000004520001507</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>BIC (SWIFT): LUBASKBX</p>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>tel/fax :046/542 2057 e-mail: info@wens.sk</p>
        </div>

        {/* Right - Dodávateľ */}
        <div className="text-xs space-y-2">
          <p className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Dodávateľ:</p>
          <div className="flex gap-2 items-center">
             <span className={`w-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Firma:</span>
             <input
                type="text"
                value={data.dodavatel?.nazov || ''}
                onChange={(e) => onChange({...data, dodavatel: {...data.dodavatel, nazov: e.target.value}})}
                className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
             />
          </div>
          <div className="flex gap-2 items-center">
             <span className={`w-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ulica:</span>
             <input
                type="text"
                value={data.dodavatel?.ulica || ''}
                onChange={(e) => onChange({...data, dodavatel: {...data.dodavatel, ulica: e.target.value}})}
                className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
             />
          </div>
          <div className="flex gap-2 items-center">
             <span className={`w-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mesto:</span>
             <input
                type="text"
                value={data.dodavatel?.mesto || ''}
                onChange={(e) => onChange({...data, dodavatel: {...data.dodavatel, mesto: e.target.value}})}
                className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
             />
          </div>
          <div className="flex gap-2 items-center">
             <span className={`w-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tel:</span>
             <input
                type="text"
                value={data.dodavatel?.tel || ''}
                onChange={(e) => onChange({...data, dodavatel: {...data.dodavatel, tel: e.target.value}})}
                className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
             />
          </div>
          <div className="flex gap-2 items-center">
             <span className={`w-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email:</span>
             <input
                type="text"
                value={data.dodavatel?.email || ''}
                onChange={(e) => onChange({...data, dodavatel: {...data.dodavatel, email: e.target.value}})}
                className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
             />
          </div>
        </div>
      </div>

      {/* Objednávame u Vás */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
        <div className="flex flex-col gap-2">
          <span className={`font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-800'}`}>Objednávame u Vás:</span>
          <input
            type="text"
            value={data.zakazka}
            onChange={(e) => onChange({...data, zakazka: e.target.value})}
            className={`w-full px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
      </div>

      {/* Názov tovaru table */}
      <div className={`rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'} overflow-hidden`}>
        <div className={`px-4 py-2 ${isDark ? 'bg-dark-600' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-500' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>Názov tovaru:</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white">
                <th className="px-4 py-2 text-left border-r border-white/20 min-w-[200px]">Popis položky</th>
                <th className="px-2 py-2 text-left border-r border-white/20 min-w-[120px] w-32">Kód</th>
                <th className="px-2 py-2 text-center border-r border-white/20 min-w-[80px] w-24">Množstvo</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {data.polozky.map((item, index) => (
                <tr key={item.id} className={`${isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-50'} ${index % 2 === 0 ? (isDark ? 'bg-dark-700' : 'bg-white') : (isDark ? 'bg-dark-750' : 'bg-gray-50')}`}>
                  <td className={`px-4 py-2 border-r relative ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <textarea
                      value={item.nazov}
                      onChange={(e) => {
                        const newPolozky = [...data.polozky];
                        newPolozky[index].nazov = e.target.value;
                        onChange({...data, polozky: newPolozky});
                        setActiveRowIndex(index);
                      }}
                      onFocus={() => setActiveRowIndex(index)}
                      onBlur={() => setTimeout(() => setActiveRowIndex(null), 200)}
                      rows={2}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none resize-none`}
                    />
                    {activeRowIndex === index && item.nazov.length > 0 && availableProducts.length > 0 && (
                        <div className={`absolute z-50 left-0 top-full mt-1 w-full max-h-40 overflow-y-auto rounded shadow-lg border ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-white border-gray-300'}`}>
                            {availableProducts
                              .filter(p => p.name.toLowerCase().includes(item.nazov.toLowerCase()))
                              .map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => handleProductSelect(index, p)}
                                  className={`px-2 py-1 cursor-pointer text-xs ${isDark ? 'hover:bg-dark-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}
                                >
                                  <div className="flex justify-between">
                                      <span className="font-semibold">{p.name}</span>
                                      {p.kod && <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{p.kod}</span>}
                                  </div>
                                  <span className={`block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({p.supplier})</span>
                                </div>
                              ))
                            }
                        </div>
                    )}
                  </td>
                  <td className={`px-2 py-2 border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="text"
                      value={item.kod || ''}
                      onChange={(e) => {
                        const newPolozky = [...data.polozky];
                        newPolozky[index].kod = e.target.value;
                        onChange({...data, polozky: newPolozky});
                      }}
                      className={`w-full px-1 py-0.5 text-xs ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                      placeholder="Kód"
                    />
                  </td>
                  <td className={`px-2 py-2 text-center border-r ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <input
                      type="number"
                      value={item.mnozstvo}
                      onChange={(e) => {
                        const newPolozky = [...data.polozky];
                        newPolozky[index].mnozstvo = parseInt(e.target.value) || 0;
                        onChange({...data, polozky: newPolozky});
                      }}
                      className={`w-16 px-1 py-0.5 text-xs text-center ${isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} border-none focus:outline-none`}
                    />
                  </td>
                  <td className={`px-2 py-2 text-center ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
                    <button
                      onClick={() => {
                        const newPolozky = data.polozky.filter((_, i) => i !== index);
                        onChange({...data, polozky: newPolozky});
                      }}
                      className={`p-1 hover:text-red-500 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
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
          </table>
        </div>
        <div className={`flex justify-center p-2 transition-all ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => {
              onChange({
                ...data,
                polozky: [...data.polozky, { id: data.polozky.length + 1, nazov: '', kod: '', mnozstvo: 1 }]
              });
            }}
            className={`p-1 rounded-full ${isDark ? 'bg-dark-800 hover:bg-dark-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} transition-colors shadow-sm`}
            title="Pridať riadok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 p-4 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'} border ${isDark ? 'border-dark-500' : 'border-gray-200'}`}>
        {/* Left - date/contact info */}
        <div className="space-y-2 text-xs">
          <div className="flex gap-2 items-center">
            <span className={`w-24 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dátum:</span>
            <input
              type="text"
              value={data.datum || new Date().toLocaleDateString('sk-SK')}
              onChange={(e) => onChange({...data, datum: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className={`w-24 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Spracoval:</span>
            <input
              type="text"
              value={data.spracoval !== undefined ? data.spracoval : headerInfo.vypracoval}
              onChange={(e) => onChange({...data, spracoval: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className={`w-24 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kontakt:</span>
            <input
              type="text"
              value={data.kontakt !== undefined ? data.kontakt : headerInfo.telefon}
              onChange={(e) => onChange({...data, kontakt: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className={`w-24 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>email:</span>
            <input
              type="text"
              value={data.emailSpracoval !== undefined ? data.emailSpracoval : headerInfo.email}
              onChange={(e) => onChange({...data, emailSpracoval: e.target.value})}
              className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
            />
          </div>
        </div>
        {/* Right - delivery address */}
        <div className="space-y-2 text-xs">
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Tovar doručiť na adresu:</p>
          <input
            type="text"
            value={data.tovarDorucitNaAdresu.firma}
            onChange={(e) => onChange({...data, tovarDorucitNaAdresu: {...data.tovarDorucitNaAdresu, firma: e.target.value}})}
            className={`w-full px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
          <input
            type="text"
            value={data.tovarDorucitNaAdresu.ulica}
            onChange={(e) => onChange({...data, tovarDorucitNaAdresu: {...data.tovarDorucitNaAdresu, ulica: e.target.value}})}
            className={`w-full px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
          <input
            type="text"
            value={data.tovarDorucitNaAdresu.mesto}
            onChange={(e) => onChange({...data, tovarDorucitNaAdresu: {...data.tovarDorucitNaAdresu, mesto: e.target.value}})}
            className={`w-full px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-white border-gray-500' : 'bg-gray-50 text-gray-800 border-gray-200'} border`}
          />
        </div>
      </div>
    </div>
  );
};