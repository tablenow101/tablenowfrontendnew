import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Sun, Moon } from 'lucide-react';

const t = {
    fr: {
        tagline: 'Votre Hotesse de Restaurant 24/7',
        welcomeBack: 'Bon Retour',
        email: 'Email',
        password: 'Mot de passe',
        loggingIn: 'Connexion...',
        loginBtn: 'Se connecter',
        noAccount: "Vous n'avez pas de compte ?",
        registerHere: "S'inscrire ici",
        loginFailed: 'Connexion echouee. Veuillez reessayer.',
    },
    en: {
        tagline: 'Your Restaurant Hostess 24/7',
        welcomeBack: 'Welcome Back',
        email: 'Email',
        password: 'Password',
        loggingIn: 'Logging in...',
        loginBtn: 'Login',
        noAccount: "Don't have an account?",
        registerHere: 'Register here',
        loginFailed: 'Login failed. Please try again.',
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

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || s.loginFailed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
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
                            <LogIn size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-6 text-black dark:text-white">{s.welcomeBack}</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-500 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.email}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-black dark:text-white">{s.password}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
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
                                    {s.loggingIn}
                                </span>
                            ) : (
                                s.loginBtn
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            {s.noAccount}{' '}
                            <Link to="/register" className="text-black dark:text-white font-semibold hover:underline">
                                {s.registerHere}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
