export const formatMoney = (
  value: number,
  locale = 'uk-UA',
  options: Intl.NumberFormatOptions = {},
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
};
