import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Phone, Calendar, Users, Clock, TrendingUp, TrendingDown,
  ChevronRight, Copy, ArrowUpRight, Zap, Star
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m${s.toString().padStart(2, '0')}s` : `${m}m`;
}

function formatTimestamp(ts: string, localeTag: string): string {
  const d = new Date(ts);
  return d.toLocaleString(localeTag, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, change, icon: Icon, href, accent = false,
}: {
  label: string; value: string | number; sub?: string; change?: number;
  icon: React.ElementType; href: string; accent?: boolean;
}) {
  const positive = change !== undefined && change >= 0;
  return (
    <Link to={href} className="group block">
      <div className={`
        relative overflow-hidden rounded-2xl border p-5 h-28 transition-all duration-200
        hover:border-green-500/40 hover:shadow-[0_0_24px_rgba(34,197,94,0.08)]
        ${accent ? 'bg-green-500/10 border-green-500/20' : 'bg-[#111] border-[#1f1f1f]'}
      `}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-xl ${accent ? 'bg-green-500/20' : 'bg-[#1a1a1a]'}`}>
            <Icon size={18} className={accent ? 'text-green-400' : 'text-gray-400'} />
          </div>
          <ChevronRight size={14} className="text-gray-600 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {sub && <p className="text-xs text-green-400 font-medium">{sub}</p>}
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
          {change !== undefined && change !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
              {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function BookingCard({ booking }: { booking: any }) {
  const { t } = useTranslation();
  const statusKey = (['confirmed', 'pending', 'cancelled'] as const).includes(booking.status as any)
    ? booking.status as 'confirmed' | 'pending' | 'cancelled'
    : 'pending';
  const statusLabel = statusKey === 'confirmed'
    ? t('bookings.status.confirmed')
    : statusKey === 'cancelled'
      ? t('bookings.status.cancelled')
      : t('common.loading'); // 'pending' fallback to "..." indicator
  const dotCls = statusKey === 'confirmed' ? 'bg-green-400' : statusKey === 'cancelled' ? 'bg-red-400' : 'bg-yellow-400';
  const colorCls = statusKey === 'confirmed' ? 'text-green-400' : statusKey === 'cancelled' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
        <Users size={16} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{booking.guest_name || t('dashboard.guest')}</p>
        <p className="text-xs text-gray-500">
          {booking.booking_time || '—'} · {booking.party_size || booking.covers || 0} {t('dashboard.coversShort')}
          {booking.occasion && ` · ${booking.occasion}`}
          {booking.table && ` · ${t('dashboard.table')} ${booking.table}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
        <span className={`text-xs font-medium ${colorCls}`}>{statusLabel}</span>
      </div>
    </div>
  );
}

function CallCard({ call, localeTag }: { call: any; localeTag: string }) {
  const { t } = useTranslation();
  const statusKey = (['completed', 'in_progress', 'failed', 'missed'] as const).includes(call.status as any)
    ? call.status as 'completed' | 'in_progress' | 'failed' | 'missed'
    : 'completed';
  const cls = {
    completed:   'bg-green-500/10 text-green-400 border-green-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    failed:      'bg-red-500/10 text-red-400 border-red-500/20',
    missed:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }[statusKey];

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
        <Phone size={15} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {call.caller_number || t('common.unknown')}
        </p>
        <p className="text-xs text-gray-500">
          {formatTimestamp(call.created_at || call.started_at, localeTag)} · {formatDuration(call.duration || 0)}
        </p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>
        {t(`calls.statuses.${statusKey}`)}
      </span>
    </div>
  );
}

function SetupBanner({ slug }: { slug: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 mb-6">
      <div className="p-2 rounded-xl bg-yellow-500/10">
        <Zap size={16} className="text-yellow-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-300">{t('dashboard.setupBanner.title')}</p>
        <p className="text-xs text-yellow-500/80">{t('dashboard.setupBanner.subtitle')}</p>
      </div>
      <Link
        to={`/r/${slug}/settings`}
        className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 whitespace-nowrap"
      >
        {t('dashboard.setupBanner.cta')} <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const localeTag = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'fr-FR';
  const { restaurantSlug } = useParams();
  const slug = restaurantSlug || user?.slug || '';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('all');

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const today = new Date();
      let params: any = { dateRange };
      if (dateRange === 'today') {
        params.startDate = today.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      } else if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : 30;
        const start = new Date();
        start.setDate(start.getDate() - days);
        params.startDate = start.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }
      const response = await dashboardAPI.getStats(params);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading w-12 h-12"></div>
      </div>
    );
  }

  const totalBookings = stats?.bookings?.total || 0;
  const confirmedBookings = stats?.bookings?.confirmed || 0;
  const cancelledBookings = stats?.bookings?.cancelled || 0;
  const totalCalls = stats?.calls?.total || 0;
  const totalGuests = stats?.bookings?.totalGuests || 0;
  const avgCallDuration = stats?.calls?.avgDuration || 0;
  const successRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;
  const recentBookings = stats?.recent?.bookings || [];
  const recentCalls = stats?.recent?.calls || [];
  const isSetupIncomplete = !user?.vapi_assistant_id || (totalCalls === 0 && totalBookings === 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('dashboard.welcome')} {user?.owner_name || user?.name}</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-[#111] border border-[#1f1f1f]">
            {(['today', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === r ? 'bg-green-500 text-black' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t(`dashboard.ranges.${r}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Setup banner */}
        {isSetupIncomplete && <SetupBanner slug={slug} />}

        {/* Identity cards */}
        {user?.vapi_phone_number && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#111] border border-[#1f1f1f]">
              <div className="p-2.5 rounded-xl bg-[#1a1a1a]">
                <Phone size={18} className="text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">{t('dashboard.iaPhone')}</p>
                <p className="text-base font-bold text-white font-mono">{user.vapi_phone_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#111] border border-[#1f1f1f]">
              <div className="p-2.5 rounded-xl bg-[#1a1a1a]">
                <Calendar size={18} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 mb-1">{t('dashboard.bccEmail')}</p>
                <p className="text-xs text-white font-mono truncate">{user.bcc_email || '—'}</p>
              </div>
              {user.bcc_email && (
                <button
                  onClick={() => navigator.clipboard.writeText(user.bcc_email)}
                  className="p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors flex-shrink-0"
                >
                  <Copy size={13} className="text-gray-500 hover:text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t('dashboard.stats.bookings')}
            value={totalBookings}
            sub={t('dashboard.stats.bookingsConfirmed', { count: confirmedBookings })}
            change={stats?.bookings?.change}
            icon={Calendar}
            href={`/r/${slug}/bookings`}
            accent={totalBookings > 0}
          />
          <StatCard
            label={t('dashboard.stats.calls')}
            value={totalCalls}
            sub={t('dashboard.stats.callsHandled', { count: stats?.calls?.successful || totalCalls })}
            change={stats?.calls?.change}
            icon={Phone}
            href={`/r/${slug}/calls`}
          />
          <StatCard
            label={t('dashboard.stats.guests')}
            value={totalGuests}
            sub={totalGuests > 0 ? t('dashboard.stats.avgPerBooking', { count: Math.round(totalGuests / Math.max(totalBookings, 1)) }) : undefined}
            change={stats?.bookings?.guestsChange}
            icon={Users}
            href={`/r/${slug}/bookings`}
          />
          <StatCard
            label={t('dashboard.stats.avgDuration')}
            value={formatDuration(avgCallDuration)}
            sub={t('dashboard.stats.perCall')}
            change={stats?.calls?.durationChange}
            icon={Clock}
            href={`/r/${slug}/calls`}
          />
        </div>

        {/* Booking status + Operational metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Booking Status */}
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{t('dashboard.bookingStatus')}</h2>
              <Link to={`/r/${slug}/bookings`} className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1">
                {t('common.viewAll')} <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: t('dashboard.confirmed'), value: confirmedBookings, total: Math.max(totalBookings, 1), color: 'bg-green-500' },
                { label: t('dashboard.cancelled'), value: cancelledBookings, total: Math.max(totalBookings, 1), color: 'bg-red-500' },
              ].map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${Math.round((value / total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
                <span className="text-xs text-gray-500">{t('dashboard.successRate')}</span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-sm font-bold text-green-400">{successRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational metrics */}
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">{t('dashboard.operationalMetrics')}</h2>
            <div className="space-y-4">
              {stats?.pacing !== undefined && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">{t('dashboard.pacingTonight')}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${stats.pacing >= 85 ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                      <span className="text-sm font-bold text-white">{stats.pacing}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-700"
                      style={{ width: `${stats.pacing}%` }}
                    />
                  </div>
                  {stats.pacing >= 85 && (
                    <p className="text-xs text-green-500 mt-1">{t('dashboard.highDemand')}</p>
                  )}
                </div>
              )}
              {stats?.turnoverRate !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{t('dashboard.turnoverRate')}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">{stats.turnoverRate.toFixed(1)}</span>
                    <span className="text-xs text-gray-600 ml-1">/ 2.1</span>
                  </div>
                </div>
              )}
              {stats?.vipsTonight !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={13} className="text-yellow-400" />
                    <span className="text-xs text-gray-400">{t('dashboard.vipsTonight')}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{String(stats.vipsTonight).padStart(2, '0')}</span>
                </div>
              )}
              {stats?.pacing === undefined && stats?.turnoverRate === undefined && stats?.vipsTonight === undefined && (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-xs text-gray-600">{t('dashboard.noDataYet1')}</p>
                  <p className="text-xs text-gray-600">{t('dashboard.noDataYet2')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings + Recent Calls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Bookings */}
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">{t('dashboard.recentBookings')}</h2>
              <Link to={`/r/${slug}/bookings`} className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1">
                {t('common.viewAll')} <ArrowUpRight size={11} />
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Calendar size={24} className="text-gray-700 mb-3" />
                <p className="text-xs text-gray-600">{t('dashboard.noBookings1')}</p>
                <p className="text-xs text-gray-700 mt-1">{t('dashboard.noBookings2')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBookings.slice(0, 4).map((b: any) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Calls */}
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">{t('dashboard.recentCalls')}</h2>
              <Link to={`/r/${slug}/calls`} className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1">
                {t('common.viewAll')} <ArrowUpRight size={11} />
              </Link>
            </div>
            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Phone size={24} className="text-gray-700 mb-3" />
                <p className="text-xs text-gray-600">{t('dashboard.noCalls1')}</p>
                <p className="text-xs text-gray-700 mt-1">{t('dashboard.noCalls2')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCalls.slice(0, 4).map((c: any) => (
                  <CallCard key={c.id} call={c} localeTag={localeTag} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
