import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">{t('common.appName')}</div>
          <div className="flex items-center gap-4">
            <LanguageToggle variant="light" />
            <Link to="/login" className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
              {t('landing.login')}
            </Link>
            <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              {t('landing.signUp')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('landing.heroSubtitle')}
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            {t('landing.ctaStart')}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.features')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{t('landing.smartBookings')}</h3>
              <p className="text-gray-600">{t('landing.smartBookingsDesc')}</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{t('landing.callLogs')}</h3>
              <p className="text-gray-600">{t('landing.callLogsDesc')}</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{t('landing.analytics')}</h3>
              <p className="text-gray-600">{t('landing.analyticsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">{t('landing.ctaTransform')}</h2>
          <p className="text-lg mb-8">{t('landing.ctaJoin')}</p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            {t('landing.ctaTrial')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>{t('landing.footerCopy')}</p>
        </div>
      </footer>
    </div>
  );
}
