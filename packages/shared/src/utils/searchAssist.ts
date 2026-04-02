import { getLotPrimaryLabel, getLotSizeLabel, getLotTagLabels, type LotLike } from './lotPresentation';
import { parseCatalogSearchHint } from './searchHints';

const unique = (items: string[]) => [...new Set(items.filter(Boolean))];
const sizePattern = /\d{3}\/\d{2,3}\s?R\d{2}/i;
const conditionSuggestions = new Set(['новий', 'вживаний']);

export type SearchSuggestionSection = {
  title: string;
  items: string[];
};

export type SearchSuggestionSectionKey = 'recent' | 'sizes' | 'brands' | 'conditions' | 'other';

export type SearchSuggestionSectionsConfig = {
  includeRecent?: boolean;
  priorities?: Partial<Record<SearchSuggestionSectionKey, number>>;
  recentLimit?: number;
};

export const defaultSearchSuggestionSectionPriorities: Record<SearchSuggestionSectionKey, number> = {
  recent: 0,
  sizes: 1,
  brands: 2,
  conditions: 3,
  other: 4,
};

export const createDefaultSearchSuggestionSectionsConfig = (
  includeRecent: boolean,
  overrides: Partial<SearchSuggestionSectionsConfig> = {},
): SearchSuggestionSectionsConfig => ({
  includeRecent,
  recentLimit: overrides.recentLimit ?? 5,
  priorities: {
    ...defaultSearchSuggestionSectionPriorities,
    ...overrides.priorities,
  },
});

export type RecentSearchConfig = {
  persistentKey: string;
  persistentLimit: number;
  sessionKey: string;
  sessionLimit: number;
};

const splitTextTokens = (value: string): string[] =>
  value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

export const getSearchHighlightTokens = (query: string): string[] => {
  const parsed = parseCatalogSearchHint(query);
  const tokens: string[] = [];

  if (parsed.width && parsed.profile && parsed.diameter) {
    tokens.push(`${parsed.width}/${parsed.profile} R${parsed.diameter}`);
    tokens.push(`${parsed.width}/${parsed.profile}R${parsed.diameter}`);
    tokens.push(parsed.width, parsed.profile, `R${parsed.diameter}`, parsed.diameter);
  }
  if (parsed.condition === 'NEW') {
    tokens.push('Новий', 'New');
  }
  if (parsed.condition === 'USED') {
    tokens.push('Вживаний', 'Used');
  }
  if (parsed.season === 'SUMMER') {
    tokens.push('Літо', 'Summer');
  }
  if (parsed.season === 'WINTER') {
    tokens.push('Зима', 'Winter');
  }
  if (parsed.season === 'ALL_SEASON') {
    tokens.push('Всесезон', 'All-Season');
  }
  if (parsed.tireTerrain === 'AT') {
    tokens.push('A/T', 'AT');
  }
  if (parsed.tireTerrain === 'MT') {
    tokens.push('M/T', 'MT');
  }
  if (parsed.isCType) {
    tokens.push('C', 'Вантажна C', 'Cargo');
  }
  if (parsed.freeText) {
    tokens.push(...splitTextTokens(parsed.freeText));
  }

  return unique(tokens).sort((left, right) => right.length - left.length);
};

const buildSuggestionCandidates = <T extends LotLike>(lots: T[]): string[] => {
  const lotCandidates = lots.flatMap((lot) => {
    const size = getLotSizeLabel(lot);
    const primary = getLotPrimaryLabel(lot);
    const year = lot.params?.production_year ? String(lot.params.production_year) : '';

    return [
      size,
      lot.brand ?? '',
      [size, lot.brand].filter(Boolean).join(' '),
      [lot.brand, lot.model].filter(Boolean).join(' '),
      [size, lot.brand, year].filter(Boolean).join(' '),
      primary,
      ...getLotTagLabels(lot),
    ];
  });

  return unique([
    '225/45 R17',
    'Новий',
    'Вживаний',
    'Зима',
    'Літо',
    'A/T',
    'M/T',
    'Вантажна C',
    ...lotCandidates,
  ]);
};

export const buildQuickSearchSuggestions = <T extends LotLike>(lots: T[]): string[] => {
  const candidates = buildSuggestionCandidates(lots);
  const prioritized = candidates.filter((candidate) => /\d{3}\/\d{2,3}\s?R\d{2}/i.test(candidate));
  const brands = candidates.filter((candidate) => candidate && !candidate.includes(' ') && !/\d/.test(candidate));

  return unique([
    ...prioritized.slice(0, 3),
    ...brands.slice(0, 3),
    'Новий',
    'Зима',
    'A/T',
    'Вантажна C',
  ]).slice(0, 6);
};

