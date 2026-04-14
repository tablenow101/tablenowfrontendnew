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

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-black text-white border-b-4 border-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to={`${base}/dashboard`} className="text-2xl font-bold hover:opacity-80 transition-opacity">
                                TableNow
                            </Link>
                            {user && (
                                <span className="ml-4 text-sm text-gray-300">
                                    {user.name}
                                </span>
                            )}
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-4">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive(item.href)
                                                ? 'bg-white text-black'
                                                : 'text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                            <button
                                onClick={logout}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-red-600 transition-all duration-200"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-white hover:bg-gray-800 p-2 rounded-lg"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-700">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isActive(item.href)
                                                ? 'bg-white text-black'
                                                : 'text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                            <button
                                onClick={() => {
                                    logout();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:bg-red-600"
                            >
                                <LogOut size={18} />
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
