import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../lib/api';
import LanguageToggle from '../components/LanguageToggle';
import {
    Store, Clock, Mail, ClipboardList,
    ChevronRight, ChevronLeft, Save, Copy, Check, Rocket,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Primitives ───────────────────────────────────────────────────────────────

const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0d0d1a] border border-[#252535] ' +
    'text-white placeholder-[#444] focus:outline-none focus:border-green-500/60 transition-colors';

const timeCls =
    'h-10 px-3 text-center rounded-xl text-sm bg-[#0d0d1a] border border-[#252535] ' +
    'text-white focus:outline-none focus:border-green-500/60 transition-colors';

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-semibold text-[#666] uppercase tracking-wider mb-1.5">{children}</p>;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-150 focus:outline-none ${on ? 'bg-green-500' : 'bg-[#2a2a3a]'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-150 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────

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
        if (step === 2) await saveStep({ confirmation_email: confirmationEmail });
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
            <div className="min-h-screen bg-[#080912] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080912] flex flex-col items-center justify-center py-8 px-4">
            <div className="w-full max-w-xl">

                {/* Header avec toggle langue */}
                <div className="flex justify-end mb-4">
                    <LanguageToggle />
                </div>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">{t('common.appName')}</h1>
                    <p className="text-sm text-[#555] mt-1">{t('onboarding.title')}</p>
                </div>

                {/* Stepper */}
                <div className="flex items-start mb-8 px-2">
                    {STEPS.map((s, i) => {
                        const Icon   = s.icon;
                        const active = i === step;
                        const done   = i < step;
                        return (
                            <React.Fragment key={s.label}>
                                <div className="flex flex-col items-center gap-1.5 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-green-500 text-black' : active ? 'bg-white text-black' : 'bg-[#151525] text-[#444]'}`}>
                                        {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
                                    </div>
                                    <span className={`text-[10px] font-medium text-center leading-tight max-w-[60px] ${active ? 'text-white' : 'text-[#555]'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mt-5 mx-2 ${i < step ? 'bg-green-500' : 'bg-[#1a1a2a]'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-[#0d0d1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                    {saveError && (
                        <div className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
                            ⚠ {saveError}
                        </div>
                    )}

                    <div className="px-6 py-7">

                        {/* ── Step 0: Restaurant ── */}
                        {step === 0 && (
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-5">
                                    <Store size={18} className="text-green-400 flex-shrink-0" />
                                    {t('onboarding.restaurantInfo')}
                                </h2>
                                <div>
                                    <FieldLabel>{t('onboarding.restaurantName')}</FieldLabel>
                                    <input className={inputCls} value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder={t('onboarding.phRestaurantName')} />
                                </div>
                                <div>
                                    <FieldLabel>{t('onboarding.address')}</FieldLabel>
                                    <input className={inputCls} value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder={t('onboarding.phAddress')} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <FieldLabel>{t('onboarding.phone')}</FieldLabel>
                                        <input className={inputCls} type="tel" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} placeholder={t('onboarding.phPhone')} />
                                    </div>
                                    <div>
                                        <FieldLabel>{t('onboarding.cuisineType')}</FieldLabel>
                                        <input className={inputCls} value={info.cuisine_type} onChange={e => setInfo({ ...info, cuisine_type: e.target.value })} placeholder={t('onboarding.phCuisine')} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Horaires & Services ── */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                                        <Clock size={18} className="text-green-400 flex-shrink-0" />
                                        {t('onboarding.scheduleAndServices')}
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-[#666] text-xs">{t('onboarding.totalCapacity')}</span>
                                        <input
                                            type="number" min={1}
                                            className="w-16 h-8 px-2 text-center rounded-lg text-sm bg-[#0d0d1a] border border-[#252535] text-white focus:outline-none focus:border-green-500/60"
                                            value={totalCapacity}
                                            onChange={e => setTotalCapacity(parseInt(e.target.value) || 0)}
                                        />
                                        <span className="text-[#666] text-xs">{t('onboarding.covers')}</span>
                                    </div>
                                </div>

                                {/* Jours d'ouverture */}
                                <div>
                                    <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">{t('onboarding.openingDays')}</p>
                                    <div className="space-y-2">
                                        {DAY_KEYS.map((key) => {
                                            const day = hours[key] || { open: false, from: '12:00', to: '22:00' };
                                            return (
                                                <div key={key} className="flex items-center gap-3">
                                                    <Toggle on={day.open} onToggle={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })} />
                                                    <span className={`text-sm font-medium w-24 flex-shrink-0 ${day.open ? 'text-white' : 'text-[#444]'}`}>
                                                        {t(`days.${key}`)}
                                                    </span>
                                                    {day.open ? (
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <input type="time" className={`${timeCls} flex-1`} value={day.from}
                                                                onChange={e => setHours({ ...hours, [key]: { ...day, from: e.target.value } })} />
                                                            <span className="text-[#333] text-xs">→</span>
                                                            <input type="time" className={`${timeCls} flex-1`} value={day.to}
                                                                onChange={e => setHours({ ...hours, [key]: { ...day, to: e.target.value } })} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[#444] italic">{t('onboarding.closed')}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t border-white/5" />

                                {/* Services */}
                                <div>
                                    <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">{t('onboarding.servicesAndCovers')}</p>
                                    <div className="space-y-3">

                                        {/* Lunch */}
                                        <div className="rounded-xl bg-[#0a0a16] border border-white/8 p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Toggle on={services.lunch.active} onToggle={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })} />
                                                <span className="text-sm font-semibold text-white">{t('onboarding.lunch')}</span>
                                            </div>
                                            {services.lunch.active && (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <FieldLabel>{t('onboarding.from')}</FieldLabel>
                                                        <input type="time" className={`${timeCls} w-full`} value={services.lunch.from}
                                                            onChange={e => setServices({ ...services, lunch: { ...services.lunch, from: e.target.value } })} />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>{t('onboarding.to')}</FieldLabel>
                                                        <input type="time" className={`${timeCls} w-full`} value={services.lunch.to}
                                                            onChange={e => setServices({ ...services, lunch: { ...services.lunch, to: e.target.value } })} />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>{t('onboarding.maxCovers')}</FieldLabel>
                                                        <input type="number" min={1} className={`${timeCls} w-full text-center`} value={services.lunch.capacity}
                                                            onChange={e => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(e.target.value) || 0 } })} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dinner */}
                                        <div className="rounded-xl bg-[#0a0a16] border border-white/8 p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Toggle on={services.dinner.active} onToggle={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })} />
                                                <span className="text-sm font-semibold text-white">{t('onboarding.dinner')}</span>
                                            </div>
                                            {services.dinner.active && (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <FieldLabel>{t('onboarding.from')}</FieldLabel>
                                                        <input type="time" className={`${timeCls} w-full`} value={services.dinner.from}
                                                            onChange={e => setServices({ ...services, dinner: { ...services.dinner, from: e.target.value } })} />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>{t('onboarding.to')}</FieldLabel>
                                                        <input type="time" className={`${timeCls} w-full`} value={services.dinner.to}
                                                            onChange={e => setServices({ ...services, dinner: { ...services.dinner, to: e.target.value } })} />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>{t('onboarding.maxCovers')}</FieldLabel>
                                                        <input type="number" min={1} className={`${timeCls} w-full text-center`} value={services.dinner.capacity}
                                                            onChange={e => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(e.target.value) || 0 } })} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Email ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-5">
                                    <Mail size={18} className="text-green-400 flex-shrink-0" />
                                    {t('onboarding.confirmationEmail')}
                                </h2>
                                <div>
                                    <FieldLabel>{t('onboarding.emailReceiveBookings')}</FieldLabel>
                                    <input type="email" className={inputCls} value={confirmationEmail}
                                        onChange={e => setConfirmationEmail(e.target.value)}
                                        placeholder={t('onboarding.phEmail')} />
                                    <p className="text-xs text-[#555] mt-1.5">{t('onboarding.emailHelper')}</p>
                                </div>
                                {user?.bcc_email && (
                                    <div className="rounded-xl bg-[#0a0a16] border border-white/8 p-4 space-y-2">
                                        <FieldLabel>{t('onboarding.bccLabel')}</FieldLabel>
                                        <div className="flex items-center gap-2">
                                            <input type="text" readOnly value={user.bcc_email}
                                                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-xs bg-[#080912] border border-[#1a1a2a] text-[#888] font-mono focus:outline-none truncate" />
                                            <button type="button" onClick={copyBcc}
                                                className="flex-shrink-0 p-2.5 rounded-xl bg-[#151525] hover:bg-[#1a1a2a] border border-[#252535] transition-colors">
                                                {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} className="text-[#888]" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#555]">{t('onboarding.bccHelper')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 3: Récapitulatif ── */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-1">
                                    <ClipboardList size={18} className="text-green-400 flex-shrink-0" />
                                    {t('onboarding.recap')}
                                </h2>
                                <p className="text-sm text-[#666]">{t('onboarding.recapHelper')}</p>

                                <div className="space-y-2">
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
                                                        : <span className="italic text-[#555]">{t('onboarding.closed')}</span>}
                                                />
                                            );
                                        })}
                                    </RecapBlock>

                                    <RecapBlock title={t('onboarding.services')}>
                                        <RecapRow label={t('onboarding.lunch')} value={services.lunch.active
                                            ? `${services.lunch.from} → ${services.lunch.to} · ${services.lunch.capacity} ${t('onboarding.covers')}`
                                            : <span className="italic text-[#555]">{t('onboarding.deactivated')}</span>}
                                        />
                                        <RecapRow label={t('onboarding.dinner')} value={services.dinner.active
                                            ? `${services.dinner.from} → ${services.dinner.to} · ${services.dinner.capacity} ${t('onboarding.covers')}`
                                            : <span className="italic text-[#555]">{t('onboarding.deactivated')}</span>}
                                        />
                                    </RecapBlock>

                                    <RecapBlock title={t('onboarding.notifications')}>
                                        <RecapRow label={t('onboarding.email')} value={confirmationEmail || '—'} />
                                        {user?.bcc_email && <RecapRow label={t('onboarding.bcc')} value={<span className="font-mono text-xs break-all">{user.bcc_email}</span>} />}
                                    </RecapBlock>
                                </div>

                                <button
                                    onClick={() => navigate(`/r/${user?.slug || user?.id}/dashboard`)}
                                    className="w-full h-14 mt-2 rounded-xl bg-white text-black font-semibold text-base flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <Rocket size={20} /> {t('onboarding.launchAssistant')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    {step < 3 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setStep(s => s - 1)}
                                className={`h-11 px-5 rounded-xl border border-white/10 text-sm font-medium text-white flex items-center gap-1.5 hover:bg-white/5 transition-colors ${step === 0 ? 'invisible pointer-events-none' : ''}`}
                            >
                                <ChevronLeft size={16} /> {t('common.previous')}
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={saving}
                                className="h-11 px-8 rounded-xl bg-white text-black text-sm font-semibold flex items-center gap-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                                {saving ? (
                                    <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" /> {t('common.saving')}</>
                                ) : step === 2 ? (
                                    <><Save size={15} /> {t('common.finish')}</>
                                ) : (
                                    <>{t('common.next')} <ChevronRight size={16} /></>
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
    <div className="rounded-xl bg-[#0a0a16] border border-white/8 px-4 py-3.5 space-y-1.5">
        <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-2">{title}</p>
        {children}
    </div>
);

const RecapRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <p className="text-sm text-[#aaa]">
        <span className="font-medium text-white">{label} : </span>{value}
    </p>
);

export default Onboarding;
