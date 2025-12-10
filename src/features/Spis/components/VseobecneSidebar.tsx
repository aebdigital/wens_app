import React, { useState } from 'react';
import { SpisFormData } from '../types';

interface VseobecneSidebarProps {
  formData: SpisFormData;
  setFormData: React.Dispatch<React.SetStateAction<SpisFormData>>;
  isDark: boolean;
  firmaOptions: string[];
  isLocked?: boolean;
}

export const VseobecneSidebar: React.FC<VseobecneSidebarProps> = ({
  formData,
  setFormData,
  isDark,
  firmaOptions,
  isLocked = false
}) => {
  const [showFirmaDropdown, setShowFirmaDropdown] = useState(false);
  const [filteredFirmaOptions, setFilteredFirmaOptions] = useState<string[]>([]);

  const inputClass = `text-xs border border-gray-300 px-1 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <div
      className={`w-full h-full border rounded-lg overflow-y-auto ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
      style={{
        boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
      }}
    >
      <div className="p-2">
        {/* Main info section */}
        <div className="mb-2">
          <div className="space-y-1 text-xs">
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Číslo CP</label>
                <input
                  type="text"
                  value={formData.predmet}
                  onChange={(e) => setFormData(prev => ({...prev, predmet: e.target.value}))}
                  placeholder="CP2025/xxxx"
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Číslo zákazky</label>
                <input
                  type="text"
                  value={formData.cisloZakazky}
                  onChange={(e) => setFormData(prev => ({...prev, cisloZakazky: e.target.value.replace(/[^a-zA-Z0-9]/g, '')}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-24 flex-shrink-0">Odsúhlasená CP</span>
                <div className="flex gap-1 items-center">
                  <input
                    type="text"
                    value={formData.odsuhlesenaKS1}
                    onChange={(e) => setFormData(prev => ({...prev, odsuhlesenaKS1: e.target.value}))}
                    disabled={true}
                    className={`w-20 ${inputClass}`}
                  />
                  <span className="text-gray-600 text-xs px-1">KS</span>
                  <input
                    type="text"
                    value={formData.odsuhlesenaKS2}
                    onChange={(e) => setFormData(prev => ({...prev, odsuhlesenaKS2: e.target.value}))}
                    disabled={true}
                    className={`w-20 ${inputClass}`}
                  />
                </div>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Dátum</label>
                <input
                  type="date"
                  value={formData.ochranaDatum}
                  onChange={(e) => setFormData(prev => ({...prev, ochranaDatum: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Firma</label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={formData.firma}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({...prev, firma: value}));

                      // Filter options based on input
                      const filtered = firmaOptions.filter(option =>
                        option.toLowerCase().includes(value.toLowerCase())
                      );
                      setFilteredFirmaOptions(filtered);
                      setShowFirmaDropdown(value.length > 0 && filtered.length > 0);
                    }}
                    onFocus={() => {
                      if (!isLocked) {
                        setFilteredFirmaOptions(firmaOptions);
                        setShowFirmaDropdown(firmaOptions.length > 0);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow click on dropdown
                      setTimeout(() => setShowFirmaDropdown(false), 150);
                    }}
                    placeholder="Zadajte alebo vyberte firmu"
                    disabled={isLocked}
                    className={`w-full ${inputClass}`}
                  />
                  {showFirmaDropdown && filteredFirmaOptions.length > 0 && !isLocked && (
                    <div
                      className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded z-50 max-h-32 overflow-y-auto"
                      style={{
                        boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
                      }}
                    >
                      {filteredFirmaOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setFormData(prev => ({...prev, firma: option}));
                            setShowFirmaDropdown(false);
                          }}
                          className="px-2 py-1 text-xs cursor-pointer hover:bg-gray-100"
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Vypracoval</label>
                <input
                  type="text"
                  value={formData.vypracoval}
                  onChange={(e) => setFormData(prev => ({...prev, vypracoval: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Stav</label>
                <select
                  value={formData.stav}
                  onChange={(e) => setFormData(prev => ({...prev, stav: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                >
                  <option value="CP">CP</option>
                  <option value="Výroba">Výroba</option>
                  <option value="Záloha FA">Záloha FA</option>
                  <option value="Zrušené">Zrušené</option>
                  <option value="Dokončené">Dokončené</option>
                  <option value="Rozpracované">Rozpracované</option>
                  <option value="Uzavreté">Uzavreté</option>
                </select>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Kategória</label>
                <select
                  value={formData.kategoria}
                  onChange={(e) => setFormData(prev => ({...prev, kategoria: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                >
                  <option value=""></option>
                  <option value="Dvere">Dvere</option>
                  <option value="Schody">Schody</option>
                  <option value="Kovanie">Kovanie</option>
                  <option value="Služby">Služby</option>
                  <option value="Ostatné">Ostatné</option>
                  <option value="Celosklo">Celosklo</option>
                  <option value="Parkety">Parkety</option>
                  <option value="Eclipse">Eclipse</option>
                  <option value="Obklady">Obklady</option>
                  <option value="Nábytok">Nábytok</option>
                </select>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-24 flex-shrink-0">Termín dokončenia</label>
                <input
                  type="date"
                  value={formData.terminDokoncenia || ''}
                  onChange={(e) => setFormData(prev => ({...prev, terminDokoncenia: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financie section */}
        <div className="mb-2">
          <div className="space-y-1 text-xs bg-gray-200 rounded p-2 border">
            <h3 className="text-xs font-semibold text-gray-700 mb-1">Financie</h3>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-20 flex-shrink-0">Cena</label>
                <input
                  type="text"
                  value={formData.cena}
                  onChange={(e) => setFormData(prev => ({...prev, cena: e.target.value}))}
                  disabled={true}
                  className={`w-24 ${inputClass}`}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-20 flex-shrink-0">Provízia</label>
                <input
                  type="text"
                  value={formData.provizia}
                  onChange={(e) => setFormData(prev => ({...prev, provizia: e.target.value.replace(/[^0-9.,]/g, '')}))}
                  disabled={isLocked}
                  className={`w-24 ${inputClass}`}
                />
                <div className="flex items-center text-xs ml-2">
                  <input
                    type="checkbox"
                    checked={formData.vybavene}
                    onChange={(e) => setFormData(prev => ({...prev, vybavene: e.target.checked}))}
                    disabled={isLocked}
                    className={`mr-1 ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                  <label>Vybavené</label>
                </div>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-20 flex-shrink-0">Záloha 1</label>
                <input
                  type="text"
                  value={formData.zaloha1}
                  onChange={(e) => setFormData(prev => ({...prev, zaloha1: e.target.value}))}
                  disabled={true}
                  className={`w-24 ${inputClass}`}
                />
                <input
                  type="date"
                  value={formData.zaloha1Datum}
                  onChange={(e) => setFormData(prev => ({...prev, zaloha1Datum: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-20 flex-shrink-0">Záloha 2</label>
                <input
                  type="text"
                  value={formData.zaloha2}
                  onChange={(e) => setFormData(prev => ({...prev, zaloha2: e.target.value}))}
                  disabled={true}
                  className={`w-24 ${inputClass}`}
                />
                <input
                  type="date"
                  value={formData.zaloha2Datum}
                  onChange={(e) => setFormData(prev => ({...prev, zaloha2Datum: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-xs w-20 flex-shrink-0">Doplatok</label>
                <input
                  type="text"
                  value={formData.doplatok}
                  onChange={(e) => setFormData(prev => ({...prev, doplatok: e.target.value}))}
                  disabled={true}
                  className={`w-24 ${inputClass}`}
                />
                <input
                  type="date"
                  value={formData.doplatokDatum}
                  onChange={(e) => setFormData(prev => ({...prev, doplatokDatum: e.target.value}))}
                  disabled={isLocked}
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
