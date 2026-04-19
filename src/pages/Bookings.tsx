import React, { useEffect, useState } from 'react';
import { bookingsAPI } from '../lib/api';
import { Calendar, Users, Clock, Mail, Phone, Search, Filter, Plus, XCircle, CheckCircle } from 'lucide-react';

const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const fetchBookings = async () => {
        try {
            const params: any = {};
            if (filter !== 'all') params.status = filter;
            const response = await bookingsAPI.getAll(params);
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBookingName = (booking: any) => {
        return booking.guest_name || 'Caller';
    };

    const getBookingDateTime = (booking: any) => {
        if (booking.booked_for) {
            const date = new Date(booking.booked_for);
            return date.toLocaleDateString('fr-FR');
        }
        return booking.booking_date || '—';
    };

    const getBookingTime = (booking: any) => {
        if (booking.booked_for) {
            const date = new Date(booking.booked_for);
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        return booking.booking_time || '—';
    };

    const getGuestCount = (booking: any) => {
        return booking.covers || booking.party_size || 0;
    };

    const filteredBookings = bookings.filter(booking =>
        getBookingName(booking).toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'phone': return <Phone size={14} />;
            case 'manual': return <Plus size={14} />;
            default: return <Mail size={14} />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="loading w-12 h-12"></div>
            </div>
        );
    }

    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const totalGuests = bookings.reduce((sum, b) => sum + getGuestCount(b), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Bookings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage all your reservations</p>
            </div>

            {/* Filters and Search */}
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or confirmation number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#1f1f1f] text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl text-sm bg-[#0f0f0f] border border-[#1f1f1f] text-white focus:outline-none focus:border-green-500/50 transition-colors"
                        >
                            <option value="all">All Bookings</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                    <p className="text-3xl font-bold text-white">{bookings.length}</p>
                </div>
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Confirmed</p>
                    <p className="text-3xl font-bold text-green-400">{confirmedCount}</p>
                </div>
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Cancelled</p>
                    <p className="text-3xl font-bold text-red-400">{cancelledCount}</p>
                </div>
                <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 h-28 flex flex-col justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Guests</p>
                    <p className="text-3xl font-bold text-white">{totalGuests}</p>
                </div>
            </div>

            {/* Bookings List */}
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
                <h2 className="text-sm font-semibold text-white mb-4">All Bookings</h2>

                {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar size={32} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">No bookings found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] p-4 hover:border-[#2a2a2a] transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-sm font-semibold text-white">{getBookingName(booking)}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                {getSourceIcon(booking.source)}
                                                <span>{booking.source}</span>
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} />
                                                <span>{getBookingDateTime(booking)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} />
                                                <span>{getBookingTime(booking)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users size={13} />
                                                <span>{getGuestCount(booking)} guests</span>
                                            </div>
                                            {booking.guest_email && (
                                                <div className="flex items-center gap-1.5">
                                                    <Mail size={13} />
                                                    <span className="truncate max-w-[200px]">{booking.guest_email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {booking.special_requests && (
                                            <div className="mt-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-400/80">
                                                <strong>Special Requests:</strong> {booking.special_requests}
                                            </div>
                                        )}

                                        {booking.confirmation_number && (
                                            <div className="mt-2 text-xs text-gray-600">
                                                Confirmation: <span className="font-mono font-medium text-gray-400">{booking.confirmation_number}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0">
                                        {booking.status === 'confirmed' && (
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to cancel this booking?')) {
                                                        bookingsAPI.cancel(booking.id).then(() => fetchBookings());
                                                    }
                                                }}
                                                className="px-3 py-1.5 rounded-xl text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookings;
