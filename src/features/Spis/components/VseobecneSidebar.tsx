import React, { useState } from 'react';
import { SpisFormData } from '../types';
import { CustomDatePicker } from '../../../components/common/CustomDatePicker';

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

  const getInputClass = (widthClass = 'flex-1') => {
    const base = `text-xs border px-1 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#e11b28] ${widthClass}`;
    if (isLocked) {
      return `${base} cursor-not-allowed ${isDark ? 'bg-dark-800 border-dark-500 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-500'}`;
    }
    return `${base} ${isDark ? 'bg-dark-700 border-dark-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`;
  };

  const labelClass = `text-xs w-24 flex-shrink-0 ${isDark ? 'text-white' : 'text-gray-600'}`;

  return (
    <div
      className={`w-full h-full border rounded-lg overflow-y-auto ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-gray-50 border-gray-200'}`}
      style={{
        boxShadow: isDark
          ? 'inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.3)'
          : 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
      }}
    >
      <div className="p-2">
        {/* Main info section */}
        <div className="mb-2">
          <div className="space-y-1 text-xs">
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={labelClass}>Číslo CP</label>
                <input
                  type="text"
                  value={formData.predmet}
                  onChange={(e) => setFormData(prev => ({ ...prev, predmet: e.target.value }))}
                  placeholder={`CP${new Date().getFullYear()}/xxxx`}
                  disabled={isLocked}
                  className={getInputClass()}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={labelClass}>Číslo zákazky</label>
                <input
                  type="text"
                  value={formData.cisloZakazky}
                  onChange={(e) => setFormData(prev => ({ ...prev, cisloZakazky: e.target.value.replace(/[^a-zA-Z0-9]/g, '') }))}
                  disabled={isLocked}
                  className={getInputClass()}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <span className={labelClass}>Odsúhlasená CP</span>
                <div className="flex gap-1 items-center">
                  <input
                    type="text"
                    value={formData.odsuhlesenaKS1}
                    onChange={(e) => setFormData(prev => ({ ...prev, odsuhlesenaKS1: e.target.value }))}
                    disabled={true}
                    className={getInputClass('w-20')}
                  />
                  <span className={`text-xs px-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>KS</span>
                  <input
                    type="text"
                    value={formData.odsuhlesenaKS2}
                    onChange={(e) => setFormData(prev => ({ ...prev, odsuhlesenaKS2: e.target.value }))}
                    disabled={true}
                    className={getInputClass('w-20')}
                  />
                </div>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={labelClass}>Dátum</label>
                <div className="flex-1">
                  <CustomDatePicker
                    value={formData.ochranaDatum}
                    onChange={(val) => setFormData(prev => ({ ...prev, ochranaDatum: val }))}
                    disabled={isLocked}
                    className={getInputClass('w-full')}
                  />
                </div>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={labelClass}>Firma</label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={formData.firma}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, firma: value }));

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
                    className={getInputClass('w-full')}
                  />
                  {showFirmaDropdown && filteredFirmaOptions.length > 0 && !isLocked && (
                    <div
                      className={`absolute top-full left-0 right-0 border rounded z-50 max-h-32 overflow-y-auto ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-white border-gray-300'}`}
                      style={{
                        boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
                      }}
                    >
                      {filteredFirmaOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, firma: option }));
                            setShowFirmaDropdown(false);
                          }}
                          className={`px-2 py-1 text-xs cursor-pointer ${isDark ? 'text-gray-200 hover:bg-dark-600' : 'text-gray-800 hover:bg-gray-100'}`}
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
                <label className={labelClass}>Vypracoval</label>
                <input
                  type="text"
                  value={formData.vypracoval}
                  onChange={(e) => setFormData(prev => ({ ...prev, vypracoval: e.target.value }))}
                  disabled={isLocked}
                  className={getInputClass()}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={labelClass}>Stav</label>
                <select
                  value={formData.stav}
                  onChange={(e) => setFormData(prev => ({ ...prev, stav: e.target.value }))}
                  disabled={isLocked}
                  className={getInputClass()}
                >
                  <option value="CP">CP</option>
                  <option value="Záloha FA">Záloha</option>
                  <option value="Výroba">Výroba</option>
                  <option value="Rozpracované">Rozpracované</option>
                  <option value="Dokončené">Dokončené</option>
                  <option value="Uzavreté">Uzavreté</option>
                  <option value="Zrušené">Zrušené</option>
                </select>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={labelClass}>Kategória</label>
                <select
                  value={formData.kategoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, kategoria: e.target.value }))}
                  disabled={isLocked}
                  className={getInputClass()}
                >
                  <option value=""></option>
                  <option value="Dvere">Dvere</option>
                  <option value="Nábytok">Nábytok</option>
                  <option value="Schody">Schody</option>
                  <option value="Kovanie">Kovanie</option>
                  <option value="Ostatné">Ostatné</option>
                </select>
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={labelClass}>Termín dokončenia</label>
                <div className="flex-1">
                  <CustomDatePicker
                    value={formData.terminDokoncenia || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, terminDokoncenia: val }))}
                    disabled={isLocked}
                    className={getInputClass('w-full')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financie section */}
        <div className="mb-2">
          <div className={`space-y-1 text-xs rounded p-2 border ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-gray-200 border-gray-300'}`}>
            <h3 className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Financie</h3>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-20`}>Cena</label>
                <input
                  type="text"
                  value={formData.cena}
                  onChange={(e) => setFormData(prev => ({ ...prev, cena: e.target.value }))}
                  disabled={true}
                  className={getInputClass('w-24')}
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-20`}>Provízia</label>
                <input
                  type="text"
                  value={formData.provizia}
                  onChange={(e) => setFormData(prev => ({ ...prev, provizia: e.target.value.replace(/[^0-9.,]/g, '') }))}
                  disabled={isLocked}
                  className={getInputClass('w-24')}
                />
                <div className="flex items-center text-xs ml-2">
                  <input
                    type="checkbox"
                    checked={formData.vybavene}
                    onChange={(e) => setFormData(prev => ({ ...prev, vybavene: e.target.checked }))}
                    disabled={isLocked}
                    className={`mr-1 ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                  <label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Vybavené</label>
                </div>
              </div>
            </div>

            {/* Dynamic deposits from selected price offer */}
            {formData.financieDeposits && formData.financieDeposits.length > 0 ? (
              formData.financieDeposits.map((deposit, index) => (
                <div key={deposit.id} className="px-1 py-1">
                  <div className="flex items-center gap-2">
                    <label className={`${labelClass} w-20 truncate`} title={deposit.label}>
                      {deposit.label.length > 10 ? deposit.label.substring(0, 10) + '...' : deposit.label}
                    </label>
                    <input
                      type="text"
                      value={deposit.amount}
                      disabled={true}
                      className={getInputClass('w-24')}
                    />
                    <div className="flex-1">
                      <CustomDatePicker
                        value={deposit.datum}
                        onChange={(val) => {
                          const newDeposits = [...(formData.financieDeposits || [])];
                          newDeposits[index] = { ...newDeposits[index], datum: val };
                          setFormData(prev => ({ ...prev, financieDeposits: newDeposits }));
                        }}
                        disabled={isLocked}
                        className={getInputClass('w-full')}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback to legacy fixed deposits if no dynamic deposits
              <>
                <div className="px-1 py-1">
                  <div className="flex items-center gap-2">
                    <label className={`${labelClass} w-20`}>Záloha 1</label>
                    <input
                      type="text"
                      value={formData.zaloha1}
                      onChange={(e) => setFormData(prev => ({ ...prev, zaloha1: e.target.value }))}
                      disabled={true}
                      className={getInputClass('w-24')}
                    />
                    <div className="flex-1">
                      <CustomDatePicker
                        value={formData.zaloha1Datum}
                        onChange={(val) => setFormData(prev => ({ ...prev, zaloha1Datum: val }))}
                        disabled={isLocked}
                        className={getInputClass('w-full')}
                      />
                    </div>
                  </div>
                </div>
                <div className="px-1 py-1">
                  <div className="flex items-center gap-2">
                    <label className={`${labelClass} w-20`}>Záloha 2</label>
                    <input
                      type="text"
                      value={formData.zaloha2}
                      onChange={(e) => setFormData(prev => ({ ...prev, zaloha2: e.target.value }))}
                      disabled={true}
                      className={getInputClass('w-24')}
                    />
                    <div className="flex-1">
                      <CustomDatePicker
                        value={formData.zaloha2Datum}
                        onChange={(val) => setFormData(prev => ({ ...prev, zaloha2Datum: val }))}
                        disabled={isLocked}
                        className={getInputClass('w-full')}
                      />
                    </div>
                  </div>
                </div>
                <div className="px-1 py-1">
                  <div className="flex items-center gap-2">
                    <label className={`${labelClass} w-20`}>Doplatok</label>
                    <input
                      type="text"
                      value={formData.doplatok}
                      onChange={(e) => setFormData(prev => ({ ...prev, doplatok: e.target.value }))}
                      disabled={true}
                      className={getInputClass('w-24')}
                    />
                    <div className="flex-1">
                      <CustomDatePicker
                        value={formData.doplatokDatum}
                        onChange={(val) => setFormData(prev => ({ ...prev, doplatokDatum: val }))}
                        disabled={isLocked}
                        className={getInputClass('w-full')}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
