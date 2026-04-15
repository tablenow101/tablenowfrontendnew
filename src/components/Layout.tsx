import React from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Phone,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { restaurantSlug } = useParams();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const base = `/r/${restaurantSlug}`;

    const navigation = [
        { name: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard },
        { name: 'Bookings', href: `${base}/bookings`, icon: Calendar },
        { name: 'Call Logs', href: `${base}/calls`, icon: Phone },
        { name: 'Settings', href: `${base}/settings`, icon: Settings },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Top Navigation */}
            <nav className="bg-[#111] border-b border-[#1f1f1f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14">
                        <div className="flex items-center">
                            <Link to={`${base}/dashboard`} className="text-lg font-bold text-white hover:text-green-400 transition-colors">
                                TableNow
                            </Link>
                            {user && (
                                <span className="ml-4 text-xs text-gray-500">
                                    {user.name}
                                </span>
                            )}
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                                            isActive(item.href)
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                            <button
                                onClick={logout}
                                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ml-2"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#1a1a1a]"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-[#1f1f1f]">
                        <div className="px-3 pt-2 pb-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm ${
                                            isActive(item.href)
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                            <button
                                onClick={() => { logout(); setMobileMenuOpen(false); }}
                                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
