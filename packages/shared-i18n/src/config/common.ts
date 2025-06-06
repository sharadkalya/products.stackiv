import en from '../locales/en.json';
import fr from '../locales/fr.json';

export const resources = {
    en: { translation: en },
    fr: { translation: fr },
};

export const i18nBaseConfig = {
    resources,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
};
