// packages/shared-i18n/src/server.ts
import { createInstance } from 'i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
    en: { translation: en },
    fr: { translation: fr },
};

export async function getServerTranslation(lang: 'en' | 'fr') {
    const i18n = createInstance();
    await i18n.init({
        lng: lang,
        fallbackLng: 'en',
        resources,
        interpolation: { escapeValue: false },
    });
    return i18n.getFixedT(lang);
}