export const buildAutocompleteSuggestions = <T extends LotLike>(lots: T[], query: string): string[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return buildSuggestionCandidates(lots)
    .filter((candidate) => candidate.toLowerCase().includes(normalizedQuery))
    .sort((left, right) => {
      const leftStarts = left.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      const rightStarts = right.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
      if (leftStarts !== rightStarts) {
        return leftStarts - rightStarts;
      }

      return left.length - right.length;
    })
    .slice(0, 8);
};

const isBrandSuggestion = (value: string) => !/\d/.test(value) && !conditionSuggestions.has(value.toLowerCase());

export const buildSuggestionSections = (
  suggestions: string[],
  recentSearches: string[] = [],
  config: SearchSuggestionSectionsConfig = {},
): SearchSuggestionSection[] => {
  const {
    includeRecent = false,
    priorities = {},
    recentLimit = 5,
  } = config;
  const recent = includeRecent ? unique(recentSearches).slice(0, recentLimit) : [];
  const sizes = suggestions.filter((value) => sizePattern.test(value));
  const conditions = suggestions.filter((value) => conditionSuggestions.has(value.toLowerCase()));
  const brands = suggestions.filter((value) => !sizePattern.test(value) && isBrandSuggestion(value));

  const consumed = new Set([...recent, ...sizes, ...conditions, ...brands].map((value) => value.toLowerCase()));
  const other = suggestions.filter((value) => !consumed.has(value.toLowerCase()));

  const sectionMap: Record<SearchSuggestionSectionKey, SearchSuggestionSection | null> = {
    recent: includeRecent && recent.length > 0 ? { title: 'Останні запити', items: recent } : null,
    sizes: sizes.length > 0 ? { title: 'Розміри', items: sizes } : null,
    brands: brands.length > 0 ? { title: 'Бренди', items: brands } : null,
    conditions: conditions.length > 0 ? { title: 'Стани', items: conditions } : null,
    other: other.length > 0 ? { title: 'Інше', items: other } : null,
  };

  return (Object.keys(sectionMap) as SearchSuggestionSectionKey[])
    .sort((left, right) => {
      const leftPriority = priorities[left] ?? defaultSearchSuggestionSectionPriorities[left];
      const rightPriority = priorities[right] ?? defaultSearchSuggestionSectionPriorities[right];
      return leftPriority - rightPriority;
    })
    .map((key) => sectionMap[key])
    .filter(Boolean) as SearchSuggestionSection[];
};

const loadSearchesFromStorage = (storage: Storage | undefined, storageKey: string): string[] => {
  if (!storage) {
    return [];
  }

  try {
    const rawValue = storage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const saveSearchesToStorage = (storage: Storage | undefined, storageKey: string, values: string[]) => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(values));
  } catch {
    // Ignore storage errors and keep runtime state.
  }
};

export const loadRecentSearches = (config: RecentSearchConfig): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const persistent = loadSearchesFromStorage(window.localStorage, config.persistentKey).slice(0, config.persistentLimit);
  const session = loadSearchesFromStorage(window.sessionStorage, config.sessionKey).slice(0, config.sessionLimit);

  return unique([...session, ...persistent]);
};

export const saveRecentSearch = (config: RecentSearchConfig, value: string): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return loadRecentSearches(config);
  }

  const nextPersistent = unique([
    normalizedValue,
    ...loadSearchesFromStorage(window.localStorage, config.persistentKey),
  ]).slice(0, config.persistentLimit);
  const nextSession = unique([
    normalizedValue,
    ...loadSearchesFromStorage(window.sessionStorage, config.sessionKey),
  ]).slice(0, config.sessionLimit);

  saveSearchesToStorage(window.localStorage, config.persistentKey, nextPersistent);
  saveSearchesToStorage(window.sessionStorage, config.sessionKey, nextSession);

  return unique([...nextSession, ...nextPersistent]);
};

export const clearRecentSearches = (config: RecentSearchConfig): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    window.localStorage.removeItem(config.persistentKey);
    window.sessionStorage.removeItem(config.sessionKey);
  } catch {
    return [];
  }

  return [];
};
