import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../lib/api';
import { Phone, Clock, Calendar, X, Download, Mic } from 'lucide-react';

function formatDuration(seconds: number): string {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m${s.toString().padStart(2, '0')}s` : `${s}s`;
}

const CallLogs: React.FC = () => {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'fr-FR';
    const [calls, setCalls]             = useState<any[]>([]);
    const [loading, setLoading]         = useState(true);
    const [selectedCall, setSelectedCall] = useState<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await dashboardAPI.getCalls();
                setCalls(res.data.calls || []);
            } catch (err) {
                console.error(t('calls.loadError'), err);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const statusCfg = (status: string) => {
        const key = (['completed', 'in_progress', 'failed', 'missed'] as const).includes(status as any)
            ? status as 'completed' | 'in_progress' | 'failed' | 'missed'
            : 'completed';
        const cls = {
            completed:   'bg-green-500/10 text-green-400 border-green-500/20',
            in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            failed:      'bg-red-500/10 text-red-400 border-red-500/20',
            missed:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        }[key];
        return { label: t(`calls.statuses.${key}`), cls };
    };

    function downloadTranscript(call: any) {
        if (!call.transcript) return;
        const content = `${t('calls.transcriptHeader')}\n${'='.repeat(40)}\n\n${t('calls.callerNumber')}: ${call.caller_number || t('calls.unknownNumber')}\n${t('calls.dateTime')}: ${new Date(call.created_at).toLocaleString(localeTag)}\n${t('calls.duration')}: ${formatDuration(call.duration || 0)}\n${t('calls.status')}: ${call.status}\n\n${t('calls.transcript').toUpperCase()}:\n${'-'.repeat(40)}\n\n${call.transcript}`;
        const a = document.createElement('a');
        a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        a.download = `transcript_${call.caller_number || 'unknown'}_${new Date(call.created_at).toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading w-12 h-12" />
            </div>
        );
    }

    const completedCount = calls.filter(c => c.status === 'completed').length;
    const avgDuration    = calls.length > 0 ? Math.floor(calls.reduce((s, c) => s + (c.duration || 0), 0) / calls.length) : 0;
    const totalDuration  = calls.reduce((s, c) => s + (c.duration || 0), 0);

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">{t('calls.title')}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{t('calls.subtitle')}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: t('calls.statTotal'),         value: calls.length,           color: 'text-white'     },
                    { label: t('calls.statCompleted'),     value: completedCount,          color: 'text-green-400' },
                    { label: t('calls.statAvgDuration'),   value: formatDuration(avgDuration),  color: 'text-white' },
                    { label: t('calls.statTotalDuration'), value: formatDuration(totalDuration), color: 'text-white' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
                <h2 className="text-sm font-semibold text-white mb-4">{t('calls.history')}</h2>

                {calls.length === 0 ? (
                    <div className="text-center py-12">
                        <Phone size={32} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">{t('calls.noCalls1')}</p>
                        <p className="text-xs text-gray-700 mt-1">{t('calls.noCalls2')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {calls.map((call) => {
                            const st = statusCfg(call.status);
                            return (
                                <div
                                    key={call.id}
                                    onClick={() => setSelectedCall(call)}
                                    className="rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] p-4 hover:border-[#2a2a2a] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                                            <Phone size={14} className="text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <p className="text-sm font-semibold text-white">{call.caller_number || t('calls.unknownNumber')}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>{st.label}</span>
                                                {call.reservation_booked && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                                        {t('calls.bookingCreated')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    {new Date(call.created_at).toLocaleDateString(localeTag)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {new Date(call.created_at).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Mic size={12} />
                                                    {formatDuration(call.duration || 0)}
                                                </span>
                                            </div>
                                            {call.call_summary && (
                                                <p className="mt-1.5 text-xs text-gray-500 line-clamp-1">{call.call_summary}</p>
                                            )}
                                        </div>
                                        {call.recording_url && (
                                            <a
                                                href={call.recording_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs text-white border border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors"
                                            >
                                                {t('calls.listen')}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedCall && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCall(null)}>
                    <div
                        className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{t('calls.callDetails')}</h2>
                            <button onClick={() => setSelectedCall(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">{t('calls.callerNumber')}</p>
                                    <p className="text-sm font-semibold text-white font-mono">{selectedCall.caller_number || t('calls.unknownNumber')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">{t('calls.status')}</p>
                                    {(() => {
                                        const st = statusCfg(selectedCall.status);
                                        return (
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>
                                                {st.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">{t('calls.dateTime')}</p>
                                    <p className="text-sm font-semibold text-white">{new Date(selectedCall.created_at).toLocaleString(localeTag)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">{t('calls.duration')}</p>
                                    <p className="text-sm font-semibold text-white">{formatDuration(selectedCall.duration || 0)}</p>
                                </div>
                                {selectedCall.reservation_booked !== null && selectedCall.reservation_booked !== undefined && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('calls.bookingMade')}</p>
                                        <p className={`text-sm font-semibold ${selectedCall.reservation_booked ? 'text-green-400' : 'text-gray-400'}`}>
                                            {selectedCall.reservation_booked ? t('calls.yes') : t('calls.no')}
                                        </p>
                                    </div>
                                )}
                                {selectedCall.customer_sentiment && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('calls.customerSentiment')}</p>
                                        <p className="text-sm font-semibold text-white capitalize">{selectedCall.customer_sentiment}</p>
                                    </div>
                                )}
                            </div>

                            {selectedCall.call_summary && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">{t('calls.summary')}</p>
                                    <div className="p-3 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-sm text-gray-300">
                                        {selectedCall.call_summary}
                                    </div>
                                </div>
                            )}

                            {selectedCall.transcript && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-gray-500">{t('calls.transcript')}</p>
                                        <button
                                            onClick={() => downloadTranscript(selectedCall)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-400 hover:text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors"
                                        >
                                            <Download size={14} /> {t('calls.download')}
                                        </button>
                                    </div>
                                    <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] max-h-64 overflow-y-auto">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedCall.transcript}</p>
                                    </div>
                                </div>
                            )}

                            {selectedCall.recording_url && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">{t('calls.recording')}</p>
                                    <audio controls className="w-full">
                                        <source src={selectedCall.recording_url} type="audio/mpeg" />
                                    </audio>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallLogs;
