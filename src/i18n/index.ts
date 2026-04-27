/**
 * Configuration i18next pour TableNow.
 *
 * - Détection automatique de la langue navigateur au premier visit
 * - Persistance dans localStorage (clé `tn_lang`, compatible avec l'existant)
 * - Fallback FR
 * - Sync avec backend (PATCH /api/restaurants/me/language) géré côté
 *   AuthContext.setLanguage — pas ici, pour ne pas coupler i18n et API.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fr: { translation: fr },
            en: { translation: en },
        },
        fallbackLng: 'fr',
        supportedLngs: ['fr', 'en'],
        load: 'languageOnly',
        nonExplicitSupportedLngs: true,
        interpolation: { escapeValue: false }, // React échappe déjà
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'tn_lang',
            caches: ['localStorage'],
        },
    });

export default i18n;

export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function isSupportedLanguage(lang: unknown): lang is SupportedLanguage {
    return lang === 'fr' || lang === 'en';
}
