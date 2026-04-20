import React, { useEffect, useState } from 'react';
import { settingsAPI, calendarAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Phone, Mail, User, Globe, Copy, Check,
  Calendar, Bell, Info, AlertCircle, CheckCircle, Wifi, WifiOff, Utensils,
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

type Toast = { type: 'success' | 'error'; text: string };

// ─── UI Primitives ────────────────────────────────────────────────────────────

function SectionCard({ title, description, icon: Icon, children, badge }: {
  title: string; description?: string; icon: React.ElementType;
  children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-5 border-b border-[#1a1a1a]">
        <div className="p-2 rounded-xl bg-[#1a1a1a] mt-0.5">
          <Icon size={16} className="text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {badge}
          </div>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
      {helper && <p className="text-xs text-gray-600 mt-1">{helper}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', readOnly = false }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  type?: string; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`
        w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors
        bg-[#0f0f0f] border text-white placeholder-gray-600
        focus:outline-none focus:border-green-500/50
        ${readOnly ? 'border-[#1a1a1a] text-gray-400 cursor-default font-mono text-xs' : 'border-[#222] hover:border-[#333]'}
      `}
    />
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-xl text-sm bg-[#0f0f0f] border border-[#222] text-white focus:outline-none focus:border-green-500/50 hover:border-[#333] transition-colors"
    />
  );
}

function Textarea({ value, onChange, placeholder }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#222] hover:border-[#333] focus:border-green-500/50 focus:outline-none text-white placeholder-gray-600 resize-none transition-colors"
    />
  );
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

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-4 border-t border-[#1a1a1a] mt-4">
      <button
        onClick={onClick}
        disabled={loading}
        className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-semibold transition-colors"
      >
        {loading ? 'Enregistrement...' : 'Sauvegarder'}
      </button>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input readOnly value={value}
          className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-[#0f0f0f] border border-[#1a1a1a] text-gray-400 font-mono focus:outline-none truncate"
        />
        <button onClick={copy}
          className="p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#222] transition-colors flex-shrink-0">
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings]     = useState<any>({});
  const [hours, setHours]           = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
  const [services, setServices]     = useState(DEFAULT_SERVICES);
  const [totalCapacity, setTotalCapacity] = useState(40);
  const [tableCount, setTableCount] = useState(20);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [loading, setLoading]       = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toast, setToast]           = useState<Toast | null>(null);

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
      setToast({ type: 'success', text: 'Connexion Google Calendar...' });
      await calendarAPI.callback(code);
      await refreshUser();
      setToast({ type: 'success', text: 'Google Calendar connecté !' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      setToast({ type: 'error', text: 'Erreur de connexion Google Calendar' });
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const s = response.data.settings;
      setSettings(s);
      if (s.opening_hours && Object.keys(s.opening_hours).length > 0) setHours(s.opening_hours);
      if (s.services     && Object.keys(s.services).length     > 0) setServices(s.services);
      if (s.capacity)    setTotalCapacity(s.capacity);   // ← fix: was s.total_capacity
      if (s.table_count) setTableCount(s.table_count);
      setConfirmationEmail(s.confirmation_email || s.email || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => setToast({ text: message, type });

  async function saveSection(section: string, data: Record<string, any>) {
    setSavingSection(section);
    try {
      await settingsAPI.update(data);
      await refreshUser();
      showToast('Modifications enregistrées', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSavingSection(null);
    }
  }

  const handleChange = (field: string, value: any) => setSettings({ ...settings, [field]: value });

  const connectCalendar = async () => {
    try {
      const response = await calendarAPI.getAuthUrl();
      window.open(response.data.authUrl, '_blank');
    } catch {
      showToast('Erreur de connexion Google Calendar', 'error');
    }
  };

  const disconnectCalendar = async () => {
    if (!confirm('Déconnecter Google Calendar ?')) return;
    try {
      await calendarAPI.disconnect();
      await refreshUser();
      showToast('Calendrier déconnecté', 'success');
    } catch {
      showToast('Erreur lors de la déconnexion', 'error');
    }
  };

  const retryVapiSetup = async () => {
    if (!confirm('Configurer votre assistant IA téléphonique ?')) return;
    setSavingSection('vapi');
    try {
      const response = await settingsAPI.retryVapi();
      await refreshUser();
      await fetchSettings();
      showToast(`Assistant IA configuré ! Téléphone: ${response.data.phoneNumber}`, 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur de configuration VAPI', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez la configuration de votre restaurant</p>
        </div>

        {/* 1. Informations générales */}
        <SectionCard title="Informations générales" icon={User}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom du restaurant">
                <Input value={settings.name || ''} onChange={(v) => handleChange('name', v)} placeholder="Coco Paris" />
              </Field>
              <Field label="Nom du propriétaire">
                <Input value={settings.owner_name || ''} onChange={(v) => handleChange('owner_name', v)} placeholder="Bryan" />
              </Field>
            </div>
            <Field label="Téléphone du restaurant" helper="Numéro affiché aux clients — différent du numéro IA ci-dessous">
              <Input value={settings.phone || ''} onChange={(v) => handleChange('phone', v)} placeholder="+33 1 42 00 00 00" type="tel" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type de cuisine">
                <Input value={settings.cuisine_type || ''} onChange={(v) => handleChange('cuisine_type', v)} placeholder="Française" />
              </Field>
              <Field label="Adresse">
                <Input value={settings.address || ''} onChange={(v) => handleChange('address', v)} placeholder="12 rue de Rivoli, Paris" />
              </Field>
            </div>
          </div>
          <SaveButton loading={savingSection === 'general'} onClick={() => saveSection('general', {
            name: settings.name, owner_name: settings.owner_name, phone: settings.phone,
            cuisine_type: settings.cuisine_type, address: settings.address,
          })} />
        </SectionCard>

        {/* 2. Assistant IA */}
        <SectionCard
          title="Assistant IA"
          description="Votre agent téléphonique alimenté par TableNow"
          icon={Phone}
          badge={user?.vapi_assistant_id ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">Actif</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">Non configuré</span>
          )}
        >
          <div className="space-y-3">
            {user?.vapi_phone_number ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a]">
                <div className="p-2 rounded-xl bg-[#1a1a1a]">
                  <Phone size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Numéro IA — reçoit les appels de vos clients</p>
                  <p className="text-base font-bold text-white font-mono">{user.vapi_phone_number}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={retryVapiSetup}
                disabled={savingSection === 'vapi'}
                className="w-full px-5 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-semibold transition-colors"
              >
                {savingSection === 'vapi' ? 'Configuration en cours...' : "Configurer l'assistant IA"}
              </button>
            )}
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <Info size={11} />
              Ce numéro est géré automatiquement par TableNow.
            </p>
          </div>
        </SectionCard>

        {/* 3. Google Calendar */}
        <SectionCard
          title="Google Calendar"
          description="Créez automatiquement des événements pour chaque réservation"
          icon={Calendar}
        >
          {user?.google_calendar_tokens ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-green-400">
                <Wifi size={15} />
                <span className="font-medium">Calendrier connecté</span>
              </div>
              <button onClick={disconnectCalendar}
                className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors">
                Déconnecter
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <WifiOff size={15} />
                <span>Non connecté</span>
              </div>
              <button onClick={connectCalendar}
                className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-medium transition-colors">
                Connecter Google Calendar
              </button>
            </div>
          )}
        </SectionCard>

        {/* 4. Horaires & Services (fusionnés) */}
        <SectionCard title="Horaires & Services" icon={Utensils}>
          <div className="space-y-6">

            {/* Jours d'ouverture */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Jours d'ouverture</p>
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const day = hours[key] ?? { open: false, from: '12:00', to: '22:00' };
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <Toggle on={day.open} onToggle={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })} />
                      <span className={`text-sm font-medium w-[5.5rem] flex-shrink-0 ${day.open ? 'text-white' : 'text-gray-600'}`}>
                        {label}
                      </span>
                      {day.open ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TimeInput value={day.from} onChange={(v) => setHours({ ...hours, [key]: { ...day, from: v } })} />
                          <span className="text-gray-600 text-xs flex-shrink-0">→</span>
                          <TimeInput value={day.to} onChange={(v) => setHours({ ...hours, [key]: { ...day, to: v } })} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 italic">Fermé</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#1a1a1a]" />

            {/* Capacité */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Capacité</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Capacité totale (couverts)">
                  <Input value={String(totalCapacity)} onChange={(v) => setTotalCapacity(parseInt(v) || 0)} type="number" />
                </Field>
                <Field label="Nombre de tables">
                  <Input value={String(tableCount)} onChange={(v) => setTableCount(parseInt(v) || 0)} type="number" />
                </Field>
                <Field label="Groupe max">
                  <Input value={String(settings.max_party_size || '')} onChange={(v) => handleChange('max_party_size', v)} type="number" />
                </Field>
                <Field label="Résa à l'avance (j)">
                  <Input value={String(settings.advance_booking_days || '')} onChange={(v) => handleChange('advance_booking_days', v)} type="number" />
                </Field>
              </div>
            </div>

            <div className="border-t border-[#1a1a1a]" />

            {/* Services */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Services</p>
              <div className="space-y-3">

                {/* Déjeuner */}
                <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] space-y-3">
                  <div className="flex items-center gap-3">
                    <Toggle on={services.lunch.active} onToggle={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })} />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Déjeuner</p>
                  </div>
                  {services.lunch.active && (
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="De">
                        <TimeInput value={services.lunch.from} onChange={(v) => setServices({ ...services, lunch: { ...services.lunch, from: v } })} />
                      </Field>
                      <Field label="À">
                        <TimeInput value={services.lunch.to} onChange={(v) => setServices({ ...services, lunch: { ...services.lunch, to: v } })} />
                      </Field>
                      <Field label="Couverts max">
                        <Input value={String(services.lunch.capacity)} onChange={(v) => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(v) || 0 } })} type="number" />
                      </Field>
                    </div>
                  )}
                </div>

                {/* Dîner */}
                <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] space-y-3">
                  <div className="flex items-center gap-3">
                    <Toggle on={services.dinner.active} onToggle={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })} />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dîner</p>
                  </div>
                  {services.dinner.active && (
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="De">
                        <TimeInput value={services.dinner.from} onChange={(v) => setServices({ ...services, dinner: { ...services.dinner, from: v } })} />
                      </Field>
                      <Field label="À">
                        <TimeInput value={services.dinner.to} onChange={(v) => setServices({ ...services, dinner: { ...services.dinner, to: v } })} />
                      </Field>
                      <Field label="Couverts max">
                        <Input value={String(services.dinner.capacity)} onChange={(v) => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(v) || 0 } })} type="number" />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <SaveButton loading={savingSection === 'schedule'} onClick={() => saveSection('schedule', {
            opening_hours: hours,
            capacity: totalCapacity,          // ← fix: was total_capacity
            table_count: tableCount,
            services,
            max_party_size: settings.max_party_size ? parseInt(settings.max_party_size) : undefined,
            advance_booking_days: settings.advance_booking_days ? parseInt(settings.advance_booking_days) : undefined,
          })} />
        </SectionCard>

        {/* 5. Notifications */}
        <SectionCard title="Notifications" icon={Bell}>
          <div className="space-y-4">
            <Field label="Email de confirmation" helper="Les confirmations de réservation sont envoyées à cette adresse">
              <Input value={confirmationEmail} onChange={(v) => setConfirmationEmail(v)} type="email" placeholder="reservations@monrestaurant.fr" />
            </Field>
            <Field label="Politique d'annulation">
              <Textarea value={settings.cancellation_policy || ''} onChange={(v) => handleChange('cancellation_policy', v)} placeholder="Ex : Annulation gratuite jusqu'à 24h avant..." />
            </Field>
            <Field label="Fonctionnalités spéciales">
              <Textarea value={settings.special_features || ''} onChange={(v) => handleChange('special_features', v)} placeholder="Ex : Terrasse, menu enfants, accès PMR..." />
            </Field>
          </div>
          <SaveButton loading={savingSection === 'notifications'} onClick={() => saveSection('notifications', {
            confirmation_email: confirmationEmail,
            cancellation_policy: settings.cancellation_policy,
            special_features: settings.special_features,
          })} />
        </SectionCard>

        {/* 6. Informations système */}
        <SectionCard
          title="Informations système"
          description="Gérées automatiquement par TableNow — lecture seule"
          icon={Info}
        >
          <div className="space-y-3">
            <CopyField label="Adresse BCC"      value={user?.bcc_email        || 'Non configuré'} />
            <CopyField label="Numéro IA (VAPI)" value={user?.vapi_phone_number || 'Non configuré'} />
            <CopyField label="URL du restaurant" value={user?.slug ? `tablenow.io/r/${user.slug}` : '—'} />
            {user?.vapi_assistant_id && <CopyField label="Assistant ID" value={user.vapi_assistant_id} />}
          </div>
        </SectionCard>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl z-50 ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default Settings;
