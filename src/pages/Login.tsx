import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Sun, Moon } from 'lucide-react';

const t = {
    fr: {
        tagline: 'Votre Hôtesse de Restaurant 24/7',
        welcomeBack: 'Bon retour',
        email: 'Email',
        password: 'Mot de passe',
        loggingIn: 'Connexion...',
        loginBtn: 'Se connecter',
        noAccount: "Vous n'avez pas de compte ?",
        registerHere: "S'inscrire ici",
        loginFailed: 'Connexion échouée. Veuillez réessayer.',
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
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [lang, setLang]   = useState<'fr' | 'en'>(getInitialLang);
    const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
    const s = t[lang];

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('tn_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('tn_lang', lang);
    }, [lang]);

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
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
            style={{ background: 'var(--bg-page)' }}>

            <div className="w-full max-w-sm">

                {/* Toggles */}
                <div className="flex justify-end gap-2 mb-6">
                    <button
                        onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-primary)', background: 'transparent' }}
                    >
                        {lang === 'fr' ? 'EN' : 'FR'}
                    </button>
                    <button
                        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                        className="p-1.5 rounded-full border transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-primary)', background: 'transparent' }}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>TableNow</h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{s.tagline}</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-6 sm:p-8"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>

                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        <div className="p-4 rounded-full" style={{ background: 'var(--icon-circle-bg)', color: 'var(--icon-circle-fg)' }}>
                            <LogIn size={28} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>
                        {s.welcomeBack}
                    </h2>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 p-3.5 rounded-lg flex items-start gap-2.5 text-sm"
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #EF4444', color: 'var(--text-error)' }}>
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                {s.email}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className="w-full h-12 px-4 rounded-xl text-sm"
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-input)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--border-input-focus)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                {s.password}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full h-12 px-4 rounded-xl text-sm"
                                style={{
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-input)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--border-input-focus)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            style={{
                                background: 'var(--btn-primary-bg)',
                                color: 'var(--btn-primary-fg)',
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                                    {s.loggingIn}
                                </>
                            ) : s.loginBtn}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {s.noAccount}{' '}
                        <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
                            {s.registerHere}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
