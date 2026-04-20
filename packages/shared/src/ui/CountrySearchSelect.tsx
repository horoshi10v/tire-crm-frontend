import { useEffect, useMemo, useRef, useState } from 'react';
import { countryOptions } from '../utils/countries';

type CountrySearchSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
};

export function CountrySearchSelect({
  value,
  onChange,
  placeholder = 'Оберіть країну',
  emptyLabel = 'Не вибрано',
  searchPlaceholder = 'Пошук країни...',
  disabled = false,
  className = '',
  dropdownClassName = '',
}: CountrySearchSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 10);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return countryOptions;
    }

    return countryOptions.filter((country) => country.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const buttonLabel = value || emptyLabel;

  return (
    <div ref={containerRef} className={`relative ${isOpen ? 'z-[140]' : 'z-0'} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setQuery(value);
          setIsOpen((prev) => !prev);
        }}
        className="flex w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-left text-sm text-white outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>{buttonLabel || placeholder}</span>
        <span className="ml-3 text-xs text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen ? (
        <div className={`absolute left-0 right-0 top-[calc(100%+8px)] z-[141] overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl ${dropdownClassName}`}>
          <div className="border-b border-gray-800 p-3">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setQuery('');
                setIsOpen(false);
              }}
              className={`mb-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                value === '' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {emptyLabel}
            </button>

            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onChange(country);
                    setQuery(country);
                    setIsOpen(false);
                  }}
                  className={`mb-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                    value === country ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {country}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-400">Нічого не знайдено</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
