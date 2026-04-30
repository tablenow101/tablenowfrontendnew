import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { isSupportedLanguage } from '../i18n';
import { AlertCircle, CheckCircle } from 'lucide-react';

const GoogleIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const inputSt: React.CSSProperties = {
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

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
    <p style={{
        fontSize: '9px',
        fontWeight: 700,
        color: 'var(--t3)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '12px',
        marginTop: '20px',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--line)',
    }}>
        {label}
    </p>
);

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

    const [suggestions, setSuggestions]       = useState<any[]>([]);
    const [showDropdown, setShowDropdown]     = useState(false);
    const [loadingSuggest, setLoadingSuggest] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function handleRestaurantNameChange(value: string) {
        setFormData(prev => ({ ...prev, restaurantName: value }));
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
        setFormData(prev => ({ ...prev, restaurantName: name }));
        setShowDropdown(false);
        setSuggestions([]);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/restaurants/prefill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id: placeId }),
            });
            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                restaurantName: data.name     || prev.restaurantName,
                phone:          data.phone    || prev.phone,
                address:        data.address  || prev.address,
                website:        data.website  || prev.website,
                cuisineType:    data.cuisine_type || prev.cuisineType,
            }));
        } catch { /* silent */ }
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
            setFormData(prev => ({
                ...prev,
                restaurantName: prev.restaurantName || data.name         || '',
                phone:          prev.phone          || data.phone        || '',
                address:        prev.address        || data.address      || '',
                cuisineType:    prev.cuisineType    || data.cuisine_type || '',
            }));
        } catch { /* silent */ }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

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
            const language = isSupportedLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'fr';
            await register({ ...formData, language });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.register.failed'));
        } finally {
            setLoading(false);
        }
    };

    /* ── Success screen ───────────────────────────────────────────────────── */
    if (success) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
                <div style={{ maxWidth: '360px', width: '100%', textAlign: 'center' }}>
                    <div style={{
                        background: 'var(--bg1)',
                        border: '1px solid var(--line)',
                        borderTop: '2px solid var(--acc)',
                        borderRadius: '10px',
                        padding: '36px 28px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <CheckCircle size={40} style={{ color: 'var(--acc)' }} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 300, color: 'var(--t1)', marginBottom: '12px' }}>{t('auth.register.success')}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                            {t('auth.register.checkEmail')} <strong style={{ color: 'var(--t1)' }}>{formData.email}</strong>
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '12px' }}>{t('auth.register.redirecting')}</p>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main form ──────────────────────────────────────────────────────── */
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

            <div style={{ width: '100%', maxWidth: '480px' }}>
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
                    <h2 style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '-0.3px', color: 'var(--t1)', margin: '0 0 4px' }}>
                        Créer un accès
                    </h2>
                    <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '4px' }}>
                        Rejoignez TableNow — configuration en 2 minutes
                    </p>

                    {error && (
                        <div style={{
                            marginTop: '14px',
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

                        {/* ── Section Accès ── */}
                        <SectionLabel label="Accès" />

                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>E-mail *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange}
                                placeholder="contact@votre-restaurant.fr" required style={inputSt}
                                onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>Mot de passe *</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange}
                                    placeholder="••••••••" required style={inputSt}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>Confirmer *</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                    placeholder="••••••••" required style={inputSt}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                                />
                            </div>
                        </div>

                        {/* ── Section Restaurant ── */}
                        <SectionLabel label="Restaurant" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>Nom du restaurant *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={formData.restaurantName}
                                        onChange={e => handleRestaurantNameChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                        placeholder="Le Petit Bistrot"
                                        required
                                        autoComplete="off"
                                        style={{ ...inputSt, paddingRight: loadingSuggest ? '28px' : '10px' }}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                    />
                                    {loadingSuggest && (
                                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--t3)' }}>…</span>
                                    )}
                                    {showDropdown && suggestions.length > 0 && (
                                        <ul style={{
                                            position: 'absolute', zIndex: 50, width: '100%',
                                            background: 'var(--bg2)', border: '1px solid var(--line2)',
                                            borderRadius: 'var(--r8)', marginTop: '4px',
                                            maxHeight: '200px', overflowY: 'auto', listStyle: 'none',
                                            padding: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                        }}>
                                            {suggestions.map(sug => (
                                                <li
                                                    key={sug.placeId}
                                                    onMouseDown={() => handleSelectSuggestion(sug.placeId, sug.name)}
                                                    style={{
                                                        padding: '9px 12px', cursor: 'pointer',
                                                        borderBottom: '1px solid var(--line)',
                                                        fontSize: '12px',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <span style={{ fontWeight: 500, color: 'var(--t1)' }}>{sug.name}</span>
                                                    <span style={{ color: 'var(--t3)', marginLeft: '6px', fontSize: '11px' }}>{sug.address}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>Responsable *</label>
                                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange}
                                    placeholder="Jean Dupont" required style={inputSt}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>Téléphone</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    placeholder="+33 1 23 45 67 89" style={inputSt}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>Type de cuisine</label>
                                <input type="text" name="cuisineType" value={formData.cuisineType} onChange={handleChange}
                                    placeholder="Française, Italienne…" style={inputSt}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                    onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>Adresse</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange}
                                placeholder="123 Rue Principale, 75001 Paris" style={inputSt}
                                onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--line2)')}
                            />
                        </div>

                        {/* ── Section Optionnel ── */}
                        <SectionLabel label="Optionnel" />

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--t3)', marginBottom: '5px' }}>
                                Site web
                                <span style={{ color: 'var(--t4)', marginLeft: '4px' }}>(pour pré-remplir automatiquement)</span>
                            </label>
                            <input
                                type="url"
                                placeholder="https://votre-restaurant.fr"
                                value={formData.website || ''}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                onBlur={handleWebsiteBlur}
                                style={inputSt}
                                onFocus={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: 'var(--acc)',
                                color: '#0c0c0c',
                                border: 'none',
                                borderRadius: 'var(--r6)',
                                padding: '9px 16px',
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
                                    Création en cours...
                                </>
                            ) : 'Créer mon espace restaurant'}
                        </button>
                    </form>

                    {/* Separator + Google */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--line2)' }} />
                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>ou</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--line2)' }} />
                    </div>

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
                        Déjà un compte ?{' '}
                        <Link to="/login" style={{ color: 'var(--acc)', textDecoration: 'none', fontWeight: 500 }}>
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
