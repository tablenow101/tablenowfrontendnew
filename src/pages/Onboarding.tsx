import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../lib/api';
import {
    Store,
    Clock,
    Users,
    Mail,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    Save,
    Copy,
    Check,
} from 'lucide-react';

const DAYS = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' },
] as const;

const STEPS = [
    { icon: Store, label: 'Restaurant' },
    { icon: Clock, label: 'Horaires' },
    { icon: Users, label: 'Services' },
    { icon: Mail, label: 'Email' },
    { icon: CheckCircle, label: 'Terminé' },
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

const Onboarding: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Step 1 — Restaurant info
    const [info, setInfo] = useState({
        name: '',
        address: '',
        phone: '',
        cuisine_type: '',
    });

    // Step 2 — Opening hours
    const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);

    // Step 3 — Services & capacity
    const [totalCapacity, setTotalCapacity] = useState(40);
    const [services, setServices] = useState(DEFAULT_SERVICES);

    // Step 4 — Email
    const [confirmationEmail, setConfirmationEmail] = useState('');

    // Load existing data
    useEffect(() => {
        (async () => {
            try {
                const res = await settingsAPI.get();
                const s = res.data.settings;
                setInfo({
                    name: s.name || '',
                    address: s.address || '',
                    phone: s.phone || '',
                    cuisine_type: s.cuisine_type || '',
                });
                if (s.opening_hours && Object.keys(s.opening_hours).length > 0) {
                    setHours(s.opening_hours);
                }
                if (s.services && Object.keys(s.services).length > 0) {
                    setServices(s.services);
                }
                if (s.total_capacity) setTotalCapacity(s.total_capacity);
                if (s.confirmation_email) setConfirmationEmail(s.confirmation_email);
                else if (s.email) setConfirmationEmail(s.email);
            } catch {}
            setLoading(false);
        })();
    }, []);

    async function saveStep(data: Record<string, any>) {
        setSaving(true);
        try {
            await settingsAPI.update(data);
            await refreshUser();
        } catch (err) {
            console.error('Save error:', err);
        }
        setSaving(false);
    }

    async function nextStep() {
        if (step === 0) {
            await saveStep(info);
        } else if (step === 1) {
            await saveStep({ opening_hours: hours });
        } else if (step === 2) {
            await saveStep({ total_capacity: totalCapacity, services });
        } else if (step === 3) {
            await saveStep({ confirmation_email: confirmationEmail });
        }
        if (step < 4) setStep(step + 1);
    }

    function prevStep() {
        if (step > 0) setStep(step - 1);
    }

    function finish() {
        const slug = user?.slug || user?.id;
        navigate(`/r/${slug}/dashboard`);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">TableNow</h1>
                    <p className="text-gray-600 mt-1">Configuration de votre restaurant</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between mb-8">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const active = i === step;
                        const done = i < step;
                        return (
                            <React.Fragment key={s.label}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                        done ? 'bg-green-500 text-white' :
                                        active ? 'bg-black text-white' :
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                        {done ? <Check size={18} /> : <Icon size={18} />}
                                    </div>
                                    <span className={`text-xs mt-1 ${active ? 'font-semibold text-black' : 'text-gray-500'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">

                    {/* Step 1 — Info */}
                    {step === 0 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Store size={22} /> Informations du restaurant</h2>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nom du restaurant *</label>
                                <input className="input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Adresse *</label>
                                <input className="input" value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} placeholder="123 Rue Principale, 75001 Paris" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Téléphone</label>
                                    <input className="input" type="tel" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="+33 1 23 45 67 89" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type de cuisine</label>
                                    <input className="input" value={info.cuisine_type} onChange={(e) => setInfo({ ...info, cuisine_type: e.target.value })} placeholder="Française, Italienne..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Hours */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Clock size={22} /> Horaires d'ouverture</h2>
                            <p className="text-sm text-gray-500">Activez les jours d'ouverture et définissez les horaires.</p>
                            {DAYS.map(({ key, label }) => {
                                const day = hours[key] || { open: false, from: '12:00', to: '22:00' };
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <label className="w-24 text-sm font-medium">{label}</label>
                                        <button
                                            type="button"
                                            onClick={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${day.open ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${day.open ? 'left-6' : 'left-0.5'}`} />
                                        </button>
                                        {day.open ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="time"
                                                    value={day.from}
                                                    onChange={(e) => setHours({ ...hours, [key]: { ...day, from: e.target.value } })}
                                                    className="input !w-32 !py-1.5 text-center"
                                                />
                                                <span className="text-gray-400">→</span>
                                                <input
                                                    type="time"
                                                    value={day.to}
                                                    onChange={(e) => setHours({ ...hours, [key]: { ...day, to: e.target.value } })}
                                                    className="input !w-32 !py-1.5 text-center"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Fermé</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Step 3 — Services & capacity */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Users size={22} /> Services & Capacité</h2>

                            <div>
                                <label className="block text-sm font-medium mb-1">Capacité totale (couverts)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="input !w-32"
                                    value={totalCapacity}
                                    onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            {/* Lunch */}
                            <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${services.lunch.active ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${services.lunch.active ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                    <span className="font-semibold">Déjeuner</span>
                                </div>
                                {services.lunch.active && (
                                    <div className="flex flex-wrap items-center gap-3 pl-15">
                                        <div>
                                            <label className="text-xs text-gray-500">De</label>
                                            <input type="time" className="input !w-28 !py-1.5 text-center" value={services.lunch.from} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, from: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">À</label>
                                            <input type="time" className="input !w-28 !py-1.5 text-center" value={services.lunch.to} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, to: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Couverts max</label>
                                            <input type="number" min={1} className="input !w-24 !py-1.5 text-center" value={services.lunch.capacity} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dinner */}
                            <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${services.dinner.active ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${services.dinner.active ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                    <span className="font-semibold">Dîner</span>
                                </div>
                                {services.dinner.active && (
                                    <div className="flex flex-wrap items-center gap-3 pl-15">
                                        <div>
                                            <label className="text-xs text-gray-500">De</label>
                                            <input type="time" className="input !w-28 !py-1.5 text-center" value={services.dinner.from} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, from: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">À</label>
                                            <input type="time" className="input !w-28 !py-1.5 text-center" value={services.dinner.to} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, to: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Couverts max</label>
                                            <input type="number" min={1} className="input !w-24 !py-1.5 text-center" value={services.dinner.capacity} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(e.target.value) || 0 } })} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 4 — Email */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Mail size={22} /> Email de confirmation</h2>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email pour recevoir les réservations *</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={confirmationEmail}
                                    onChange={(e) => setConfirmationEmail(e.target.value)}
                                    placeholder="reservations@votre-restaurant.fr"
                                />
                                <p className="text-xs text-gray-400 mt-1">Les confirmations et notifications de réservation seront envoyées à cette adresse.</p>
                            </div>

                            {user?.bcc_email && (
                                <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl space-y-2">
                                    <label className="block text-sm font-medium">Adresse BCC (lecture seule)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="text" className="input !bg-gray-100 font-mono text-sm" value={user.bcc_email} readOnly />
                                        <button type="button" onClick={copyBcc} className="p-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                                            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400">Ajoutez cette adresse en BCC dans Zenchef / SevenRooms pour synchroniser les réservations.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5 — Done */}
                    {step === 4 && (
                        <div className="text-center space-y-6 py-8">
                            <div className="flex justify-center">
                                <div className="bg-green-500 text-white p-5 rounded-full">
                                    <CheckCircle size={48} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold">Configuration terminée !</h2>
                            <p className="text-gray-600">Votre restaurant est prêt. Vous pouvez modifier ces paramètres à tout moment dans les réglages.</p>
                            <button onClick={finish} className="btn btn-primary px-12">
                                Accéder au tableau de bord
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    {step < 4 && (
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={step === 0}
                                className={`btn btn-secondary flex items-center gap-1 ${step === 0 ? 'invisible' : ''}`}
                            >
                                <ChevronLeft size={18} /> Précédent
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={saving}
                                className="btn btn-primary flex items-center gap-1"
                            >
                                {saving ? (
                                    <><span className="loading mr-1"></span> Sauvegarde...</>
                                ) : step === 3 ? (
                                    <><Save size={18} /> Terminer</>
                                ) : (
                                    <>Suivant <ChevronRight size={18} /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
