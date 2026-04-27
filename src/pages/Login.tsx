import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { LogIn, AlertCircle, Sun, Moon } from 'lucide-react';

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
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('tn_theme', theme);
    }, [theme]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.login.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
            style={{ background: 'var(--bg-page)' }}>

            <div className="w-full max-w-md">

                {/* Toggles */}
                <div className="flex justify-end gap-2 mb-6">
                    <LanguageToggle variant="light" />
                    <button
                        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                        className="p-1.5 rounded-full border transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-primary)', background: 'transparent' }}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('common.appName')}</h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{t('common.tagline')}</p>
                </div>

                {/* Card */}
                <div className="rounded-3xl p-8 sm:p-10"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>

                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        <div className="p-5 rounded-full" style={{ background: 'var(--icon-circle-bg)', color: 'var(--icon-circle-fg)' }}>
                            <LogIn size={32} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
                        {t('auth.login.welcomeBack')}
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
                                {t('auth.login.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className="w-full h-14 px-4 rounded-xl text-sm"
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
                                {t('auth.login.password')}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full h-14 px-4 rounded-xl text-sm"
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
                            className="w-full h-14 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
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
                                    {t('auth.login.submitting')}
                                </>
                            ) : t('auth.login.submit')}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {t('auth.login.noAccount')}{' '}
                        <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
                            {t('auth.login.registerHere')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
