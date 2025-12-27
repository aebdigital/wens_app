import React, { useState, useEffect, useRef } from 'react';
import { searchRpoEntitiesByName, RpoEntity } from '../../utils/rpoApi';

interface RpoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (entity: RpoEntity) => void;
  getItemValue?: (entity: RpoEntity) => string;
  placeholder?: string;
  isLocked?: boolean;
  isDark: boolean;
}

export const RpoAutocomplete: React.FC<RpoAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  getItemValue,
  placeholder,
  isLocked = false,
  isDark,
}) => {
  const [suggestions, setSuggestions] = useState<RpoEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close suggestions on click outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timeoutId = setTimeout(async () => {
      const results = await searchRpoEntitiesByName(value);
      if (!cancelled) {
        setSuggestions(results);
        setIsLoading(false);
        // Only show if we have results and the input is still focused (handled by UI logic usually)
        // But here we rely on the user having typed.
        if (results.length > 0) {
             setShowSuggestions(true);
        }
      }
    }, 300); // debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [value]);

  const handleSelect = (entity: RpoEntity) => {
    const newVal = getItemValue ? getItemValue(entity) : entity.name;
    onChange(newVal);
    onSelect(entity);
    setShowSuggestions(false);
  };

  const inputClass = `w-full text-xs border px-2 py-1 rounded focus:outline-none ${
    isLocked
      ? isDark
        ? 'bg-dark-800 border-dark-500 text-gray-500 cursor-not-allowed'
        : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
      : isDark
      ? 'bg-dark-700 border-dark-500 text-white placeholder-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
  }`;

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
        }}
        disabled={isLocked}
        className={inputClass}
        onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
        }}
      />
      
      {isLoading && showSuggestions && value.length >= 3 && (
        <div className="absolute z-50 right-2 top-1.5 text-xs text-gray-400">
             ...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !isLocked && (
        <ul className={`absolute z-50 left-0 right-0 mt-1 border rounded shadow-lg max-h-60 overflow-y-auto ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-white border-gray-300'}`}>
          {suggestions.map((entity) => (
            <li
              key={entity.id}
              className={`px-2 py-1.5 cursor-pointer text-xs border-b last:border-0 ${
                isDark 
                  ? 'text-gray-200 hover:bg-dark-600 border-dark-500' 
                  : 'text-gray-700 hover:bg-gray-100 border-gray-100'
              }`}
              onClick={() => handleSelect(entity)}
            >
              <div className="font-semibold">{entity.name}</div>
              <div className={`flex flex-wrap gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {entity.ico && <span>IČO: {entity.ico}</span>}
                {entity.address?.municipality && (
                  <span> · {entity.address.municipality}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
