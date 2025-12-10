import React, { useState } from 'react';
import { SpisFormData } from '../types';
import { useContacts } from '../../../contexts/ContactsContext';

interface VseobecneFormProps {
  formData: SpisFormData;
  setFormData: React.Dispatch<React.SetStateAction<SpisFormData>>;
  isDark: boolean;
  isLocked?: boolean;
}

export const VseobecneForm: React.FC<VseobecneFormProps> = ({ formData, setFormData, isDark, isLocked = false }) => {
  const { contacts } = useContacts();
  // Removed local activeSource state, now using formData.fakturaciaSource
  const [activeAutocomplete, setActiveAutocomplete] = useState<{field: string, type: string} | null>(null);

  const fillFrom = (type: 'zakaznik' | 'architekt' | 'realizator') => {
    // setActiveSource(type); // Removed
    let priezvisko = '';
    let meno = '';
    let adresa = '';

    if (type === 'zakaznik') {
        priezvisko = formData.priezvisko;
        meno = formData.meno;
        adresa = [formData.ulica, formData.mesto, formData.psc].filter(Boolean).join(', ');
    } else if (type === 'architekt') {
        priezvisko = formData.architektonickyPriezvisko;
        meno = formData.architektonickeMeno;
        adresa = [formData.architektonickyUlica, formData.architektonickyMesto, formData.architektonickyPsc].filter(Boolean).join(', ');
    } else if (type === 'realizator') {
        priezvisko = formData.realizatorPriezvisko;
        meno = formData.realizatorMeno;
        adresa = [formData.realizatorUlica, formData.realizatorMesto, formData.realizatorPsc].filter(Boolean).join(', ');
    }

    setFormData(prev => ({
        ...prev,
        fakturaciaSource: type, // Save source
        fakturaciaPriezvisko: priezvisko,
        fakturaciaMeno: meno,
        fakturaciaAdresa: adresa
    }));
  };

  const handleContactSelect = (contact: any, section: 'zakaznik' | 'architekt' | 'realizator') => {
    if (section === 'zakaznik') {
      setFormData(prev => ({
        ...prev,
        zakaznikId: contact.id,
        priezvisko: contact.priezvisko,
        meno: contact.meno,
        telefon: contact.telefon,
        email: contact.email,
        ulica: contact.ulica,
        mesto: contact.mesto,
        psc: contact.psc,
        ico: contact.ico,
        icDph: contact.icDph,
        dic: contact.dic
      }));
    } else if (section === 'architekt') {
      setFormData(prev => ({
        ...prev,
        architektId: contact.id,
        architektonickyPriezvisko: contact.priezvisko,
        architektonickeMeno: contact.meno,
        architektonickyTelefon: contact.telefon,
        architektonickyEmail: contact.email,
        architektonickyUlica: contact.ulica,
        architektonickyMesto: contact.mesto,
        architektonickyPsc: contact.psc,
        architektonickyIco: contact.ico,
        architektonickyIcDph: contact.icDph,
        architektonickyDic: contact.dic
      }));
    } else if (section === 'realizator') {
      setFormData(prev => ({
        ...prev,
        realizatorId: contact.id,
        realizatorPriezvisko: contact.priezvisko,
        realizatorMeno: contact.meno,
        realizatorTelefon: contact.telefon,
        realizatorEmail: contact.email,
        realizatorUlica: contact.ulica,
        realizatorMesto: contact.mesto,
        realizatorPsc: contact.psc,
        realizatorIco: contact.ico,
        realizatorIcDph: contact.icDph,
        realizatorDic: contact.dic
      }));
    }
    setActiveAutocomplete(null);
  };

  const renderAutocompleteInput = (
    value: string,
    field: string,
    placeholder: string,
    section: 'zakaznik' | 'architekt' | 'realizator'
  ) => {
    const filteredContacts = contacts.filter(c => {
        // Filter by type
        if (section === 'realizator') {
            if (c.typ !== 'fakturacna_firma') return false;
        } else {
            if (c.typ !== section) return false;
        }

        const needle = value.toLowerCase();
        if (!needle) return false;

        // Search in both Priezvisko and Meno
        const p = (c.priezvisko || '').toLowerCase();
        const m = (c.meno || '').toLowerCase();

        return p.includes(needle) || m.includes(needle);
    });

    return (
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          disabled={isLocked}
          onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({...prev, [field]: val}));
              if (val.length > 0) {
                  setActiveAutocomplete({ field, type: section });
              } else {
                  setActiveAutocomplete(null);
              }
          }}
          onBlur={() => setTimeout(() => setActiveAutocomplete(null), 200)} // Delay to allow click
          className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {activeAutocomplete?.field === field && filteredContacts.length > 0 && !isLocked && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
            {filteredContacts.map(c => (
              <div
                key={c.id}
                className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-gray-700"
                onClick={() => handleContactSelect(c, section)}
              >
                <span className="font-semibold">{c.priezvisko}</span> {c.meno}
                {c.mesto && <span className="text-gray-400 ml-1">({c.mesto})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 pb-4">
      {/* Konečný zákazník section */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Konečný zákazník</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            {renderAutocompleteInput(formData.priezvisko, 'priezvisko', 'Priezvisko', 'zakaznik')}
          </div>
          <div>
            {renderAutocompleteInput(formData.meno, 'meno', 'Meno', 'zakaznik')}
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Telefón"
              value={formData.telefon}
              onChange={(e) => setFormData(prev => ({...prev, telefon: e.target.value.replace(/[^0-9+\s-]/g, '')}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Ulica"
              value={formData.ulica}
              onChange={(e) => setFormData(prev => ({...prev, ulica: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="IČO"
              value={formData.ico}
              onChange={(e) => setFormData(prev => ({...prev, ico: e.target.value.replace(/[^0-9]/g, '')}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Mesto"
                value={formData.mesto}
                onChange={(e) => setFormData(prev => ({...prev, mesto: e.target.value}))}
                disabled={isLocked}
                className={`flex-1 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="PSČ"
                value={formData.psc}
                onChange={(e) => setFormData(prev => ({...prev, psc: e.target.value.replace(/[^0-9\s]/g, '')}))}
                disabled={isLocked}
                className={`w-16 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="IČ DPH"
                value={formData.icDph}
                onChange={(e) => setFormData(prev => ({...prev, icDph: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}))}
                disabled={isLocked}
                className={`flex-1 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="DIČ"
                value={formData.dic}
                onChange={(e) => setFormData(prev => ({...prev, dic: e.target.value.replace(/[^0-9]/g, '')}))}
                disabled={isLocked}
                className={`w-16 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>


        </div>
      </div>

      {/* Architekt - sprostredkovateľ section */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Architekt - sprostredkovateľ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="md:col-span-2">
            {renderAutocompleteInput(formData.architektonickyPriezvisko, 'architektonickyPriezvisko', 'Odberateľ', 'architekt')}
          </div>

          <div>
            <input
              type="text"
              placeholder="Telefón"
              value={formData.architektonickyTelefon}
              onChange={(e) => setFormData(prev => ({...prev, architektonickyTelefon: e.target.value.replace(/[^0-9+\s-]/g, '')}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.architektonickyEmail}
              onChange={(e) => setFormData(prev => ({...prev, architektonickyEmail: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Ulica"
              value={formData.architektonickyUlica}
              onChange={(e) => setFormData(prev => ({...prev, architektonickyUlica: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="IČO"
              value={formData.architektonickyIco}
              onChange={(e) => setFormData(prev => ({...prev, architektonickyIco: e.target.value.replace(/[^0-9]/g, '')}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Mesto"
                value={formData.architektonickyMesto}
                onChange={(e) => setFormData(prev => ({...prev, architektonickyMesto: e.target.value}))}
                disabled={isLocked}
                className={`flex-1 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="PSČ"
                value={formData.architektonickyPsc}
                onChange={(e) => setFormData(prev => ({...prev, architektonickyPsc: e.target.value.replace(/[^0-9\s]/g, '')}))}
                disabled={isLocked}
                className={`w-16 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="IČ DPH"
                value={formData.architektonickyIcDph}
                onChange={(e) => setFormData(prev => ({...prev, architektonickyIcDph: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}))}
                disabled={isLocked}
                className={`flex-1 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="DIČ"
                value={formData.architektonickyDic}
                onChange={(e) => setFormData(prev => ({...prev, architektonickyDic: e.target.value.replace(/[^0-9]/g, '')}))}
                disabled={isLocked}
                className={`w-16 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fakturačná firma section */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Fakturačná firma / Realizátor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="md:col-span-2">
            {renderAutocompleteInput(formData.realizatorPriezvisko, 'realizatorPriezvisko', 'Odberateľ', 'realizator')}
          </div>

          <div>
            <input
              type="text"
              placeholder="Telefón"
              value={formData.realizatorTelefon}
              onChange={(e) => setFormData(prev => ({...prev, realizatorTelefon: e.target.value.replace(/[^0-9+\s-]/g, '')}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.realizatorEmail}
              onChange={(e) => setFormData(prev => ({...prev, realizatorEmail: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Ulica"
              value={formData.realizatorUlica}
              onChange={(e) => setFormData(prev => ({...prev, realizatorUlica: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="IČO"
              value={formData.realizatorIco}
              onChange={(e) => setFormData(prev => ({...prev, realizatorIco: e.target.value.replace(/[^0-9]/g, '')}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Mesto"
                value={formData.realizatorMesto}
                onChange={(e) => setFormData(prev => ({...prev, realizatorMesto: e.target.value}))}
                disabled={isLocked}
                className={`flex-1 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="PSČ"
                value={formData.realizatorPsc}
                onChange={(e) => setFormData(prev => ({...prev, realizatorPsc: e.target.value.replace(/[^0-9\s]/g, '')}))}
                disabled={isLocked}
                className={`w-16 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="IČ DPH"
                value={formData.realizatorIcDph}
                onChange={(e) => setFormData(prev => ({...prev, realizatorIcDph: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}))}
                disabled={isLocked}
                className={`flex-1 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              <input
                type="text"
                placeholder="DIČ"
                value={formData.realizatorDic}
                onChange={(e) => setFormData(prev => ({...prev, realizatorDic: e.target.value.replace(/[^0-9]/g, '')}))}
                disabled={isLocked}
                className={`w-16 text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kontaktná osoba section */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Kontaktná osoba</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              placeholder="Priezvisko"
              value={formData.kontaktnaPriezvisko}
              onChange={(e) => setFormData(prev => ({...prev, kontaktnaPriezvisko: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Meno"
              value={formData.kontaktnaMeno}
              onChange={(e) => setFormData(prev => ({...prev, kontaktnaMeno: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Telefón"
              value={formData.kontaktnaTelefon}
              onChange={(e) => setFormData(prev => ({...prev, kontaktnaTelefon: e.target.value.replace(/[^0-9+\s-]/g, '')}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.kontaktnaEmail}
              onChange={(e) => setFormData(prev => ({...prev, kontaktnaEmail: e.target.value}))}
              disabled={isLocked}
              className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Fakturácia section */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Fakturácia</h3>

        {/* Toggle Switch */}
        <div
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${formData.fakturaciaTyp === 'pouzit' ? 'bg-blue-500' : 'bg-gray-300'}`}
          onClick={() => !isLocked && setFormData(prev => ({...prev, fakturaciaTyp: prev.fakturaciaTyp === 'pouzit' ? 'nepouzit' : 'pouzit'}))}
        >
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${formData.fakturaciaTyp === 'pouzit' ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>

        {formData.fakturaciaTyp === 'pouzit' && ( // Conditional wrapper for all content below the toggle
            <>
                <div className="flex flex-col gap-2 mb-2">
                    {/* Controls Row: K10 and Buttons */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <label className={`flex items-center select-none ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                            type="checkbox"
                            checked={formData.fakturaciaK10}
                            onChange={(e) => setFormData(prev => ({...prev, fakturaciaK10: e.target.checked}))}
                            disabled={isLocked}
                            className={`mr-1 ${isLocked ? 'cursor-not-allowed' : ''}`}
                            />
                            <span className="font-medium text-gray-700">K10</span>
                        </label>

                        <button
                            onClick={() => fillFrom('zakaznik')}
                            disabled={isLocked}
                            className={`px-2 py-1 text-xs border rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${formData.fakturaciaSource === 'zakaznik' ? 'bg-red-500 text-white border-red-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                        >
                            Konečný zákazník
                        </button>
                        <button
                            onClick={() => fillFrom('architekt')}
                            disabled={isLocked}
                            className={`px-2 py-1 text-xs border rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${formData.fakturaciaSource === 'architekt' ? 'bg-red-500 text-white border-red-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                        >
                            Sprostredkovateľ
                        </button>
                        <button
                            onClick={() => fillFrom('realizator')}
                            disabled={isLocked}
                            className={`px-2 py-1 text-xs border rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${formData.fakturaciaSource === 'realizator' ? 'bg-red-500 text-white border-red-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                        >
                            Fakturačná firma
                        </button>
                    </div>

                    {/* Input fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div>
                            <input
                            type="text"
                            placeholder="Priezvisko"
                            value={formData.fakturaciaPriezvisko}
                            onChange={(e) => setFormData(prev => ({...prev, fakturaciaPriezvisko: e.target.value}))}
                            disabled={isLocked}
                            className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div>
                            <input
                            type="text"
                            placeholder="Meno"
                            value={formData.fakturaciaMeno}
                            onChange={(e) => setFormData(prev => ({...prev, fakturaciaMeno: e.target.value}))}
                            disabled={isLocked}
                            className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>
                    <div>
                        <textarea
                            placeholder="Adresa"
                            value={formData.fakturaciaAdresa}
                            onChange={(e) => setFormData(prev => ({...prev, fakturaciaAdresa: e.target.value}))}
                            disabled={isLocked}
                            className={`w-full text-xs border border-gray-300 px-2 py-1 rounded ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            rows={2}
                        ></textarea>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
