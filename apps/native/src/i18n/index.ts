import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import translationEn from './locales/en.json';
import translationPl from './locales/pl.json';

export const SUPPORTED_LANGUAGES = ['en', 'pl'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

export const resolveAppLanguage = (language?: string | null): AppLanguage => {
  const normalized = language?.toLowerCase().split(/[-_]/)[0];

  return SUPPORTED_LANGUAGES.includes(normalized as AppLanguage) ? (normalized as AppLanguage) : DEFAULT_LANGUAGE;
};

const resources = {
  en: { translation: translationEn },
  pl: { translation: translationPl },
};

const initI18n = async () => {
  // let savedLanguage = await AsyncStorage.getItem('language'); @TODO
  let savedLanguage: AppLanguage | undefined;

  if (!savedLanguage) {
    const locale = getLocales()[0];
    savedLanguage = resolveAppLanguage(locale?.languageCode ?? locale?.languageTag);
  }

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
