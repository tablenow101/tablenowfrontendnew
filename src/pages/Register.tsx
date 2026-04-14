import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';

const t = {
    fr: {
        tagline: 'Votre Hotesse de Restaurant 24/7',
        createAccount: 'Creer votre compte',
        restaurantName: 'Nom du restaurant *',
        ownerName: 'Nom du proprietaire *',
        email: 'Email *',
        password: 'Mot de passe *',
        confirmPassword: 'Confirmer le mot de passe *',
        phone: 'Telephone',
        cuisineType: 'Type de cuisine',
        address: 'Adresse',
        website: 'Site web',
        creating: 'Creation du compte...',
        createBtn: 'Creer mon compte',
        hasAccount: 'Vous avez deja un compte ?',
        loginHere: 'Se connecter',
        regSuccess: 'Inscription reussie !',
        checkEmail: 'Veuillez verifier votre email pour activer votre compte. Un lien de verification a ete envoye a',
        redirecting: 'Redirection vers la connexion...',
        passwordsNoMatch: 'Les mots de passe ne correspondent pas',
        passwordMin: 'Le mot de passe doit contenir au moins 8 caracteres',
        regFailed: "L'inscription a echoue. Veuillez reessayer.",
        phRestaurant: 'Le Petit Bistrot',
        phOwner: 'Jean Dupont',
        phEmail: 'contact@restaurant.com',
        phPhone: '+33 1 23 45 67 89',
        phCuisine: 'Italienne, Francaise, etc.',
        phAddress: '123 Rue Principale, Ville',
        phWebsite: 'https://votre-restaurant.fr',
    },
    en: {
        tagline: 'Your Restaurant Hostess 24/7',
        createAccount: 'Create Your Account',
        restaurantName: 'Restaurant Name *',
        ownerName: 'Owner Name *',
        email: 'Email *',
        password: 'Password *',
        confirmPassword: 'Confirm Password *',
        phone: 'Phone',
        cuisineType: 'Cuisine Type',
        address: 'Address',
        website: 'Website',
        creating: 'Creating account...',
        createBtn: 'Create Account',
        hasAccount: 'Already have an account?',
        loginHere: 'Login here',
        regSuccess: 'Registration Successful!',
        checkEmail: "Please check your email to verify your account. We've sent a verification link to",
        redirecting: 'Redirecting to login...',
        passwordsNoMatch: 'Passwords do not match',
        passwordMin: 'Password must be at least 8 characters',
        regFailed: 'Registration failed. Please try again.',
        phRestaurant: 'The Grand Bistro',
        phOwner: 'John Doe',
        phEmail: 'contact@restaurant.com',
        phPhone: '+1 234 567 8900',
        phCuisine: 'Italian, French, etc.',
        phAddress: '123 Main St, City, Country',
        phWebsite: 'https://your-restaurant.com',
    },
};

function getInitialLang(): 'fr' | 'en' {
    const stored = localStorage.getItem('tn_lang');
    if (stored === 'fr' || stored === 'en') return stored;
    return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

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
    const navigate = useNavigate();

    const [lang, setLang] = useState<'fr' | 'en'>(getInitialLang);
    const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
    const s = t[lang];

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('tn_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('tn_lang', lang);
    }, [lang]);

    const toggleLang = () => setLang((l) => (l === 'fr' ? 'en' : 'fr'));
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
            setError(s.passwordsNoMatch);
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError(s.passwordMin);
            setLoading(false);
            return;
        }

        try {
            await register(formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || s.regFailed);
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
                        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">{s.regSuccess}</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {s.checkEmail}{' '}
                            <strong>{formData.email}</strong>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{s.redirecting}</p>
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
                    <button
                        onClick={toggleLang}
                        className="px-3 py-1.5 text-xs font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white transition-colors"
                    >
                        {lang === 'fr' ? 'EN' : 'FR'}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">TableNow</h1>
                    <p className="text-gray-600 dark:text-gray-400">{s.tagline}</p>
                </div>

                <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-white rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-black dark:bg-white text-white dark:text-black p-4 rounded-full">
                            <UserPlus size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-6 text-black dark:text-white">{s.createAccount}</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-500 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.restaurantName}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={s.phRestaurant}
                                        value={formData.restaurantName}
                                        onChange={(e) => handleRestaurantNameChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                        className="input w-full"
                                        autoComplete="off"
                                        required
                                    />
                                    {loadingSuggest && (
                                        <div className="absolute right-3 top-3 text-gray-400 text-xs">...</div>
                                    )}
                                    {showDropdown && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                            {suggestions.map((s) => (
                                                <li
                                                    key={s.placeId}
                                                    onMouseDown={() => handleSelectSuggestion(s.placeId, s.name)}
                                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                >
                                                    <span className="font-medium text-black dark:text-white">{s.name}</span>
                                                    <span className="text-gray-400 ml-2 text-xs">{s.address}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.ownerName}</label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder={s.phOwner}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.email}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder={s.phEmail}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.password}</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.confirmPassword}</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.phone}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder={s.phPhone}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.cuisineType}</label>
                                <input
                                    type="text"
                                    name="cuisineType"
                                    value={formData.cuisineType}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder={s.phCuisine}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.address}</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input"
                                placeholder={s.phAddress}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.website}</label>
                            <input
                                type="url"
                                placeholder={s.phWebsite}
                                value={formData.website || ''}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                onBlur={handleWebsiteBlur}
                                className="input w-full"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="loading mr-2"></span>
                                    {s.creating}
                                </span>
                            ) : (
                                s.createBtn
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            {s.hasAccount}{' '}
                            <Link to="/login" className="text-black dark:text-white font-semibold hover:underline">
                                {s.loginHere}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
