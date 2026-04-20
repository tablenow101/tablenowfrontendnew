import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../lib/api';
import {
    Store, Clock, Mail, ClipboardList,
    ChevronRight, ChevronLeft, Save, Copy, Check, Rocket,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
    { key: 'monday',    label: 'Lundi'    },
    { key: 'tuesday',   label: 'Mardi'    },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday',  label: 'Jeudi'    },
    { key: 'friday',    label: 'Vendredi' },
    { key: 'saturday',  label: 'Samedi'   },
    { key: 'sunday',    label: 'Dimanche' },
] as const;

const STEPS = [
    { icon: Store,         label: 'Restaurant'    },
    { icon: Clock,         label: 'Horaires'      },
    { icon: Mail,          label: 'Email'         },
    { icon: ClipboardList, label: 'Récapitulatif' },
];

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

// ─── Shared primitives ───────────────────────────────────────────────────────

const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#2a2a2a] ' +
    'text-white placeholder-[#555] focus:outline-none focus:border-green-500/50 ' +
    'transition-colors hover:border-[#383838]';

const timeInputCls =
    'w-full h-10 px-3 rounded-xl text-sm bg-[#0f0f0f] border border-[#2a2a2a] ' +
    'text-white focus:outline-none focus:border-green-500/50 transition-colors hover:border-[#383838]';

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-xs font-medium text-[#888] mb-1.5">{children}</p>;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${on ? 'bg-green-500' : 'bg-[#2a2a2a]'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────

const Onboarding: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep]       = useState(0);
    const [saving, setSaving]   = useState(false);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied]   = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [info, setInfo] = useState({ name: '', address: '', phone: '', cuisine_type: '' });
    const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
    const [totalCapacity, setTotalCapacity] = useState(40);
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
            setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.');
        }
        setSaving(false);
    }

    async function nextStep() {
        if (step === 0) await saveStep(info);
        if (step === 1) await saveStep({ opening_hours: hours, capacity: totalCapacity, services });
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
            <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0F1C] py-10 px-4">
            <div className="max-w-xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">TableNow</h1>
                    <p className="text-sm text-[#555] mt-1">Configuration de votre restaurant</p>
                </div>

                {/* Stepper */}
                <div className="flex items-start mb-8">
                    {STEPS.map((s, i) => {
                        const Icon   = s.icon;
                        const active = i === step;
                        const done   = i < step;
                        return (
                            <React.Fragment key={s.label}>
                                <div className="flex flex-col items-center gap-1.5 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-green-500 text-black' : active ? 'bg-white text-black' : 'bg-[#1a1a2e] text-[#555]'}`}>
                                        {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
                                    </div>
                                    <span className={`text-[11px] font-medium text-center ${active ? 'text-white' : 'text-[#555]'}`}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mt-5 mx-2 ${i < step ? 'bg-green-500' : 'bg-[#1f1f2e]'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-[#0F1626] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                    {/* Error banner */}
                    {saveError && (
                        <div className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
                            ⚠ {saveError}
                        </div>
                    )}

                    <div className="px-6 py-7">

                        {/* ── Step 0: Restaurant ── */}
                        {step === 0 && (
                            <div className="space-y-5">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                                    <Store size={18} className="text-green-400 flex-shrink-0" />
                                    Informations du restaurant
                                </h2>
                                <div>
                                    <FieldLabel>Nom du restaurant *</FieldLabel>
                                    <input className={inputCls} value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })} placeholder="Le Petit Bistrot" />
                                </div>
                                <div>
                                    <FieldLabel>Adresse</FieldLabel>
                                    <input className={inputCls} value={info.address} onChange={e => setInfo({ ...info, address: e.target.value })} placeholder="123 Rue Principale, 75001 Paris" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <FieldLabel>Téléphone</FieldLabel>
                                        <input className={inputCls} type="tel" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} placeholder="+33 1 23 45 67 89" />
                                    </div>
                                    <div>
                                        <FieldLabel>Type de cuisine</FieldLabel>
                                        <input className={inputCls} value={info.cuisine_type} onChange={e => setInfo({ ...info, cuisine_type: e.target.value })} placeholder="Française, Italienne..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Horaires & Services ── */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                                    <Clock size={18} className="text-green-400 flex-shrink-0" />
                                    Horaires & Services
                                </h2>

                                {/* Jours */}
                                <div>
                                    <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">Jours d'ouverture</p>
                                    <div className="space-y-2">
                                        {DAYS.map(({ key, label }) => {
                                            const day = hours[key] || { open: false, from: '12:00', to: '22:00' };
                                            return (
                                                <div key={key} className="flex items-center gap-3">
                                                    <Toggle on={day.open} onToggle={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })} />
                                                    <span className={`text-sm font-medium w-[5.5rem] flex-shrink-0 ${day.open ? 'text-white' : 'text-[#555]'}`}>
                                                        {label}
                                                    </span>
                                                    {day.open ? (
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <input type="time" value={day.from}
                                                                onChange={e => setHours({ ...hours, [key]: { ...day, from: e.target.value } })}
                                                                className={timeInputCls} />
                                                            <span className="text-[#444] text-xs flex-shrink-0">→</span>
                                                            <input type="time" value={day.to}
                                                                onChange={e => setHours({ ...hours, [key]: { ...day, to: e.target.value } })}
                                                                className={timeInputCls} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[#444] italic">Fermé</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t border-white/5" />

                                {/* Services */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Services & Capacité</p>

                                    <div className="w-36">
                                        <FieldLabel>Capacité totale (couverts)</FieldLabel>
                                        <input type="number" min={1} className={timeInputCls} value={totalCapacity}
                                            onChange={e => setTotalCapacity(parseInt(e.target.value) || 0)} />
                                    </div>

                                    {/* Déjeuner */}
                                    <div className="rounded-xl bg-[#0a0a14] border border-white/8 p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Toggle on={services.lunch.active} onToggle={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })} />
                                            <span className="text-sm font-semibold text-white">Déjeuner</span>
                                        </div>
                                        {services.lunch.active && (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div><FieldLabel>De</FieldLabel><input type="time" className={timeInputCls} value={services.lunch.from} onChange={e => setServices({ ...services, lunch: { ...services.lunch, from: e.target.value } })} /></div>
                                                <div><FieldLabel>À</FieldLabel><input type="time" className={timeInputCls} value={services.lunch.to} onChange={e => setServices({ ...services, lunch: { ...services.lunch, to: e.target.value } })} /></div>
                                                <div><FieldLabel>Couverts max</FieldLabel><input type="number" min={1} className={timeInputCls} value={services.lunch.capacity} onChange={e => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(e.target.value) || 0 } })} /></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dîner */}
                                    <div className="rounded-xl bg-[#0a0a14] border border-white/8 p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Toggle on={services.dinner.active} onToggle={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })} />
                                            <span className="text-sm font-semibold text-white">Dîner</span>
                                        </div>
                                        {services.dinner.active && (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div><FieldLabel>De</FieldLabel><input type="time" className={timeInputCls} value={services.dinner.from} onChange={e => setServices({ ...services, dinner: { ...services.dinner, from: e.target.value } })} /></div>
                                                <div><FieldLabel>À</FieldLabel><input type="time" className={timeInputCls} value={services.dinner.to} onChange={e => setServices({ ...services, dinner: { ...services.dinner, to: e.target.value } })} /></div>
                                                <div><FieldLabel>Couverts max</FieldLabel><input type="number" min={1} className={timeInputCls} value={services.dinner.capacity} onChange={e => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(e.target.value) || 0 } })} /></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Email ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                                    <Mail size={18} className="text-green-400 flex-shrink-0" />
                                    Email de confirmation
                                </h2>
                                <div>
                                    <FieldLabel>Email pour recevoir les réservations *</FieldLabel>
                                    <input type="email" className={inputCls} value={confirmationEmail}
                                        onChange={e => setConfirmationEmail(e.target.value)}
                                        placeholder="reservations@votre-restaurant.fr" />
                                    <p className="text-xs text-[#555] mt-1.5">Les confirmations seront envoyées à cette adresse.</p>
                                </div>

                                {user?.bcc_email && (
                                    <div className="rounded-xl bg-[#0a0a14] border border-white/8 p-4 space-y-2">
                                        <FieldLabel>Adresse BCC (lecture seule)</FieldLabel>
                                        <div className="flex items-center gap-2">
                                            <input type="text" readOnly value={user.bcc_email}
                                                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-[#0f0f0f] border border-[#1a1a1a] text-[#888] font-mono focus:outline-none truncate" />
                                            <button type="button" onClick={copyBcc}
                                                className="flex-shrink-0 p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#252525] transition-colors">
                                                {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} className="text-[#888]" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#555]">Ajoutez cette adresse en BCC dans Zenchef / SevenRooms pour synchroniser les réservations.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 3: Récapitulatif ── */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                                    <ClipboardList size={18} className="text-green-400 flex-shrink-0" />
                                    Récapitulatif
                                </h2>
                                <p className="text-sm text-[#666]">Tout a été sauvegardé — modifiez à tout moment dans les réglages.</p>

                                <div className="space-y-2">
                                    <RecapBlock title="Restaurant">
                                        <RecapRow label="Nom"       value={info.name         || '—'} />
                                        <RecapRow label="Adresse"   value={info.address      || '—'} />
                                        <RecapRow label="Téléphone" value={info.phone        || '—'} />
                                        <RecapRow label="Cuisine"   value={info.cuisine_type || '—'} />
                                    </RecapBlock>

                                    <RecapBlock title="Horaires">
                                        {DAYS.map(({ key, label }) => {
                                            const day = hours[key];
                                            return (
                                                <RecapRow key={key} label={label}
                                                    value={day?.open ? `${day.from} → ${day.to}` : <span className="italic text-[#555]">Fermé</span>}
                                                />
                                            );
                                        })}
                                    </RecapBlock>

                                    <RecapBlock title="Services">
                                        <RecapRow label="Capacité totale" value={`${totalCapacity} couverts`} />
                                        <RecapRow label="Déjeuner" value={services.lunch.active
                                            ? `${services.lunch.from} → ${services.lunch.to} · ${services.lunch.capacity} cvts`
                                            : <span className="italic text-[#555]">Désactivé</span>}
                                        />
                                        <RecapRow label="Dîner" value={services.dinner.active
                                            ? `${services.dinner.from} → ${services.dinner.to} · ${services.dinner.capacity} cvts`
                                            : <span className="italic text-[#555]">Désactivé</span>}
                                        />
                                    </RecapBlock>

                                    <RecapBlock title="Notifications">
                                        <RecapRow label="Email" value={confirmationEmail || '—'} />
                                        {user?.bcc_email && <RecapRow label="BCC" value={<span className="font-mono text-xs break-all">{user.bcc_email}</span>} />}
                                    </RecapBlock>
                                </div>

                                <button
                                    onClick={() => navigate(`/r/${user?.slug || user?.id}/dashboard`)}
                                    className="w-full h-12 mt-2 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                                >
                                    <Rocket size={18} /> Lancer mon assistant
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
                                className={`h-10 px-5 rounded-xl border border-white/10 text-sm font-medium text-white flex items-center gap-1 hover:bg-white/5 transition-colors ${step === 0 ? 'invisible pointer-events-none' : ''}`}
                            >
                                <ChevronLeft size={16} /> Précédent
                            </button>

                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={saving}
                                className="h-10 px-6 rounded-xl bg-white text-black text-sm font-semibold flex items-center gap-1.5 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                                {saving ? (
                                    <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" /> Sauvegarde...</>
                                ) : step === 2 ? (
                                    <><Save size={15} /> Terminer</>
                                ) : (
                                    <>Suivant <ChevronRight size={16} /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const RecapBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl bg-[#0a0a14] border border-white/8 px-4 py-3.5 space-y-1.5">
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
