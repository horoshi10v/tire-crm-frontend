type DateTimePreset = 'short' | 'medium';

const presetMap: Record<DateTimePreset, Intl.DateTimeFormatOptions> = {
  short: {
    dateStyle: 'short',
    timeStyle: 'short',
  },
  medium: {
    dateStyle: 'medium',
    timeStyle: 'short',
  },
};

export const formatDateTime = (
  iso: string,
  preset: DateTimePreset = 'medium',
  locale = 'uk-UA',
): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(locale, presetMap[preset]).format(date);
};

export const formatShortDateTime = (iso: string, locale = 'uk-UA'): string => {
  return formatDateTime(iso, 'short', locale);
};

export const formatMediumDateTime = (iso: string, locale = 'uk-UA'): string => {
  return formatDateTime(iso, 'medium', locale);
};
