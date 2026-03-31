import React, { useEffect, useState } from 'react';
import { settingsAPI, calendarAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Save, Calendar, Mail, Phone, Settings as SettingsIcon, AlertCircle, CheckCircle } from 'lucide-react';

const Settings: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();

        // Check for Google Calendar code
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            handleCalendarCallback(code);
        }
    }, []);

    const handleCalendarCallback = async (code: string) => {
        try {
            setMessage({ type: 'success', text: 'Connecting Google Calendar...' });
            await calendarAPI.callback(code);
            await refreshUser();
            setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to connect Google Calendar' });
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await settingsAPI.get();
            setSettings(response.data.settings);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await settingsAPI.update(settings);
            await refreshUser();
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    const connectCalendar = async () => {
        try {
            const response = await calendarAPI.getAuthUrl();
            window.open(response.data.authUrl, '_blank');
            setMessage({ type: 'success', text: 'Please complete the authorization in the new window' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to get calendar authorization URL' });
        }
    };

    const disconnectCalendar = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

        try {
            await calendarAPI.disconnect();
            await refreshUser();
            setMessage({ type: 'success', text: 'Calendar disconnected successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to disconnect calendar' });
        }
    };

    const retryVapiSetup = async () => {
        if (!confirm('This will attempt to set up your AI phone assistant. Continue?')) return;

        setSaving(true);
        setMessage(null);

        try {
            const response = await settingsAPI.retryVapi();
            await refreshUser();
            await fetchSettings();
            setMessage({
                type: 'success',
                text: `VAPI setup successful! Your phone number is ${response.data.phoneNumber}`
            });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to set up VAPI. Please contact support.'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading w-12 h-12"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your restaurant configuration</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg border-2 flex items-start space-x-2 ${message.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                        {message.text}
                    </p>
                </div>
            )}

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
                        <button
                            onClick={retryVapiSetup}
                            disabled={saving}
                            className="btn btn-primary w-full"
                        >
                            {saving ? (
                                <span className="flex items-center justify-center">
                                    <span className="loading mr-2"></span>
                                    Setting up...
                                </span>
                            ) : (
                                'Retry AI Phone Setup'
                            )}
                        </button>
                    )}

                    {user?.vapi_assistant_id && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600">Assistant ID</p>
                            <p className="font-mono text-sm mt-1">{user.vapi_assistant_id}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* BCC Email */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Mail size={24} />
                    <h2 className="text-xl font-bold">Third-Party Booking Sync via Email</h2>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-600">
                        Automatically sync your Zenchef or SevenRooms reservations to TableNow by forwarding their booking confirmation emails to this unique address. (This is NOT for replying to guests via Gmail).
                    </p>

                    <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Your BCC Email Address</p>
                        <p className="font-mono text-lg font-bold break-all">{user?.bcc_email || 'Not configured'}</p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium mb-2">How to use:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            <li>Log in to your Zenchef or SevenRooms account</li>
                            <li>Go to email notification settings</li>
                            <li>Add the BCC email above to all booking notifications</li>
                            <li>Save your settings</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Google Calendar */}
            <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <Calendar size={24} />
                    <h2 className="text-xl font-bold">Google Calendar Integration</h2>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-600">
                        Connect your Google Calendar to automatically create events for new bookings.
                    </p>

                    {user?.google_calendar_tokens ? (
                        <div className="space-y-3">
                            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="text-green-600" size={20} />
                                    <span className="font-medium">Calendar Connected</span>
                                </div>
                                <button
                                    onClick={disconnectCalendar}
                                    className="btn btn-secondary text-sm"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={connectCalendar}
                            className="btn btn-primary"
                        >
                            Connect Google Calendar
                        </button>
                    )}
                </div>
            </div>

            {/* Restaurant Settings */}
            <form onSubmit={handleSubmit} className="card">
                <div className="flex items-center space-x-3 mb-4">
                    <SettingsIcon size={24} />
                    <h2 className="text-xl font-bold">Restaurant Information</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                            <input
                                type="text"
                                name="name"
                                value={settings.name || ''}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Owner Name</label>
                            <input
                                type="text"
                                name="owner_name"
                                value={settings.owner_name || ''}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={settings.phone || ''}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Cuisine Type</label>
                            <input
                                type="text"
                                name="cuisine_type"
                                value={settings.cuisine_type || ''}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={settings.address || ''}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Capacity</label>
                            <input
                                type="number"
                                name="capacity"
                                value={settings.capacity || ''}
                                onChange={handleChange}
                                className="input"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Max Party Size</label>
                            <input
                                type="number"
                                name="max_party_size"
                                value={settings.max_party_size || ''}
                                onChange={handleChange}
                                className="input"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Advance Booking (days)</label>
                            <input
                                type="number"
                                name="advance_booking_days"
                                value={settings.advance_booking_days || ''}
                                onChange={handleChange}
                                className="input"
                                min="1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Cancellation Policy</label>
                        <textarea
                            name="cancellation_policy"
                            value={settings.cancellation_policy || ''}
                            onChange={handleChange}
                            className="input"
                            rows={3}
                            placeholder="e.g., 24 hours notice required for cancellations"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Special Features</label>
                        <textarea
                            name="special_features"
                            value={settings.special_features || ''}
                            onChange={handleChange}
                            className="input"
                            rows={3}
                            placeholder="e.g., Outdoor seating, Private dining room, Live music"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        {saving ? (
                            <span className="flex items-center justify-center">
                                <span className="loading mr-2"></span>
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center">
                                <Save size={20} className="mr-2" />
                                Save Settings
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
