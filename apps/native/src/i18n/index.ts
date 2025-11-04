import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import translationEn from './locales/en.json';

const resources = {
  en: { translation: translationEn },
};

const initI18n = async () => {
  // let savedLanguage = await AsyncStorage.getItem('language'); @TODO
  let savedLanguage;

  if (!savedLanguage) {
    savedLanguage = getLocales()[0]?.languageCode;
  }

  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: savedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
