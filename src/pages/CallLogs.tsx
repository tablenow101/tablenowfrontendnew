import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../lib/api';
import { Phone, Clock, Calendar, X } from 'lucide-react';

const CallLogs: React.FC = () => {
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCall, setSelectedCall] = useState<any>(null);

    useEffect(() => {
        fetchCalls();
    }, []);

    const fetchCalls = async () => {
        try {
            const response = await dashboardAPI.getCalls();
            setCalls(response.data.calls || []);
        } catch (error) {
            console.error('Failed to fetch calls:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading w-12 h-12"></div>
            </div>
        );
    }

    const completedCount = calls.filter(c => c.status === 'completed').length;
    const avgDuration = calls.length > 0
        ? Math.floor(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
        : 0;
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Call Logs</h1>
                <p className="text-sm text-gray-500 mt-0.5">View all AI assistant call history</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Calls</p>
                    <p className="text-3xl font-bold text-white">{calls.length}</p>
                </div>
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Completed</p>
                    <p className="text-3xl font-bold text-green-400">{completedCount}</p>
                </div>
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Duration</p>
                    <p className="text-3xl font-bold text-white">{formatDuration(avgDuration)}</p>
                </div>
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Duration</p>
                    <p className="text-3xl font-bold text-white">{formatDuration(totalDuration)}</p>
                </div>
            </div>

            {/* Call List */}
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Call History</h2>

                {calls.length === 0 ? (
                    <div className="text-center py-12">
                        <Phone size={32} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">No calls yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {calls.map((call) => (
                            <div
                                key={call.id}
                                className="rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] p-4 hover:border-[#2a2a2a] transition-colors cursor-pointer"
                                onClick={() => setSelectedCall(call)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                                                <Phone size={14} className="text-gray-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-white">{call.caller_number || 'Unknown Number'}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(call.status)}`}>
                                                {call.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs text-gray-400 ml-10">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} />
                                                <span>{new Date(call.created_at).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} />
                                                <span>{new Date(call.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} />
                                                <span>{formatDuration(call.duration || 0)}</span>
                                            </div>
                                        </div>

                                        {call.transcript && (
                                            <div className="mt-2 ml-10 p-2 rounded-lg bg-[#0A0A0A] border border-[#1f1f1f] text-xs text-gray-400">
                                                <p className="line-clamp-2">{call.transcript}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0">
                                        {call.recording_url && (
                                            <a
                                                href={call.recording_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 rounded-xl text-xs text-white border border-[#1f1f1f] hover:bg-[#111] transition-colors bg-transparent"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Listen
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Call Detail Modal */}
            {selectedCall && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedCall(null)}
                >
                    <div
                        className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">Call Details</h2>
                            <button
                                onClick={() => setSelectedCall(null)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Caller Number</p>
                                    <p className="text-sm font-semibold text-white">{selectedCall.caller_number || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedCall.status)}`}>
                                        {selectedCall.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Date</p>
                                    <p className="text-sm font-semibold text-white">{new Date(selectedCall.created_at).toLocaleString('fr-FR')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                                    <p className="text-sm font-semibold text-white">{formatDuration(selectedCall.duration || 0)}</p>
                                </div>
                            </div>

                            {selectedCall.transcript && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Transcript</p>
                                    <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f]">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedCall.transcript}</p>
                                    </div>
                                </div>
                            )}

                            {selectedCall.recording_url && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Recording</p>
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
