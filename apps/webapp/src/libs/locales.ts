import commonEn from '@/locales/en/common.json';

// TODO: Add more languages as needed
const locales = {
  en: {
    common: commonEn
  }
};

export function getLocale(locale: string = 'en') {
  return locales[locale as keyof typeof locales] || locales.en;
}

export function t(key: string, locale: string = 'en') {
  const translations = getLocale(locale);
  const keys = key.split('.');

  let value: unknown = translations;
  for (const k of keys) {
    if (typeof value !== 'object' || value === null || !(k in value)) {
      return key;
    }

    value = (value as Record<string, unknown>)[k];
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return key;
}
