import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { i18nBaseConfig } from "./common";

export const initI18nWeb = () => {
    if (!i18n.isInitialized) {
        return i18n
            .use(HttpBackend)
            .use(LanguageDetector)
            .use(initReactI18next)
            .init({
                ...i18nBaseConfig,
                detection: {
                    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
                    caches: ['localStorage', 'cookie'],
                },
            });
    }
    return Promise.resolve(i18n);
};
