import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
        relative overflow-hidden rounded-2xl border p-5 transition-all duration-200
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
          {change !== undefined && (
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
  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    confirmed: { label: 'Confirmé', color: 'text-green-400', dot: 'bg-green-400' },
    pending: { label: 'En attente', color: 'text-yellow-400', dot: 'bg-yellow-400' },
    cancelled: { label: 'Annulé', color: 'text-red-400', dot: 'bg-red-400' },
  };
  const cfg = statusConfig[booking.status] || statusConfig.pending;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
        <Users size={16} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{booking.guest_name || 'Client'}</p>
        <p className="text-xs text-gray-500">
          {booking.booking_time || '—'} · {booking.party_size || booking.covers || 0} couverts
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>
    </div>
  );
}

function CallCard({ call }: { call: any }) {
  const outcomeConfig: Record<string, { label: string; color: string }> = {
    completed: { label: 'Terminé', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    missed: { label: 'Manqué', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    failed: { label: 'Échoué', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    in_progress: { label: 'En cours', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  };
  const cfg = outcomeConfig[call.status] || outcomeConfig.completed;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
        <Phone size={15} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {call.caller_number || 'Inconnu'}
        </p>
        <p className="text-xs text-gray-500">
          {formatTimestamp(call.created_at || call.started_at)} · {formatDuration(call.duration || 0)}
        </p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function SetupBanner({ slug }: { slug: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 mb-6">
      <div className="p-2 rounded-xl bg-yellow-500/10">
        <Zap size={16} className="text-yellow-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-300">Configuration incomplète</p>
        <p className="text-xs text-yellow-500/80">Finalise la configuration de ton assistant IA pour commencer à recevoir des réservations.</p>
      </div>
      <Link
        to={`/r/${slug}/settings`}
        className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 whitespace-nowrap"
      >
        Configurer <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { restaurantSlug } = useParams();
  const slug = restaurantSlug || user?.slug || '';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('all');

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const today = new Date();
      let params: any = {};
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
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Bienvenue, {user?.owner_name || user?.name}</p>
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
                {r === 'today' ? "Aujourd'hui" : r === '7d' ? '7 jours' : r === '30d' ? '30 jours' : 'Tout'}
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
                <p className="text-xs text-gray-500 mb-1">Numéro IA</p>
                <p className="text-base font-bold text-white font-mono">{user.vapi_phone_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#111] border border-[#1f1f1f]">
              <div className="p-2.5 rounded-xl bg-[#1a1a1a]">
                <Calendar size={18} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 mb-1">BCC Email</p>
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
            label="Réservations"
            value={totalBookings}
            sub={`${confirmedBookings} confirmées`}
            icon={Calendar}
            href={`/r/${slug}/bookings`}
            accent={totalBookings > 0}
          />
          <StatCard
            label="Appels"
            value={totalCalls}
            sub={`${stats?.calls?.successful || totalCalls} traités`}
            icon={Phone}
            href={`/r/${slug}/calls`}
          />
          <StatCard
            label="Couverts"
            value={totalGuests}
            sub={totalGuests > 0 ? `Moy. ${Math.round(totalGuests / Math.max(totalBookings, 1))} / rés.` : undefined}
            icon={Users}
            href={`/r/${slug}/bookings`}
          />
          <StatCard
            label="Durée moy."
            value={formatDuration(avgCallDuration)}
            sub="par appel"
            icon={Clock}
            href={`/r/${slug}/calls`}
          />
        </div>

        {/* Booking status + Operational metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Booking Status */}
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Statut des réservations</h2>
              <Link to={`/r/${slug}/bookings`} className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1">
                Voir tout <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Confirmées', value: confirmedBookings, total: Math.max(totalBookings, 1), color: 'bg-green-500' },
                { label: 'Annulées', value: cancelledBookings, total: Math.max(totalBookings, 1), color: 'bg-red-500' },
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
                <span className="text-xs text-gray-500">Taux de succès</span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-sm font-bold text-green-400">{successRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational metrics */}
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Métriques opérationnelles</h2>
            <div className="space-y-4">
              {stats?.bookings?.bySource && Object.keys(stats.bookings.bySource).length > 0 ? (
                Object.entries(stats.bookings.bySource).map(([source, count]: any) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">{source}</span>
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-xs text-gray-600">Données disponibles une fois</p>
                  <p className="text-xs text-gray-600">les premières réservations reçues</p>
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
              <h2 className="text-sm font-semibold text-white">Réservations récentes</h2>
              <Link to={`/r/${slug}/bookings`} className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1">
                Voir tout <ArrowUpRight size={11} />
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Calendar size={24} className="text-gray-700 mb-3" />
                <p className="text-xs text-gray-600">Aucune réservation pour l'instant</p>
                <p className="text-xs text-gray-700 mt-1">Les réservations apparaîtront ici</p>
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
              <h2 className="text-sm font-semibold text-white">Appels récents</h2>
              <Link to={`/r/${slug}/calls`} className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1">
                Voir tout <ArrowUpRight size={11} />
              </Link>
            </div>
            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Phone size={24} className="text-gray-700 mb-3" />
                <p className="text-xs text-gray-600">Aucun appel pour l'instant</p>
                <p className="text-xs text-gray-700 mt-1">Les appels apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCalls.slice(0, 4).map((c: any) => (
                  <CallCard key={c.id} call={c} />
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
