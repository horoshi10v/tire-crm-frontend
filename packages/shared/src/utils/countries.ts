import countries from 'i18n-iso-countries';
import ukLocale from 'i18n-iso-countries/langs/uk.json';

countries.registerLocale(ukLocale);

const rawCountryNames = Object.values(countries.getNames('uk'));

export const countryOptions = Array.from(
  new Set(rawCountryNames.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)),
).sort((left, right) => left.localeCompare(right, 'uk'));
