import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { isSupportedLanguage } from '../i18n';
import { UserPlus, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';

function getInitialTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem('tn_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        restaurantName: '',
        ownerName: '',
        phone: '',
        address: '',
        website: '',
        cuisineType: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('tn_theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

    // Autocomplete state
    const [suggestions, setSuggestions]     = useState<any[]>([]);
    const [showDropdown, setShowDropdown]   = useState(false);
    const [loadingSuggest, setLoadingSuggest] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function handleRestaurantNameChange(value: string) {
        setFormData((prev) => ({ ...prev, restaurantName: value }));
        setShowDropdown(false);

        if (value.length < 2) { setSuggestions([]); return; }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoadingSuggest(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/restaurants/autocomplete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: value }),
                });
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setShowDropdown(true);
            } catch { setSuggestions([]); }
            finally { setLoadingSuggest(false); }
        }, 300);
    }

    async function handleSelectSuggestion(placeId: string, name: string) {
        setFormData((prev) => ({ ...prev, restaurantName: name }));
        setShowDropdown(false);
        setSuggestions([]);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/restaurants/prefill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id: placeId }),
            });
            const data = await res.json();
            setFormData((prev) => ({
                ...prev,
                restaurantName: data.name  || prev.restaurantName,
                phone:          data.phone || prev.phone,
                address:        data.address || prev.address,
                website:        data.website || prev.website,
                cuisineType:    data.cuisine_type || prev.cuisineType,
            }));
        } catch { /* silent — user can fill manually */ }
    }

    async function handleWebsiteBlur() {
        if (!formData.website || formData.website.length < 5) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/restaurants/prefill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ website_url: formData.website }),
            });
            const data = await res.json();
            setFormData((prev) => ({
                ...prev,
                restaurantName: prev.restaurantName || data.name || '',
                phone:          prev.phone || data.phone || '',
                address:        prev.address || data.address || '',
                cuisineType:    prev.cuisineType || data.cuisine_type || '',
            }));
        } catch { /* silent */ }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.register.passwordsNoMatch'));
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError(t('auth.register.passwordMin'));
            setLoading(false);
            return;
        }

        try {
            // Capture la langue choisie au register pour qu'elle soit
            // persistée côté restaurants.language en DB.
            const language = isSupportedLanguage(i18n.resolvedLanguage)
                ? i18n.resolvedLanguage
                : 'fr';
            await register({ ...formData, language });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.register.failed'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-green-50 dark:bg-green-900/30 border-4 border-green-500 rounded-2xl p-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-500 text-white p-4 rounded-full">
                                <CheckCircle size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">{t('auth.register.success')}</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {t('auth.register.checkEmail')}{' '}
                            <strong>{formData.email}</strong>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('auth.register.redirecting')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                {/* Toggles */}
                <div className="flex justify-end gap-2 mb-4">
                    <LanguageToggle variant="light" />
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">{t('common.appName')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('common.tagline')}</p>
                </div>

                <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-black dark:bg-white text-white dark:text-black p-4 rounded-full">
                            <UserPlus size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-6 text-black dark:text-white">{t('auth.register.title')}</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-500 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.restaurantName')}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t('auth.register.phRestaurant')}
                                        value={formData.restaurantName}
                                        onChange={(e) => handleRestaurantNameChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                        className="input h-11 w-full"
                                        autoComplete="off"
                                        required
                                    />
                                    {loadingSuggest && (
                                        <div className="absolute right-3 top-3 text-gray-400 text-xs">...</div>
                                    )}
                                    {showDropdown && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                            {suggestions.map((sug) => (
                                                <li
                                                    key={sug.placeId}
                                                    onMouseDown={() => handleSelectSuggestion(sug.placeId, sug.name)}
                                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                >
                                                    <span className="font-medium text-black dark:text-white">{sug.name}</span>
                                                    <span className="text-gray-400 ml-2 text-xs">{sug.address}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.ownerName')}</label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="input h-11"
                                    placeholder={t('auth.register.phOwner')}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.email')}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input h-11"
                                placeholder={t('auth.register.phEmail')}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.password')}</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input h-11"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.confirmPassword')}</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="input h-11"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.phone')}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input h-11"
                                    placeholder={t('auth.register.phPhone')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.cuisineType')}</label>
                                <input
                                    type="text"
                                    name="cuisineType"
                                    value={formData.cuisineType}
                                    onChange={handleChange}
                                    className="input h-11"
                                    placeholder={t('auth.register.phCuisine')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.address')}</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input h-11"
                                placeholder={t('auth.register.phAddress')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{t('auth.register.website')}</label>
                            <input
                                type="url"
                                placeholder={t('auth.register.phWebsite')}
                                value={formData.website || ''}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                onBlur={handleWebsiteBlur}
                                className="input h-11 w-full"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full h-12"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="loading mr-2"></span>
                                    {t('auth.register.submitting')}
                                </span>
                            ) : (
                                t('auth.register.submit')
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t('auth.register.hasAccount')}{' '}
                            <Link to="/login" className="text-black dark:text-white font-semibold hover:underline">
                                {t('auth.register.loginHere')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
