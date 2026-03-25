const slashTireSizePattern = /(\d{3})\s*\/\s*(\d{2,3})\s*r?\s*(\d{2})/i;
const tokenPattern = /[0-9A-Za-zА-Яа-яІіЇїЄєҐґ/.-]+/g;

type ParsedSearchHint = {
  width?: string;
  profile?: string;
  diameter?: string;
  condition?: 'NEW' | 'USED';
  season?: 'SUMMER' | 'WINTER' | 'ALL_SEASON';
  freeText?: string;
};

const isDigits = (value: string) => /^\d+$/.test(value);

export const parseCatalogSearchHint = (value: string): ParsedSearchHint => {
  const parsed: ParsedSearchHint = {};
  let remaining = value.trim();

  const slashMatch = remaining.match(slashTireSizePattern);
  if (slashMatch) {
    parsed.width = slashMatch[1];
    parsed.profile = slashMatch[2];
    parsed.diameter = slashMatch[3];
    remaining = remaining.replace(slashTireSizePattern, ' ').trim();
  }

  const tokens = remaining.match(tokenPattern) ?? [];
  const freeTokens: string[] = [];
  const numberTokens: string[] = [];

  for (const token of tokens) {
    const normalized = token.trim().toLowerCase();

    if (normalized === 'new' || normalized.startsWith('нов')) {
      parsed.condition = 'NEW';
      continue;
    }
    if (normalized === 'used' || normalized.startsWith('вжив')) {
      parsed.condition = 'USED';
      continue;
    }
    if (normalized === 'summer' || normalized === 'літо') {
      parsed.season = 'SUMMER';
      continue;
    }
    if (normalized === 'winter' || normalized === 'зима') {
      parsed.season = 'WINTER';
      continue;
    }
    if (normalized === 'all-season' || normalized === 'allseason' || normalized === 'all' || normalized.startsWith('всесез')) {
      parsed.season = 'ALL_SEASON';
      continue;
    }
    if (normalized.startsWith('r') && normalized.length > 1 && isDigits(normalized.slice(1))) {
      if (!parsed.diameter) {
        parsed.diameter = normalized.slice(1);
        continue;
      }
    }
    if (isDigits(normalized)) {
      numberTokens.push(normalized);
      continue;
    }

    freeTokens.push(token);
  }

  if (!parsed.width && !parsed.profile && !parsed.diameter && numberTokens.length >= 3) {
    parsed.width = numberTokens[0];
    parsed.profile = numberTokens[1];
    parsed.diameter = numberTokens[2];
    numberTokens.splice(0, 3);
  } else if (!parsed.width && !parsed.profile && parsed.diameter && numberTokens.length >= 2) {
    parsed.width = numberTokens[0];
    parsed.profile = numberTokens[1];
    numberTokens.splice(0, 2);
  }

  parsed.freeText = [...freeTokens, ...numberTokens].join(' ').trim();
  return parsed;
};

export const buildCatalogSearchHintChips = (value: string): string[] => {
  const parsed = parseCatalogSearchHint(value);
  const chips: string[] = [];

  if (parsed.width && parsed.profile && parsed.diameter) {
    chips.push(`Розмір: ${parsed.width}/${parsed.profile} R${parsed.diameter}`);
  }
  if (parsed.condition === 'NEW') {
    chips.push('Стан: Новий');
  }
  if (parsed.condition === 'USED') {
    chips.push('Стан: Вживаний');
  }
  if (parsed.season === 'SUMMER') {
    chips.push('Сезон: Літо');
  }
  if (parsed.season === 'WINTER') {
    chips.push('Сезон: Зима');
  }
  if (parsed.season === 'ALL_SEASON') {
    chips.push('Сезон: Всесезон');
  }
  if (parsed.freeText) {
    chips.push(`Текст: ${parsed.freeText}`);
  }

  return chips;
};
