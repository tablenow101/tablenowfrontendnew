'use client';
// components/onboarding/PrefillStep.tsx
// Step 1 of restaurant onboarding — auto-fill from Google Maps + website

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, Globe, MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface PrefillResult {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  hours?: Record<string, string>;
  cuisine_type?: string;
  services?: string[];
  sources: string[];
  errors?: Record<string, string>;
}

interface PrefillStepProps {
  onComplete: (data: PrefillResult) => void;
}

export default function PrefillStep({ onComplete }: PrefillStepProps) {
  const { t } = useTranslation();
  const [googleUrl, setGoogleUrl]   = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handlePrefill() {
    if (!googleUrl && !websiteUrl) {
      setError(t('prefill.needLink'));
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/restaurants/prefill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_maps_url: googleUrl  || undefined,
          website_url:     websiteUrl || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t('prefill.fetchError'));
      }

      const data: PrefillResult = await res.json();
      onComplete(data);
    } catch (err: any) {
      setError(err.message || t('prefill.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-black text-white p-4 rounded-full">
            <Search size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('prefill.title')}</h2>
        <p className="text-gray-600 text-sm">{t('prefill.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Google Maps */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
            <MapPin size={16} />
            {t('prefill.googleLink')} <span className="text-gray-400 text-xs">{t('prefill.recommended')}</span>
          </label>
          <input
            type="url"
            placeholder={t('prefill.phGoogleMaps')}
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            disabled={loading}
            className="input"
          />
          <p className="text-xs text-gray-400 mt-1">{t('prefill.googleHelper')}</p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
            <Globe size={16} />
            {t('prefill.website')} <span className="text-gray-400 text-xs">{t('prefill.optional')}</span>
          </label>
          <input
            type="url"
            placeholder={t('prefill.phWebsite')}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            disabled={loading}
            className="input"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handlePrefill}
          disabled={loading || (!googleUrl && !websiteUrl)}
          className="btn btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 size={16} className="animate-spin mr-2" />
              {t('prefill.fetching')}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Search size={16} />
              {t('prefill.fetch')}
            </span>
          )}
        </button>

        <button
          onClick={() => onComplete({ sources: [] })}
          disabled={loading}
          className="w-full text-center text-sm text-gray-500 hover:text-black underline py-2"
        >
          {t('prefill.manual')}
        </button>
      </div>
    </div>
  );
}
