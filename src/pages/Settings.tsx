import React, { useEffect, useState } from 'react';
import { settingsAPI, calendarAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
    Save,
    Calendar,
    Mail,
    Phone,
    Settings as SettingsIcon,
    AlertCircle,
    CheckCircle,
    Clock,
    Users,
    Copy,
    Check,
    Info,
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

const DEFAULT_HOURS: Record<string, { open: boolean; from: string; to: string }> = {
    monday: { open: true, from: '12:00', to: '22:30' },
    tuesday: { open: true, from: '12:00', to: '22:30' },
    wednesday: { open: true, from: '12:00', to: '22:30' },
    thursday: { open: true, from: '12:00', to: '22:30' },
    friday: { open: true, from: '12:00', to: '23:00' },
    saturday: { open: true, from: '12:00', to: '23:00' },
    sunday: { open: false, from: '12:00', to: '22:00' },
};

const DEFAULT_SERVICES = {
    lunch: { active: true, from: '12:00', to: '14:30', capacity: 20 },
    dinner: { active: true, from: '19:00', to: '22:30', capacity: 20 },
};

type Toast = { type: 'success' | 'error'; text: string; section: string };

const Settings: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [settings, setSettings] = useState<any>({});
    const [hours, setHours] = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
    const [services, setServices] = useState(DEFAULT_SERVICES);
    const [totalCapacity, setTotalCapacity] = useState(40);
    const [confirmationEmail, setConfirmationEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) handleCalendarCallback(code);
    }, []);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const handleCalendarCallback = async (code: string) => {
        try {
            setToast({ type: 'success', text: 'Connecting Google Calendar...', section: 'calendar' });
            await calendarAPI.callback(code);
            await refreshUser();
            setToast({ type: 'success', text: 'Google Calendar connected successfully!', section: 'calendar' });
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch {
            setToast({ type: 'error', text: 'Failed to connect Google Calendar', section: 'calendar' });
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.get();
            const s = response.data.settings;
            setSettings(s);
            if (s.opening_hours && Object.keys(s.opening_hours).length > 0) setHours(s.opening_hours);
            if (s.services && Object.keys(s.services).length > 0) setServices(s.services);
            if (s.total_capacity) setTotalCapacity(s.total_capacity);
            setConfirmationEmail(s.confirmation_email || s.email || '');
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    async function saveSection(section: string, data: Record<string, any>) {
        setSavingSection(section);
        try {
            await settingsAPI.update(data);
            await refreshUser();
            setToast({ type: 'success', text: 'Modifications enregistrées', section });
        } catch (error: any) {
            setToast({ type: 'error', text: error.response?.data?.error || 'Erreur lors de la sauvegarde', section });
        } finally {
            setSavingSection(null);
        }
    }

    function copyToClipboard(text: string, field: string) {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }

    const connectCalendar = async () => {
        try {
            const response = await calendarAPI.getAuthUrl();
            window.open(response.data.authUrl, '_blank');
            setToast({ type: 'success', text: 'Please complete the authorization in the new window', section: 'calendar' });
        } catch {
            setToast({ type: 'error', text: 'Failed to get calendar authorization URL', section: 'calendar' });
        }
    };

    const disconnectCalendar = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;
        try {
            await calendarAPI.disconnect();
            await refreshUser();
            setToast({ type: 'success', text: 'Calendar disconnected', section: 'calendar' });
        } catch {
            setToast({ type: 'error', text: 'Failed to disconnect calendar', section: 'calendar' });
        }
    };

    const retryVapiSetup = async () => {
        if (!confirm('This will attempt to set up your AI phone assistant. Continue?')) return;
        setSavingSection('vapi');
        try {
            const response = await settingsAPI.retryVapi();
            await refreshUser();
            await fetchSettings();
            setToast({ type: 'success', text: `VAPI setup successful! Phone: ${response.data.phoneNumber}`, section: 'vapi' });
        } catch (error: any) {
            setToast({ type: 'error', text: error.response?.data?.error || 'VAPI setup failed', section: 'vapi' });
        } finally {
            setSavingSection(null);
        }
    };

    function SectionToast({ section }: { section: string }) {
        if (!toast || toast.section !== section) return null;
        return (
            <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {toast.text}
            </div>
        );
    }

    function SaveButton({ section, onClick }: { section: string; onClick: () => void }) {
        const isSaving = savingSection === section;
        return (
            <button type="button" onClick={onClick} disabled={isSaving} className="btn btn-primary flex items-center gap-2">
                {isSaving ? <><span className="loading mr-1"></span>Sauvegarde...</> : <><Save size={18} /> Sauvegarder</>}
            </button>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your restaurant configuration</p>
            </div>

            {/* Section 1 — General Info */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <SettingsIcon size={24} />
                    <h2 className="text-xl font-bold">Informations générales</h2>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nom du restaurant</label>
                            <input type="text" name="name" value={settings.name || ''} onChange={handleChange} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Nom du propriétaire</label>
                            <input type="text" name="owner_name" value={settings.owner_name || ''} onChange={handleChange} className="input" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Téléphone</label>
                            <input type="tel" name="phone" value={settings.phone || ''} onChange={handleChange} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Type de cuisine</label>
                            <input type="text" name="cuisine_type" value={settings.cuisine_type || ''} onChange={handleChange} className="input" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Adresse</label>
                        <input type="text" name="address" value={settings.address || ''} onChange={handleChange} className="input" />
                    </div>
                    <SaveButton section="info" onClick={() => saveSection('info', { name: settings.name, owner_name: settings.owner_name, phone: settings.phone, cuisine_type: settings.cuisine_type, address: settings.address })} />
                    <SectionToast section="info" />
                </div>
            </div>

            {/* Section 2 — Opening Hours */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Clock size={24} />
                    <h2 className="text-xl font-bold">Horaires d'ouverture</h2>
                </div>
                <div className="space-y-3">
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
                                        <input type="time" value={day.from} onChange={(e) => setHours({ ...hours, [key]: { ...day, from: e.target.value } })} className="input !w-32 !py-1.5 text-center" />
                                        <span className="text-gray-400">→</span>
                                        <input type="time" value={day.to} onChange={(e) => setHours({ ...hours, [key]: { ...day, to: e.target.value } })} className="input !w-32 !py-1.5 text-center" />
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Fermé</span>
                                )}
                            </div>
                        );
                    })}
                    <div className="pt-2">
                        <SaveButton section="hours" onClick={() => saveSection('hours', { opening_hours: hours })} />
                    </div>
                    <SectionToast section="hours" />
                </div>
            </div>

            {/* Section 3 — Services & Capacity */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Users size={24} />
                    <h2 className="text-xl font-bold">Services & Capacité</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Capacité totale (couverts)</label>
                        <input type="number" min={1} className="input !w-32" value={totalCapacity} onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 0)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Max Party Size</label>
                            <input type="number" name="max_party_size" value={settings.max_party_size || ''} onChange={handleChange} className="input" min="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Advance Booking (days)</label>
                            <input type="number" name="advance_booking_days" value={settings.advance_booking_days || ''} onChange={handleChange} className="input" min="1" />
                        </div>
                    </div>

                    {/* Lunch */}
                    <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })} className={`w-12 h-6 rounded-full transition-colors relative ${services.lunch.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${services.lunch.active ? 'left-6' : 'left-0.5'}`} />
                            </button>
                            <span className="font-semibold">Déjeuner</span>
                        </div>
                        {services.lunch.active && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div><label className="text-xs text-gray-500">De</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.lunch.from} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, from: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">À</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.lunch.to} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, to: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">Couverts max</label><input type="number" min={1} className="input !w-24 !py-1.5 text-center" value={services.lunch.capacity} onChange={(e) => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(e.target.value) || 0 } })} /></div>
                            </div>
                        )}
                    </div>

                    {/* Dinner */}
                    <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })} className={`w-12 h-6 rounded-full transition-colors relative ${services.dinner.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${services.dinner.active ? 'left-6' : 'left-0.5'}`} />
                            </button>
                            <span className="font-semibold">Dîner</span>
                        </div>
                        {services.dinner.active && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div><label className="text-xs text-gray-500">De</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.dinner.from} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, from: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">À</label><input type="time" className="input !w-28 !py-1.5 text-center" value={services.dinner.to} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, to: e.target.value } })} /></div>
                                <div><label className="text-xs text-gray-500">Couverts max</label><input type="number" min={1} className="input !w-24 !py-1.5 text-center" value={services.dinner.capacity} onChange={(e) => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(e.target.value) || 0 } })} /></div>
                            </div>
                        )}
                    </div>

                    <SaveButton section="services" onClick={() => saveSection('services', { total_capacity: totalCapacity, services, max_party_size: settings.max_party_size ? parseInt(settings.max_party_size) : undefined, advance_booking_days: settings.advance_booking_days ? parseInt(settings.advance_booking_days) : undefined })} />
                    <SectionToast section="services" />
                </div>
            </div>

            {/* Section 4 — Notifications */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Mail size={24} />
                    <h2 className="text-xl font-bold">Notifications</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email de confirmation des réservations</label>
                        <input type="email" value={confirmationEmail} onChange={(e) => setConfirmationEmail(e.target.value)} className="input" placeholder="reservations@votre-restaurant.fr" />
                        <p className="text-xs text-gray-400 mt-1">Les confirmations et notifications de réservation seront envoyées à cette adresse.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Cancellation Policy</label>
                        <textarea name="cancellation_policy" value={settings.cancellation_policy || ''} onChange={handleChange} className="input" rows={3} placeholder="e.g., 24 hours notice required" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Special Features</label>
                        <textarea name="special_features" value={settings.special_features || ''} onChange={handleChange} className="input" rows={3} placeholder="e.g., Outdoor seating, Private dining" />
                    </div>
                    <SaveButton section="notifications" onClick={() => saveSection('notifications', { confirmation_email: confirmationEmail, cancellation_policy: settings.cancellation_policy, special_features: settings.special_features })} />
                    <SectionToast section="notifications" />
                </div>
            </div>

            {/* VAPI Integration */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Phone size={24} />
                    <h2 className="text-xl font-bold">AI Phone Assistant</h2>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-black text-white rounded-lg">
                        <p className="text-sm text-gray-300">Your AI Phone Number</p>
                        <p className="text-2xl font-bold mt-1">{user?.vapi_phone_number || 'Not configured'}</p>
                    </div>
                    {(!user?.vapi_phone_number || !user?.vapi_assistant_id) && (
                        <button onClick={retryVapiSetup} disabled={savingSection === 'vapi'} className="btn btn-primary w-full">
                            {savingSection === 'vapi' ? <span className="flex items-center justify-center"><span className="loading mr-2"></span>Setting up...</span> : 'Retry AI Phone Setup'}
                        </button>
                    )}
                    <SectionToast section="vapi" />
                </div>
            </div>

            {/* Google Calendar */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Calendar size={24} />
                    <h2 className="text-xl font-bold">Google Calendar</h2>
                </div>
                <div className="space-y-4">
                    <p className="text-gray-600">Connect your Google Calendar to automatically create events for new bookings.</p>
                    {user?.google_calendar_tokens ? (
                        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="text-green-600" size={20} />
                                <span className="font-medium">Calendar Connected</span>
                            </div>
                            <button onClick={disconnectCalendar} className="btn btn-secondary text-sm">Disconnect</button>
                        </div>
                    ) : (
                        <button onClick={connectCalendar} className="btn btn-primary">Connect Google Calendar</button>
                    )}
                    <SectionToast section="calendar" />
                </div>
            </div>

            {/* Section 5 — System Info (read-only) */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Info size={24} />
                    <h2 className="text-xl font-bold">Informations système</h2>
                </div>
                <p className="text-sm text-gray-400 mb-4">Ces informations sont gérées automatiquement par TableNow.</p>
                <div className="space-y-3">
                    {/* BCC Email */}
                    <div className="flex items-center gap-2">
                        <label className="w-40 text-sm font-medium text-gray-600">Adresse BCC</label>
                        <div className="flex-1 flex items-center gap-2">
                            <input type="text" className="input !bg-gray-50 font-mono text-sm flex-1" value={user?.bcc_email || 'Non configuré'} readOnly />
                            {user?.bcc_email && (
                                <button onClick={() => copyToClipboard(user.bcc_email, 'bcc')} className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                                    {copiedField === 'bcc' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            )}
                        </div>
                    </div>
                    {/* AI Phone */}
                    <div className="flex items-center gap-2">
                        <label className="w-40 text-sm font-medium text-gray-600">Téléphone AI</label>
                        <div className="flex-1 flex items-center gap-2">
                            <input type="text" className="input !bg-gray-50 font-mono text-sm flex-1" value={user?.vapi_phone_number || 'Non configuré'} readOnly />
                            {user?.vapi_phone_number && (
                                <button onClick={() => copyToClipboard(user.vapi_phone_number, 'phone')} className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                                    {copiedField === 'phone' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Slug */}
                    <div className="flex items-center gap-2">
                        <label className="w-40 text-sm font-medium text-gray-600">URL du restaurant</label>
                        <input type="text" className="input !bg-gray-50 font-mono text-sm flex-1" value={user?.slug ? `/r/${user.slug}` : '—'} readOnly />
                    </div>
                    {/* Assistant ID */}
                    {user?.vapi_assistant_id && (
                        <div className="flex items-center gap-2">
                            <label className="w-40 text-sm font-medium text-gray-600">Assistant ID</label>
                            <input type="text" className="input !bg-gray-50 font-mono text-sm flex-1" value={user.vapi_assistant_id} readOnly />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
