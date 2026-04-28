/**
 * Toggle FR/EN avec drapeaux. Style transparent pour s'intégrer dans
 * n'importe quel header — utilisé dans Layout (post-login) et dans
 * Login/Register (avant-login).
 *
 * Persistence : i18next-browser-languagedetector écrit déjà dans
 * localStorage (clé `tn_lang`). Si l'utilisateur est connecté,
 * AuthContext.setLanguage propage aussi la valeur au backend.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { isSupportedLanguage, SupportedLanguage } from '../i18n';

interface Props {
    /** Variante visuelle. `light` : fond transparent, `chip` : pill arrondie. */
    variant?: 'light' | 'chip';
    className?: string;
}

const LanguageToggle: React.FC<Props> = ({ variant = 'chip', className = '' }) => {
    const { i18n } = useTranslation();
    const auth = useAuthSafe();
    const currentLang: SupportedLanguage = isSupportedLanguage(i18n.resolvedLanguage)
        ? i18n.resolvedLanguage
        : 'fr';

    const handleSelect = async (lang: SupportedLanguage) => {
        if (lang === currentLang) return;
        await i18n.changeLanguage(lang);
        // Sync avec le backend si l'utilisateur est connecté.
        if (auth?.user && auth.setLanguage) {
            try { await auth.setLanguage(lang); } catch { /* non-bloquant */ }
        }
    };

    const baseBtn = 'px-2.5 py-1 text-xs font-semibold rounded-full transition-colors';
    const activeCls   = variant === 'chip'
        ? 'bg-white/15 text-white'
        : 'bg-black/10 text-black';
    const inactiveCls = variant === 'chip'
        ? 'text-gray-400 hover:text-white'
        : 'text-gray-600 hover:text-black';
    // La bordure doit suivre le fond : transparente claire sur sombre,
    // transparente sombre sur clair — sinon le conteneur est invisible.
    const borderCls = variant === 'chip' ? 'border-white/10' : 'border-black/10';

    return (
        <div className={`inline-flex items-center gap-1 rounded-full border ${borderCls} p-0.5 ${className}`}
             role="group" aria-label="Language selector">
            <button
                type="button"
                onClick={() => handleSelect('fr')}
                aria-pressed={currentLang === 'fr'}
                aria-label="Français"
                className={`${baseBtn} ${currentLang === 'fr' ? activeCls : inactiveCls}`}
            >
                <span aria-hidden="true">🇫🇷</span> FR
            </button>
            <button
                type="button"
                onClick={() => handleSelect('en')}
                aria-pressed={currentLang === 'en'}
                aria-label="English"
                className={`${baseBtn} ${currentLang === 'en' ? activeCls : inactiveCls}`}
            >
                <span aria-hidden="true">🇬🇧</span> EN
            </button>
        </div>
    );
};

/** useAuth qui ne crash pas hors AuthProvider (utilisé côté Login/Register). */
function useAuthSafe(): ReturnType<typeof useAuth> | null {
    try { return useAuth(); } catch { return null; }
}

export default LanguageToggle;
