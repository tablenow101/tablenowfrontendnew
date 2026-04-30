import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../lib/api';
import {
    Store, Clock, Mail, ClipboardList,
    ChevronRight, ChevronLeft, Save, Copy, Check, Rocket,
} from 'lucide-react';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DEFAULT_HOURS: Record<string, { open: boolean; from: string; to: string }> = {
    monday:    { open: true,  from: '12:00', to: '22:30' },
    tuesday:   { open: true,  from: '12:00', to: '22:30' },
    wednesday: { open: true,  from: '12:00', to: '22:30' },
    thursday:  { open: true,  from: '12:00', to: '22:30' },
    friday:    { open: true,  from: '12:00', to: '23:00' },
    saturday:  { open: true,  from: '12:00', to: '23:00' },
    sunday:    { open: false, from: '12:00', to: '22:00' },
};

const DEFAULT_SERVICES = {
    lunch:  { active: true,  from: '12:00', to: '14:30', capacity: 20 },
    dinner: { active: true,  from: '19:00', to: '22:30', capacity: 20 },
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            style={{
                position: 'relative', flexShrink: 0,
                width: '44px', height: '24px',
                borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: on ? 'var(--acc)' : 'var(--bg5)',
                transition: 'background 0.15s',
            }}
        >
            <span style={{
                position: 'absolute', top: '2px',
                left: on ? '22px' : '2px',
                width: '20px', height: '20px',
                borderRadius: '50%', background: on ? '#0c0c0c' : 'var(--t2)',
                transition: 'left 0.15s',
            }} />
        </button>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            {children}
        </p>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    borderRadius: '8px', fontSize: '13px',
    background: 'var(--bg3)', border: '1px solid var(--line2)',
    color: 'var(--t1)', outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
};

const timeInputStyle: React.CSSProperties = {
    width: '100%', height: '40px', padding: '0 10px',
    textAlign: 'center', borderRadius: '8px', fontSize: '13px',
    background: 'var(--bg3)', border: '1px solid var(--line2)',
    color: 'var(--t1)', outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
};

