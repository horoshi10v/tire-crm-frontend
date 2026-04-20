import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { SearchSuggestionSection } from '../utils/searchAssist';
import { SearchHighlightedText } from './SearchHighlightedText';

type SearchSuggestionsDropdownProps = {
  anchorRef: RefObject<HTMLElement | null>;
  dropdownRef?: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  isLoading: boolean;
  sections: SearchSuggestionSection[];
  activeSuggestionIndex: number;
  highlightTokens: string[];
  isTouchDevice?: boolean;
  query: string;
  onSelect: (value: string) => void;
  onHoverIndexChange: (index: number) => void;
  onClearRecent?: () => void;
};

export function SearchSuggestionsDropdown({
  anchorRef,
  dropdownRef,
  isOpen,
  isLoading,
  sections,
  activeSuggestionIndex,
  highlightTokens,
  isTouchDevice = false,
  query,
  onSelect,
  onHoverIndexChange,
  onClearRecent,
}: SearchSuggestionsDropdownProps) {
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);

  const updatePosition = () => {
    const anchorElement = anchorRef.current;
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
      zIndex: 1200,
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

    const handleViewportChange = () => updatePosition();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined' || !portalStyle) {
    return null;
  }

  return createPortal(
    <div
      ref={dropdownRef}
      style={portalStyle}
      className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-2 shadow-2xl"
    >
      {isLoading ? (
        <div className="rounded-xl px-3 py-2 text-sm text-gray-400">Пошук підказок...</div>
      ) : sections.length > 0 ? (
        <div className="max-h-[min(24rem,60vh)] touch-pan-y overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-2">
            {(() => {
              let absoluteIndex = -1;
              return sections.map((section) => (
                <div key={section.title} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 px-3 pt-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      {section.title}
                    </div>
                    {section.title === 'Останні запити' && onClearRecent ? (
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={onClearRecent}
                        className="text-[11px] font-medium text-gray-500 transition hover:text-gray-300"
                      >
                        Очистити
                      </button>
                    ) : null}
                  </div>
                  {section.items.map((suggestion) => {
                    absoluteIndex += 1;
                    const currentIndex = absoluteIndex;
                    return (
                      <button
                        key={`${section.title}-${suggestion}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => {
                          if (!isTouchDevice) {
                            onHoverIndexChange(currentIndex);
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isTouchDevice) {
                            onHoverIndexChange(-1);
                          }
                        }}
                        onClick={() => onSelect(suggestion)}
                        className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                          !isTouchDevice && currentIndex === activeSuggestionIndex
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        <SearchHighlightedText text={suggestion} tokens={highlightTokens} />
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      ) : (
        <div className="rounded-xl px-3 py-2 text-sm text-gray-500">
          {query.trim() ? 'Нічого не знайдено для цього запиту' : 'Почніть вводити запит або виберіть підказку'}
        </div>
      )}
    </div>,
    document.body,
  );
}
