import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsAPI, calendarAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import {
  Phone, Mail, User, Globe, Copy, Check,
  Calendar, Bell, Info, AlertCircle, CheckCircle, Wifi, WifiOff, Utensils,
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
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors bg-[#0f0f0f] border text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 ${readOnly ? 'border-[#1a1a1a] text-gray-400 cursor-default font-mono text-xs' : 'border-[#222] hover:border-[#333]'}`}
    />
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-xl text-sm bg-[#0f0f0f] border border-[#222] text-white focus:outline-none focus:border-green-500/50 hover:border-[#333] transition-colors"
    />
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange?: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange?.(e.target.value)}
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

function SaveButton({ loading, onClick, label, savingLabel }: { loading: boolean; onClick: () => void; label: string; savingLabel: string }) {
  return (
    <div className="flex justify-end pt-4 border-t border-[#1a1a1a] mt-4">
      <button
        onClick={onClick}
        disabled={loading}
        className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-semibold transition-colors"
      >
        {loading ? savingLabel : label}
      </button>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input readOnly value={value} className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-[#0f0f0f] border border-[#1a1a1a] text-gray-400 font-mono focus:outline-none truncate" />
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#222] transition-colors flex-shrink-0"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [settings, setSettings]   = useState<any>({});
  const [hours, setHours]         = useState<Record<string, { open: boolean; from: string; to: string }>>(DEFAULT_HOURS);
  const [services, setServices]   = useState(DEFAULT_SERVICES);
  const [totalCapacity, setTotalCapacity] = useState(40);
  const [tableCount, setTableCount]       = useState(20);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [loading, setLoading]             = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toast, setToast]                 = useState<Toast | null>(null);

  useEffect(() => {
    fetchSettings();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) handleCalendarCallback(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (toast) {
      const tm = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(tm);
    }
  }, [toast]);

  const handleCalendarCallback = async (code: string) => {
    try {
      setToast({ type: 'success', text: t('settings.calendar.callbackInProgress') });
      await calendarAPI.callback(code);
      await refreshUser();
      setToast({ type: 'success', text: t('settings.calendar.callbackSuccess') });
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      setToast({ type: 'error', text: t('settings.calendar.connectError') });
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const s = response.data.settings;
      setSettings(s);
      if (s.opening_hours && Object.keys(s.opening_hours).length > 0) setHours(s.opening_hours);
      if (s.services     && Object.keys(s.services).length     > 0) setServices(s.services);
      if (s.capacity)    setTotalCapacity(s.capacity);
      if (s.table_count) setTableCount(s.table_count);
      setConfirmationEmail(s.confirmation_email || s.email || '');
    } catch (err) {
      console.error(t('settings.loadError'), err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => setToast({ text, type });

  async function saveSection(section: string, data: Record<string, any>) {
    setSavingSection(section);
    try {
      await settingsAPI.update(data);
      await refreshUser();
      showToast(t('common.saved'), 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || t('settings.saveError'), 'error');
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
      showToast(t('settings.calendar.connectError'), 'error');
    }
  };

  const disconnectCalendar = async () => {
    if (!confirm(t('settings.calendar.disconnectPrompt'))) return;
    try {
      await calendarAPI.disconnect();
      await refreshUser();
      showToast(t('settings.calendar.disconnected'), 'success');
    } catch {
      showToast(t('settings.calendar.disconnectError'), 'error');
    }
  };

  const retryVapiSetup = async () => {
    if (!confirm(t('settings.vapi.retryPrompt'))) return;
    setSavingSection('vapi');
    try {
      const response = await settingsAPI.retryVapi();
      await refreshUser();
      await fetchSettings();
      showToast(t('settings.vapi.retrySuccess', { phone: response.data.phoneNumber }), 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || t('settings.vapi.retryError'), 'error');
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

  const saveLabel = t('common.save');
  const savingLabel = t('common.saving');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('settings.subtitle')}</p>
        </div>

        {/* 0. Langue de l'interface */}
        <SectionCard title={t('settings.section.language')} description={t('settings.section.languageDesc')} icon={Globe}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{t('common.languageLabel')}</span>
            <LanguageToggle />
          </div>
        </SectionCard>

        {/* 1. Informations générales */}
        <SectionCard title={t('settings.section.general')} icon={User}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('settings.fields.name')}>
                <Input value={settings.name || ''} onChange={v => handleChange('name', v)} placeholder="Coco Paris" />
              </Field>
              <Field label={t('settings.fields.ownerName')}>
                <Input value={settings.owner_name || ''} onChange={v => handleChange('owner_name', v)} placeholder="Jean Dupont" />
              </Field>
            </div>
            <Field label={t('settings.fields.phone')} helper={t('settings.fields.phoneHelper')}>
              <Input value={settings.phone || ''} onChange={v => handleChange('phone', v)} placeholder="+33 1 42 00 00 00" type="tel" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('settings.fields.cuisine')}>
                <Input value={settings.cuisine_type || ''} onChange={v => handleChange('cuisine_type', v)} placeholder="Française" />
              </Field>
              <Field label={t('settings.fields.address')}>
                <Input value={settings.address || ''} onChange={v => handleChange('address', v)} placeholder="12 rue de Rivoli, Paris" />
              </Field>
            </div>
          </div>
          <SaveButton loading={savingSection === 'general'} onClick={() => saveSection('general', {
            name: settings.name, owner_name: settings.owner_name, phone: settings.phone,
            cuisine_type: settings.cuisine_type, address: settings.address,
          })} label={saveLabel} savingLabel={savingLabel} />
        </SectionCard>

        {/* 2. Assistant IA */}
        <SectionCard
          title={t('settings.section.ai')}
          description={t('settings.section.aiDesc')}
          icon={Phone}
          badge={user?.vapi_assistant_id
            ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">{t('settings.ai.active')}</span>
            : <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">{t('settings.ai.notConfigured')}</span>
          }
        >
          <div className="space-y-3">
            {user?.vapi_phone_number ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a]">
                <div className="p-2 rounded-xl bg-[#1a1a1a]"><Phone size={16} className="text-green-400" /></div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{t('settings.fields.iaPhone')}</p>
                  <p className="text-base font-bold text-white font-mono">{user.vapi_phone_number}</p>
                </div>
              </div>
            ) : (
              <button onClick={retryVapiSetup} disabled={savingSection === 'vapi'}
                className="w-full px-5 py-3 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-semibold transition-colors">
                {savingSection === 'vapi' ? t('settings.ai.configuring') : t('settings.ai.configure')}
              </button>
            )}
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <Info size={11} /> {t('settings.fields.iaInfo')}
            </p>
          </div>
        </SectionCard>

        {/* 3. Google Calendar */}
        <SectionCard title={t('settings.section.calendar')} description={t('settings.section.calendarDesc')} icon={Calendar}>
          {user?.google_calendar_tokens ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-green-400"><Wifi size={15} /><span className="font-medium">{t('settings.calendar.connected')}</span></div>
              <button onClick={disconnectCalendar} className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors">
                {t('settings.calendar.disconnect')}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm text-gray-500"><WifiOff size={15} /><span>{t('settings.calendar.notConnected')}</span></div>
              <button onClick={connectCalendar} className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-medium transition-colors">
                {t('settings.calendar.connect')}
              </button>
            </div>
          )}
        </SectionCard>

        {/* 4. Horaires & Services */}
        <SectionCard title={t('settings.section.schedule')} icon={Utensils}>
          <div className="space-y-6">

            {/* Jours d'ouverture */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">{t('settings.fields.openingDays')}</p>
              <div className="space-y-2">
                {DAY_KEYS.map((key) => {
                  const day = hours[key] ?? { open: false, from: '12:00', to: '22:00' };
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <Toggle on={day.open} onToggle={() => setHours({ ...hours, [key]: { ...day, open: !day.open } })} />
                      <span className={`text-sm font-medium w-24 flex-shrink-0 ${day.open ? 'text-white' : 'text-gray-600'}`}>{t(`days.${key}`)}</span>
                      {day.open ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TimeInput value={day.from} onChange={v => setHours({ ...hours, [key]: { ...day, from: v } })} />
                          <span className="text-gray-600 text-xs flex-shrink-0">→</span>
                          <TimeInput value={day.to} onChange={v => setHours({ ...hours, [key]: { ...day, to: v } })} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 italic">{t('settings.fields.closed')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#1a1a1a]" />

            {/* Capacité */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">{t('settings.fields.capacity')}</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('settings.fields.totalCovers')}>
                  <Input value={String(totalCapacity)} onChange={v => setTotalCapacity(parseInt(v) || 0)} type="number" />
                </Field>
                <Field label={t('settings.fields.tableCount')}>
                  <Input value={String(tableCount)} onChange={v => setTableCount(parseInt(v) || 0)} type="number" />
                </Field>
                <Field label={t('settings.fields.maxParty')}>
                  <Input value={String(settings.max_party_size || '')} onChange={v => handleChange('max_party_size', v)} type="number" />
                </Field>
                <Field label={t('settings.fields.advanceDays')}>
                  <Input value={String(settings.advance_booking_days || '')} onChange={v => handleChange('advance_booking_days', v)} type="number" />
                </Field>
              </div>
            </div>

            <div className="border-t border-[#1a1a1a]" />

            {/* Services */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">{t('settings.fields.services')}</p>
              <div className="space-y-3">
                {/* Lunch */}
                <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] space-y-3">
                  <div className="flex items-center gap-3">
                    <Toggle on={services.lunch.active} onToggle={() => setServices({ ...services, lunch: { ...services.lunch, active: !services.lunch.active } })} />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('settings.fields.lunch')}</p>
                  </div>
                  {services.lunch.active && (
                    <div className="grid grid-cols-3 gap-3">
                      <Field label={t('settings.fields.from')}><TimeInput value={services.lunch.from} onChange={v => setServices({ ...services, lunch: { ...services.lunch, from: v } })} /></Field>
                      <Field label={t('settings.fields.to')}><TimeInput value={services.lunch.to} onChange={v => setServices({ ...services, lunch: { ...services.lunch, to: v } })} /></Field>
                      <Field label={t('settings.fields.maxCovers')}><Input value={String(services.lunch.capacity)} onChange={v => setServices({ ...services, lunch: { ...services.lunch, capacity: parseInt(v) || 0 } })} type="number" /></Field>
                    </div>
                  )}
                </div>
                {/* Dinner */}
                <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] space-y-3">
                  <div className="flex items-center gap-3">
                    <Toggle on={services.dinner.active} onToggle={() => setServices({ ...services, dinner: { ...services.dinner, active: !services.dinner.active } })} />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('settings.fields.dinner')}</p>
                  </div>
                  {services.dinner.active && (
                    <div className="grid grid-cols-3 gap-3">
                      <Field label={t('settings.fields.from')}><TimeInput value={services.dinner.from} onChange={v => setServices({ ...services, dinner: { ...services.dinner, from: v } })} /></Field>
                      <Field label={t('settings.fields.to')}><TimeInput value={services.dinner.to} onChange={v => setServices({ ...services, dinner: { ...services.dinner, to: v } })} /></Field>
                      <Field label={t('settings.fields.maxCovers')}><Input value={String(services.dinner.capacity)} onChange={v => setServices({ ...services, dinner: { ...services.dinner, capacity: parseInt(v) || 0 } })} type="number" /></Field>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <SaveButton loading={savingSection === 'schedule'} onClick={() => saveSection('schedule', {
            opening_hours: hours,
            capacity: totalCapacity,
            table_count: tableCount,
            services,
            max_party_size: settings.max_party_size ? parseInt(settings.max_party_size) : undefined,
            advance_booking_days: settings.advance_booking_days ? parseInt(settings.advance_booking_days) : undefined,
          })} label={saveLabel} savingLabel={savingLabel} />
        </SectionCard>

        {/* 5. Notifications */}
        <SectionCard title={t('settings.section.notifications')} icon={Bell}>
          <div className="space-y-4">
            <Field label={t('settings.fields.confirmationEmail')} helper={t('settings.fields.confirmationEmailHelper')}>
              <Input value={confirmationEmail} onChange={v => setConfirmationEmail(v)} type="email" placeholder="reservations@monrestaurant.fr" />
            </Field>
            <Field label={t('settings.fields.cancelPolicy')}>
              <Textarea value={settings.cancellation_policy || ''} onChange={v => handleChange('cancellation_policy', v)} placeholder={t('settings.fields.phCancelPolicy')} />
            </Field>
            <Field label={t('settings.fields.specialFeatures')}>
              <Textarea value={settings.special_features || ''} onChange={v => handleChange('special_features', v)} placeholder={t('settings.fields.phSpecialFeatures')} />
            </Field>
          </div>
          <SaveButton loading={savingSection === 'notifications'} onClick={() => saveSection('notifications', {
            confirmation_email: confirmationEmail,
            cancellation_policy: settings.cancellation_policy,
            special_features: settings.special_features,
          })} label={saveLabel} savingLabel={savingLabel} />
        </SectionCard>

        {/* 6. Informations système */}
        <SectionCard title={t('settings.section.system')} description={t('settings.section.systemDesc')} icon={Info}>
          <div className="space-y-3">
            <CopyField label={t('settings.fields.bccAddress')}    value={user?.bcc_email         || t('common.notConfigured')} />
            <CopyField label={t('settings.fields.vapiNumber')}    value={user?.vapi_phone_number || t('common.notConfigured')} />
            <CopyField label={t('settings.fields.restaurantUrl')} value={user?.slug ? `tablenow.io/r/${user.slug}` : '—'} />
            {user?.vapi_assistant_id && <CopyField label={t('settings.fields.assistantId')} value={user.vapi_assistant_id} />}
          </div>
        </SectionCard>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl z-50 ${
          toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default Settings;