const Onboarding: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const navigate   = useNavigate();
    const [step, setStep]       = useState(0);
    const [saving, setSaving]   = useState(false);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied]   = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const STEPS = [
        { icon: Store,         label: t('onboarding.stepRestaurant') },
        { icon: Clock,         label: t('onboarding.stepHours')      },
        { icon: Mail,          label: t('onboarding.stepEmail')      },
        { icon: ClipboardList, label: t('onboarding.stepRecap')      },
    ];

    const [info, setInfo] = useState({ name: '', address: '', phone: '', cuisine_type: '' });
    const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
    const [totalCapacity, setTotalCapacity] = useState(50);
    const [services, setServices] = useState(DEFAULT_SERVICES);
    const [confirmationEmail, setConfirmationEmail] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await settingsAPI.get();
                const s = res.data.settings;
                setInfo({ name: s.name || '', address: s.address || '', phone: s.phone || '', cuisine_type: s.cuisine_type || '' });
                if (s.opening_hours && Object.keys(s.opening_hours).length > 0) setHours(s.opening_hours);
                if (s.services     && Object.keys(s.services).length     > 0) setServices(s.services);
                if (s.capacity)           setTotalCapacity(s.capacity);
                if (s.confirmation_email) setConfirmationEmail(s.confirmation_email);
                else if (s.email)         setConfirmationEmail(s.email);
            } catch {}
            setLoading(false);
        })();
    }, []);

    async function saveStep(data: Record<string, any>) {
        setSaving(true);
        setSaveError(null);
        try {
            await settingsAPI.update(data);
            await refreshUser();
        } catch {
            setSaveError(t('common.saveError'));
        }
        setSaving(false);
    }

    async function nextStep() {
        if (step === 0) await saveStep(info);
        if (step === 1) await saveStep({ opening_hours: hours, capacity: totalCapacity, services });
        // Step 2: save email + mark onboarding complete
        if (step === 2) await saveStep({ confirmation_email: confirmationEmail, setup_complete: true });
        setStep(s => Math.min(s + 1, 3));
    }

    function copyBcc() {
        if (user?.bcc_email) {
            navigator.clipboard.writeText(user.bcc_email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
            <div style={{ width: '100%', maxWidth: '560px' }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.3px' }}>
                        Table<span style={{ color: 'var(--acc)' }}>Now</span>
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '4px' }}>{t('onboarding.title')}</p>
                </div>

                {/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '32px', padding: '0 8px' }}>
                    {STEPS.map((s, i) => {
                        const Icon   = s.icon;
                        const active = i === step;
                        const done   = i < step;
                        return (
                            <React.Fragment key={s.label}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        background: done ? 'var(--acc)' : active ? 'var(--t1)' : 'var(--bg3)',
                                        color: done ? '#0c0c0c' : active ? '#0c0c0c' : 'var(--t3)',
                                        transition: 'all 0.15s',
                                    }}>
                                        {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
                                    </div>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 500, textAlign: 'center',
                                        lineHeight: 1.3, maxWidth: '60px',
                                        color: active ? 'var(--t1)' : 'var(--t3)',
                                    }}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        flex: 1, height: '1px',
                                        margin: '20px 8px 0',
                                        background: i < step ? 'var(--acc)' : 'var(--line2)',
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>

                    {saveError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--red2)', borderBottom: '1px solid rgba(224,90,90,0.2)', color: 'var(--red)', fontSize: '13px' }}>
                            ⚠ {saveError}
                        </div>
                    )}

                    <div style={{ padding: '28px 24px' }}>

                        {/* Step 0: Restaurant */}
                        {step === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--t1)', marginBottom: '4px' }}>
                                    <Store size={16} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                                    {t('onboarding.restaurantInfo')}
                                </h2>
                                <div>
                                    <FieldLabel>{t('onboarding.restaurantName')}</FieldLabel>
                                    <input style={inputStyle} value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder={t('onboarding.phRestaurantName')} />
                                </div>
                                <div>
                                    <FieldLabel>{t('onboarding.address')}</FieldLabel>
                                    <input style={inputStyle} value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder={t('onboarding.phAddress')} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <FieldLabel>{t('onboarding.phone')}</FieldLabel>
                                        <input style={inputStyle} type="tel" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} placeholder={t('onboarding.phPhone')} />
                                    </div>
                                    <div>
                                        <FieldLabel>{t('onboarding.cuisineType')}</FieldLabel>
                                        <input style={inputStyle} value={info.cuisine_type} onChange={e => setInfo({ ...info, cuisine_type: e.target.value })} placeholder={t('onboarding.phCuisine')} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Horaires & Services */}
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>
                                        <Clock size={16} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                                        {t('onboarding.scheduleAndServices')}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>{t('onboarding.totalCapacity')}</span>
                                        <input
                                            type="number" min={1}
                                            style={{ width: '56px', height: '32px', padding: '0 8px', textAlign: 'center', borderRadius: '6px', fontSize: '13px', background: 'var(--bg3)', border: '1px solid var(--line2)', color: 'var(--t1)', outline: 'none', fontFamily: 'inherit' }}
                                            value={totalCapacity}
                                            onChange={e => setTotalCapacity(parseInt(e.target.value) || 0)}
                                        />
                                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>{t('onboarding.covers')}</span>
                                    </div>
                                </div>

                                {/* Jours */}
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>{t('onboarding.openingDays')}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {DAY_KEYS.map((key) => {
                                            const day = hours[key] || { open: false, from: '12:00', to: '22:00' };
                                            return (
                                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <Toggle on={day.open} onToggle={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })} />
                                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px', width: '90px', flexShrink: 0, whiteSpace: 'nowrap', color: day.open ? 'var(--t1)' : 'var(--t3)' }}>
                                                        {t(`days.${key}`)}
                                                    </span>
                                                    {day.open ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                            <input type="time" style={{ ...timeInputStyle, flex: 1 }} value={day.from} onChange={e => setHours({ ...hours, [key]: { ...day, from: e.target.value } })} />
                                                            <span style={{ color: 'var(--t3)', fontSize: '11px' }}>→</span>
                                                            <input type="time" style={{ ...timeInputStyle, flex: 1 }} value={day.to} onChange={e => setHours({ ...hours, [key]: { ...day, to: e.target.value } })} />
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic', flexShrink: 0 }}>{t('onboarding.closed')}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--line)' }} />

                                {/* Services */}
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>{t('onboarding.servicesAndCovers')}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {/* Lunch */}
                                        <div style={{ borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--line2)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Toggle on={services.lunch.active} onToggle={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })} />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('onboarding.lunch')}</span>
                                            </div>
                                            {services.lunch.active && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                    <div><FieldLabel>{t('onboarding.from')}</FieldLabel><input type="time" style={timeInputStyle} value={services.lunch.from} onChange={e => setServices({ ...services, lunch: { ...services.lunch, from: e.target.value } })} /></div>
                                                    <div><FieldLabel>{t('onboarding.to')}</FieldLabel><input type="time" style={timeInputStyle} value={services.lunch.to} onChange={e => setServices({ ...services, lunch: { ...services.lunch, to: e.target.value } })} /></div>
                                                    <div><FieldLabel>{t('onboarding.maxCovers')}</FieldLabel><input type="number" min={1} style={timeInputStyle} value={services.lunch.capacity} onChange={e => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(e.target.value) || 0 } })} /></div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Dinner */}
                                        <div style={{ borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--line2)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Toggle on={services.dinner.active} onToggle={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })} />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('onboarding.dinner')}</span>
                                            </div>
                                            {services.dinner.active && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                    <div><FieldLabel>{t('onboarding.from')}</FieldLabel><input type="time" style={timeInputStyle} value={services.dinner.from} onChange={e => setServices({ ...services, dinner: { ...services.dinner, from: e.target.value } })} /></div>
                                                    <div><FieldLabel>{t('onboarding.to')}</FieldLabel><input type="time" style={timeInputStyle} value={services.dinner.to} onChange={e => setServices({ ...services, dinner: { ...services.dinner, to: e.target.value } })} /></div>
                                                    <div><FieldLabel>{t('onboarding.maxCovers')}</FieldLabel><input type="number" min={1} style={timeInputStyle} value={services.dinner.capacity} onChange={e => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(e.target.value) || 0 } })} /></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Email */}
                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--t1)', marginBottom: '4px' }}>
                                    <Mail size={16} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                                    {t('onboarding.confirmationEmail')}
                                </h2>
                                <div>
                                    <FieldLabel>{t('onboarding.emailReceiveBookings')}</FieldLabel>
                                    <input type="email" style={inputStyle} value={confirmationEmail} onChange={e => setConfirmationEmail(e.target.value)} placeholder={t('onboarding.phEmail')} />
                                    <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '6px' }}>{t('onboarding.emailHelper')}</p>
                                </div>
                                {user?.bcc_email && (
                                    <div style={{ borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--line2)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <FieldLabel>{t('onboarding.bccLabel')}</FieldLabel>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="text" readOnly value={user.bcc_email}
                                                style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: '6px', fontSize: '11px', background: 'var(--bg0)', border: '1px solid var(--line)', color: 'var(--t2)', fontFamily: 'monospace', outline: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }} />
                                            <button type="button" onClick={copyBcc}
                                                style={{ flexShrink: 0, padding: '10px', borderRadius: '6px', background: 'var(--bg3)', border: '1px solid var(--line2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {copied ? <Check size={14} style={{ color: 'var(--acc)' }} /> : <Copy size={14} style={{ color: 'var(--t2)' }} />}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--t3)' }}>{t('onboarding.bccHelper')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Récapitulatif */}
                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>
                                    <ClipboardList size={16} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                                    {t('onboarding.recap')}
                                </h2>
                                <p style={{ fontSize: '13px', color: 'var(--t3)' }}>{t('onboarding.recapHelper')}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <RecapBlock title={t('onboarding.restaurantSection')}>
                                        <RecapRow label={t('onboarding.name')}        value={info.name         || '—'} />
                                        <RecapRow label={t('onboarding.address')}     value={info.address      || '—'} />
                                        <RecapRow label={t('onboarding.phone')}       value={info.phone        || '—'} />
                                        <RecapRow label={t('onboarding.cuisineType')} value={info.cuisine_type || '—'} />
                                    </RecapBlock>

                                    <RecapBlock title={`${t('onboarding.schedule')} — ${totalCapacity} ${t('onboarding.totalCoversSuffix')}`}>
                                        {DAY_KEYS.map((key) => {
                                            const day = hours[key];
                                            return (
                                                <RecapRow key={key} label={t(`days.${key}`)}
                                                    value={day?.open
                                                        ? `${day.from} → ${day.to}`
                                                        : <span style={{ fontStyle: 'italic', color: 'var(--t3)' }}>{t('onboarding.closed')}</span>}
                                                />
                                            );
                                        })}
                                    </RecapBlock>

                                    <RecapBlock title={t('onboarding.services')}>
                                        <RecapRow label={t('onboarding.lunch')} value={services.lunch.active
                                            ? `${services.lunch.from} → ${services.lunch.to} · ${services.lunch.capacity} ${t('onboarding.covers')}`
                                            : <span style={{ fontStyle: 'italic', color: 'var(--t3)' }}>{t('onboarding.deactivated')}</span>}
                                        />
                                        <RecapRow label={t('onboarding.dinner')} value={services.dinner.active
                                            ? `${services.dinner.from} → ${services.dinner.to} · ${services.dinner.capacity} ${t('onboarding.covers')}`
                                            : <span style={{ fontStyle: 'italic', color: 'var(--t3)' }}>{t('onboarding.deactivated')}</span>}
                                        />
                                    </RecapBlock>

                                    <RecapBlock title={t('onboarding.notifications')}>
                                        <RecapRow label={t('onboarding.email')} value={confirmationEmail || '—'} />
                                        {user?.bcc_email && <RecapRow label={t('onboarding.bcc')} value={<span style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{user.bcc_email}</span>} />}
                                    </RecapBlock>
                                </div>

                                <button
                                    onClick={() => navigate(`/r/${user?.slug || user?.id}/dashboard`)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '8px', width: '100%', height: '48px', marginTop: '8px',
                                        borderRadius: '8px', background: 'var(--acc)', color: '#0c0c0c',
                                        border: 'none', fontSize: '14px', fontWeight: 600,
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    <Rocket size={18} /> {t('onboarding.launchAssistant')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    {step < 3 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--line)' }}>
                            <button
                                type="button"
                                onClick={() => setStep(s => s - 1)}
                                style={{
                                    height: '40px', padding: '0 20px', borderRadius: '8px',
                                    border: '1px solid var(--line2)', fontSize: '13px', fontWeight: 500,
                                    color: 'var(--t1)', background: 'transparent',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    visibility: step === 0 ? 'hidden' : 'visible',
                                }}
                            >
                                <ChevronLeft size={15} /> {t('common.previous')}
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={saving}
                                style={{
                                    height: '40px', padding: '0 28px', borderRadius: '8px',
                                    background: 'var(--acc)', color: '#0c0c0c',
                                    border: 'none', fontSize: '13px', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1,
                                    fontFamily: 'inherit',
                                }}
                            >
                                {saving ? (
                                    <><span className="loading" style={{ width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block' }} /> {t('common.saving')}</>
                                ) : step === 2 ? (
                                    <><Save size={14} /> {t('common.finish')}</>
                                ) : (
                                    <>{t('common.next')} <ChevronRight size={15} /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RecapBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--line2)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{title}</p>
        {children}
    </div>
);

const RecapRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <p style={{ fontSize: '13px', color: 'var(--t2)' }}>
        <span style={{ fontWeight: 500, color: 'var(--t1)' }}>{label} : </span>{value}
    </p>
);

export default Onboarding;
