import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

export type ResponsiveSelectOption = {
    value: string;
    label: string;
};

type ResponsiveSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: ResponsiveSelectOption[];
    className?: string;
    mobileSelectClassName?: string;
    desktopButtonClassName?: string;
    dropdownClassName?: string;
    optionClassName?: string;
    disabled?: boolean;
};

export function ResponsiveSelect({
    value,
    onChange,
    options,
    className = '',
    mobileSelectClassName = '',
    desktopButtonClassName = '',
    dropdownClassName = '',
    optionClassName = '',
    disabled = false,
}: ResponsiveSelectProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);

    const updatePosition = () => {
        const anchorElement = containerRef.current;
        if (!anchorElement) {
            setPortalStyle(null);
            return;
        }

        const rect = anchorElement.getBoundingClientRect();
        setPortalStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            zIndex: 1500,
        });
    };

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        updatePosition();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const targetNode = event.target as Node;
            if (
                !containerRef.current?.contains(targetNode) &&
                !dropdownRef.current?.contains(targetNode)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleViewportChange = () => updatePosition();

        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        return () => {
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [isOpen]);

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? options[0],
        [options, value]
    );

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className={`w-full appearance-none rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 pr-12 text-sm text-white outline-none transition-colors focus:border-[#10AD0B] md:hidden ${mobileSelectClassName}`}
            >
                {options.map((option) => (
                    <option key={option.value || '__empty'} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white md:hidden">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-5 w-5"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>

            <div className="hidden md:block">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-left text-sm text-white outline-none transition-colors focus:border-[#10AD0B] disabled:cursor-not-allowed disabled:opacity-60 ${desktopButtonClassName}`}
                >
                    <span>{selectedOption?.label ?? ''}</span>
                    <span className="ml-3 shrink-0 text-white">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            fill="none"
                            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        >
                            <path
                                d="M5 7.5L10 12.5L15 7.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </button>

                {isOpen && typeof document !== 'undefined' && portalStyle
                    ? createPortal(
                          <div
                              ref={dropdownRef}
                              style={portalStyle}
                              className={`overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl ${dropdownClassName}`}
                          >
                              <div className="max-h-64 overflow-y-auto p-2">
                                  {options.map((option) => {
                                      const isSelected = option.value === value;
                                      return (
                                          <button
                                              key={option.value || '__empty'}
                                              type="button"
                                              onMouseDown={(event) => event.preventDefault()}
                                              onClick={() => {
                                                  onChange(option.value);
                                                  setIsOpen(false);
                                              }}
                                              className={`mb-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                                                  isSelected ? 'bg-[#10AD0B]/15 text-[#8ff38b]' : 'text-gray-200 hover:bg-gray-800'
                                              } ${optionClassName}`}
                                          >
                                              {option.label}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>,
                          document.body
                      )
                    : null}
            </div>
        </div>
    );
}
