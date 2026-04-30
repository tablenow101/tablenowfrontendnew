import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg3)',
    border: '1px solid var(--line2)',
    borderRadius: 'var(--r6)',
    padding: '7px 10px',
    color: 'var(--t1)',
    fontSize: '12px',
    outline: 'none',
    display: 'block',
    transition: 'border-color 150ms',
};

const Login: React.FC = () => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Identifiants incorrects. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg0)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
        }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                <LanguageToggle variant="light" />
            </div>

            <div style={{ width: '100%', maxWidth: '310px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--t1)' }}>
                        Table<span style={{ color: 'var(--acc)' }}>Now</span>
                    </span>
                </div>

                {/* Card */}
                <div style={{
                    background: 'var(--bg1)',
                    border: '1px solid var(--line)',
                    borderTop: '2px solid var(--acc)',
                    borderRadius: '10px',
                    padding: '28px 24px',
                }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: 300,
                        letterSpacing: '-0.3px',
                        color: 'var(--t1)',
                        margin: '0 0 22px',
                    }}>
                        Connexion
                    </h2>

                    {error && (
                        <div style={{
                            marginBottom: '14px',
                            padding: '8px 10px',
                            background: 'var(--red2)',
                            border: '1px solid rgba(224,90,90,0.25)',
                            borderRadius: 'var(--r6)',
                            color: 'var(--red)',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                        }}>
                            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>
                                E-mail
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                required
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                            />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                            />
                        </div>

                        {/* Remember + Forgot */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px',
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                color: 'var(--t2)',
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={e => setRemember(e.target.checked)}
                                    style={{ width: '12px', height: '12px', padding: 0, flexShrink: 0, cursor: 'pointer' }}
                                />
                                Se souvenir de moi
                            </label>
                            <Link
                                to="/forgot-password"
                                style={{ fontSize: '11px', color: 'var(--acc)', textDecoration: 'none' }}
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: 'var(--acc)',
                                color: '#0c0c0c',
                                border: 'none',
                                borderRadius: 'var(--r6)',
                                padding: '8px 16px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                marginBottom: '16px',
                                textAlign: 'center',
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '12px', height: '12px',
                                        border: '1.5px solid rgba(12,12,12,0.3)',
                                        borderTopColor: '#0c0c0c',
                                        borderRadius: '50%',
                                        animation: 'tn-spin 0.7s linear infinite',
                                    }} />
                                    Connexion...
                                </>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    {/* Separator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--line2)' }} />
                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>ou</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--line2)' }} />
                    </div>

                    {/* Google OAuth */}
                    <button
                        type="button"
                        style={{
                            width: '100%',
                            background: 'var(--bg3)',
                            border: '1px solid var(--line2)',
                            borderRadius: 'var(--r6)',
                            padding: '8px 16px',
                            fontSize: '11px',
                            color: 'var(--t1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '20px',
                            textAlign: 'center',
                        }}
                    >
                        <GoogleIcon />
                        Continuer avec Google
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--t2)', margin: 0 }}>
                        Pas de compte ?{' '}
                        <Link to="/register" style={{ color: 'var(--acc)', textDecoration: 'none', fontWeight: 500 }}>
                            Créer un accès
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
