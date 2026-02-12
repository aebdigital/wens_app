import React, { useState } from 'react';
import { SpisFormData } from '../types';
import { useContacts } from '../../../contexts/ContactsContext';
import { RpoAutocomplete } from './common/RpoAutocomplete';
import { RpoEntity } from '../utils/rpoApi';

interface VseobecneFormProps {
  formData: SpisFormData;
  setFormData: React.Dispatch<React.SetStateAction<SpisFormData>>;
  isDark: boolean;
  isLocked?: boolean;
}

export const VseobecneForm: React.FC<VseobecneFormProps> = ({ formData, setFormData, isDark, isLocked = false }) => {
  const { contacts } = useContacts();
  // Removed local activeSource state, now using formData.fakturaciaSource
  const [activeAutocomplete, setActiveAutocomplete] = useState<{ field: string, type: string } | null>(null);

  const getInputClass = (customWidth = 'w-full') => {
    const base = `${customWidth} text-xs border px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#e11b28]`;
    if (isLocked) {
      return `${base} cursor-not-allowed ${isDark ? 'bg-dark-800 border-dark-500 text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-500'}`;
    }
    return `${base} ${isDark ? 'bg-dark-700 border-dark-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`;
  };

  const getHeaderClass = () => `text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`;

  const fillFrom = (type: 'zakaznik' | 'architekt' | 'realizator') => {
    // setActiveSource(type); // Removed
    let priezvisko = '';
    let meno = '';
    let adresa = '';
    let telefon = '';
    let email = '';

    if (type === 'zakaznik') {
      priezvisko = formData.priezvisko;
      meno = formData.meno;
      adresa = [formData.ulica, formData.mesto, formData.psc].filter(Boolean).join(', ');
      telefon = formData.telefon;
      email = formData.email;
    } else if (type === 'architekt') {
      priezvisko = formData.architektonickyPriezvisko;
      meno = formData.architektonickeMeno;
      adresa = [formData.architektonickyUlica, formData.architektonickyMesto, formData.architektonickyPsc].filter(Boolean).join(', ');
      telefon = formData.architektonickyTelefon;
      email = formData.architektonickyEmail;
    } else if (type === 'realizator') {
      priezvisko = formData.realizatorPriezvisko;
      meno = formData.realizatorMeno;
      adresa = [formData.realizatorUlica, formData.realizatorMesto, formData.realizatorPsc].filter(Boolean).join(', ');
      telefon = formData.realizatorTelefon;
      email = formData.realizatorEmail;
    }

    setFormData(prev => ({
      ...prev,
      fakturaciaSource: type, // Save source
      fakturaciaPriezvisko: priezvisko,
      fakturaciaMeno: meno,
      fakturaciaAdresa: adresa,
      fakturaciaIco: type === 'zakaznik' ? formData.ico : (type === 'architekt' ? formData.architektonickyIco : formData.realizatorIco),
      fakturaciaDic: type === 'zakaznik' ? formData.dic : (type === 'architekt' ? formData.architektonickyDic : formData.realizatorDic),
      fakturaciaIcDph: type === 'zakaznik' ? formData.icDph : (type === 'architekt' ? formData.architektonickyIcDph : formData.realizatorIcDph),
      fakturaciaTelefon: telefon,
      fakturaciaEmail: email
    }));
  };

  const handleRpoSelect = (entity: RpoEntity, section: 'zakaznik' | 'architekt' | 'realizator') => {
    const address = entity.address || {};
    const street = [address.street, address.buildingNumber].filter(Boolean).join(' ');
    const city = address.municipality || '';
    const zip = address.postalCode || '';
    const ico = entity.ico || '';
    const dic = entity.dic || '';
    const name = entity.name;

    if (section === 'zakaznik') {
      setFormData(prev => ({
        ...prev,
        priezvisko: name,
        ulica: street,
        mesto: city,
        psc: zip,
        ico: ico,
        dic: dic
      }));
    } else if (section === 'architekt') {
      setFormData(prev => ({
        ...prev,
        architektonickyPriezvisko: name,
        architektonickyUlica: street,
        architektonickyMesto: city,
        architektonickyPsc: zip,
        architektonickyIco: ico,
        architektonickyDic: dic
      }));
    } else if (section === 'realizator') {
      setFormData(prev => ({
        ...prev,
        realizatorPriezvisko: name,
        realizatorUlica: street,
        realizatorMesto: city,
        realizatorPsc: zip,
        realizatorIco: ico,
        realizatorDic: dic
      }));
    }
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
    const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredContacts = contacts.filter(c => {
      // Filter by type
      if (section === 'realizator') {
        if (c.typ !== 'fakturacna_firma') return false;
      } else {
        if (c.typ !== section) return false;
      }

      const needle = normalizeString(value);
      if (!needle) return false;

      // Search in both Priezvisko and Meno
      const p = normalizeString(c.priezvisko || '');
      const m = normalizeString(c.meno || '');

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
            setFormData(prev => ({ ...prev, [field]: val }));
            if (val.length > 0) {
              setActiveAutocomplete({ field, type: section });
            } else {
              setActiveAutocomplete(null);
            }
          }}
          onBlur={() => setTimeout(() => setActiveAutocomplete(null), 200)} // Delay to allow click
          className={getInputClass()}
        />
        {activeAutocomplete?.field === field && filteredContacts.length > 0 && !isLocked && (
          <div className={`absolute z-50 left-0 right-0 mt-1 border rounded shadow-lg max-h-40 overflow-y-auto ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-white border-gray-300'}`}>
            {filteredContacts.map(c => (
              <div
                key={c.id}
                className={`px-2 py-1.5 cursor-pointer text-xs ${isDark ? 'text-gray-200 hover:bg-dark-600' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => handleContactSelect(c, section)}
              >
                <span className="font-semibold">{c.priezvisko}</span> {c.meno}
                {c.mesto && <span className={`ml-1 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>({c.mesto})</span>}
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
        <h3 className={getHeaderClass()}>Konečný zákazník</h3>
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
              onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value.replace(/[^0-9+\s-]/g, '') }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Ulica"
              value={formData.ulica}
              onChange={(e) => setFormData(prev => ({ ...prev, ulica: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <RpoAutocomplete
              value={formData.ico}
              onChange={(val) => setFormData(prev => ({ ...prev, ico: val.replace(/[^0-9]/g, '') }))}
              onSelect={(entity) => handleRpoSelect(entity, 'zakaznik')}
              getItemValue={(entity) => entity.ico || ''}
              placeholder="IČO"
              isLocked={isLocked}
              isDark={isDark}
            />
          </div>

          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Mesto"
                value={formData.mesto}
                onChange={(e) => setFormData(prev => ({ ...prev, mesto: e.target.value }))}
                disabled={isLocked}
                className={getInputClass('flex-1')}
              />
              <input
                type="text"
                placeholder="PSČ"
                value={formData.psc}
                onChange={(e) => setFormData(prev => ({ ...prev, psc: e.target.value.replace(/[^0-9\s]/g, '') }))}
                disabled={isLocked}
                className={getInputClass('w-16')}
              />
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="IČ DPH"
                value={formData.icDph}
                onChange={(e) => setFormData(prev => ({ ...prev, icDph: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() }))}
                disabled={isLocked}
                className={getInputClass('flex-1')}
              />
              <input
                type="text"
                placeholder="DIČ"
                value={formData.dic}
                onChange={(e) => setFormData(prev => ({ ...prev, dic: e.target.value.replace(/[^0-9]/g, '') }))}
                disabled={isLocked}
                className={getInputClass('w-16')}
              />
            </div>
          </div>

          {/* Popis projektu - full width */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Popis projektu"
              value={formData.popisProjektu}
              onChange={(e) => setFormData(prev => ({ ...prev, popisProjektu: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>

        </div>
      </div>

      {/* Architekt - sprostredkovateľ section */}
      <div className="mb-3">
        <h3 className={getHeaderClass()}>Architekt - sprostredkovateľ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="md:col-span-2">
            {renderAutocompleteInput(formData.architektonickyPriezvisko, 'architektonickyPriezvisko', 'Odberateľ', 'architekt')}
          </div>

          <div>
            <input
              type="text"
              placeholder="Telefón"
              value={formData.architektonickyTelefon}
              onChange={(e) => setFormData(prev => ({ ...prev, architektonickyTelefon: e.target.value.replace(/[^0-9+\s-]/g, '') }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.architektonickyEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, architektonickyEmail: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Ulica"
              value={formData.architektonickyUlica}
              onChange={(e) => setFormData(prev => ({ ...prev, architektonickyUlica: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <RpoAutocomplete
              value={formData.architektonickyIco}
              onChange={(val) => setFormData(prev => ({ ...prev, architektonickyIco: val.replace(/[^0-9]/g, '') }))}
              onSelect={(entity) => handleRpoSelect(entity, 'architekt')}
              getItemValue={(entity) => entity.ico || ''}
              placeholder="IČO"
              isLocked={isLocked}
              isDark={isDark}
            />
          </div>

          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Mesto"
                value={formData.architektonickyMesto}
                onChange={(e) => setFormData(prev => ({ ...prev, architektonickyMesto: e.target.value }))}
                disabled={isLocked}
                className={getInputClass('flex-1')}
              />
              <input
                type="text"
                placeholder="PSČ"
                value={formData.architektonickyPsc}
                onChange={(e) => setFormData(prev => ({ ...prev, architektonickyPsc: e.target.value.replace(/[^0-9\s]/g, '') }))}
                disabled={isLocked}
                className={getInputClass('w-16')}
              />
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="IČ DPH"
                value={formData.architektonickyIcDph}
                onChange={(e) => setFormData(prev => ({ ...prev, architektonickyIcDph: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() }))}
                disabled={isLocked}
                className={getInputClass('flex-1')}
              />
              <input
                type="text"
                placeholder="DIČ"
                value={formData.architektonickyDic}
                onChange={(e) => setFormData(prev => ({ ...prev, architektonickyDic: e.target.value.replace(/[^0-9]/g, '') }))}
                disabled={isLocked}
                className={getInputClass('w-16')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fakturačná firma section */}
      <div className="mb-3">
        <h3 className={getHeaderClass()}>Fakturačná firma / Realizátor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="md:col-span-2">
            {renderAutocompleteInput(formData.realizatorPriezvisko, 'realizatorPriezvisko', 'Odberateľ', 'realizator')}
          </div>

          <div>
            <input
              type="text"
              placeholder="Telefón"
              value={formData.realizatorTelefon}
              onChange={(e) => setFormData(prev => ({ ...prev, realizatorTelefon: e.target.value.replace(/[^0-9+\s-]/g, '') }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.realizatorEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, realizatorEmail: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Ulica"
              value={formData.realizatorUlica}
              onChange={(e) => setFormData(prev => ({ ...prev, realizatorUlica: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <RpoAutocomplete
              value={formData.realizatorIco}
              onChange={(val) => setFormData(prev => ({ ...prev, realizatorIco: val.replace(/[^0-9]/g, '') }))}
              onSelect={(entity) => handleRpoSelect(entity, 'realizator')}
              getItemValue={(entity) => entity.ico || ''}
              placeholder="IČO"
              isLocked={isLocked}
              isDark={isDark}
            />
          </div>

          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Mesto"
                value={formData.realizatorMesto}
                onChange={(e) => setFormData(prev => ({ ...prev, realizatorMesto: e.target.value }))}
                disabled={isLocked}
                className={getInputClass('flex-1')}
              />
              <input
                type="text"
                placeholder="PSČ"
                value={formData.realizatorPsc}
                onChange={(e) => setFormData(prev => ({ ...prev, realizatorPsc: e.target.value.replace(/[^0-9\s]/g, '') }))}
                disabled={isLocked}
                className={getInputClass('w-16')}
              />
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="IČ DPH"
                value={formData.realizatorIcDph}
                onChange={(e) => setFormData(prev => ({ ...prev, realizatorIcDph: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() }))}
                disabled={isLocked}
                className={getInputClass('flex-1')}
              />
              <input
                type="text"
                placeholder="DIČ"
                value={formData.realizatorDic}
                onChange={(e) => setFormData(prev => ({ ...prev, realizatorDic: e.target.value.replace(/[^0-9]/g, '') }))}
                disabled={isLocked}
                className={getInputClass('w-16')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kontaktná osoba section */}
      <div className="mb-3">
        <h3 className={getHeaderClass()}>Kontaktná osoba</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              placeholder="Priezvisko"
              value={formData.kontaktnaPriezvisko}
              onChange={(e) => setFormData(prev => ({ ...prev, kontaktnaPriezvisko: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Meno"
              value={formData.kontaktnaMeno}
              onChange={(e) => setFormData(prev => ({ ...prev, kontaktnaMeno: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Telefón"
              value={formData.kontaktnaTelefon}
              onChange={(e) => setFormData(prev => ({ ...prev, kontaktnaTelefon: e.target.value.replace(/[^0-9+\s-]/g, '') }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Email"
              value={formData.kontaktnaEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, kontaktnaEmail: e.target.value }))}
              disabled={isLocked}
              className={getInputClass()}
            />
          </div>
        </div>
      </div>

      {/* Fakturácia section */}
      <div className="mb-3">
        <h3 className={getHeaderClass()}>Fakturácia</h3>

        {/* Toggle Switch */}
        <div
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${formData.fakturaciaTyp === 'pouzit' ? 'bg-blue-500' : 'bg-gray-300'}`}
          onClick={() => !isLocked && setFormData(prev => ({ ...prev, fakturaciaTyp: prev.fakturaciaTyp === 'pouzit' ? 'nepouzit' : 'pouzit' }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, fakturaciaK10: e.target.checked }))}
                    disabled={isLocked}
                    className={`mr-1 ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>K10</span>
                </label>

                <button
                  onClick={() => fillFrom('zakaznik')}
                  disabled={isLocked}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${formData.fakturaciaSource === 'zakaznik'
                    ? 'bg-red-500 text-white border-red-600'
                    : isDark
                      ? 'bg-dark-700 text-gray-200 border-dark-500 hover:bg-dark-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  Konečný zákazník
                </button>
                <button
                  onClick={() => fillFrom('architekt')}
                  disabled={isLocked}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${formData.fakturaciaSource === 'architekt'
                    ? 'bg-red-500 text-white border-red-600'
                    : isDark
                      ? 'bg-dark-700 text-gray-200 border-dark-500 hover:bg-dark-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  Sprostredkovateľ
                </button>
                <button
                  onClick={() => fillFrom('realizator')}
                  disabled={isLocked}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${formData.fakturaciaSource === 'realizator'
                    ? 'bg-red-500 text-white border-red-600'
                    : isDark
                      ? 'bg-dark-700 text-gray-200 border-dark-500 hover:bg-dark-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  Fakturačná firma
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
