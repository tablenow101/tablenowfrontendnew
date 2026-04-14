import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        restaurantName: '',
        ownerName: '',
        phone: '',
        address: '',
        website: '',
        cuisineType: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    // Autocomplete state
    const [suggestions, setSuggestions]     = useState<any[]>([]);
    const [showDropdown, setShowDropdown]   = useState(false);
    const [loadingSuggest, setLoadingSuggest] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function handleRestaurantNameChange(value: string) {
        setFormData((prev) => ({ ...prev, restaurantName: value }));
        setShowDropdown(false);

        if (value.length < 2) { setSuggestions([]); return; }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoadingSuggest(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/restaurants/autocomplete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: value }),
                });
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setShowDropdown(true);
            } catch { setSuggestions([]); }
            finally { setLoadingSuggest(false); }
        }, 300);
    }

    async function handleSelectSuggestion(placeId: string, name: string) {
        setFormData((prev) => ({ ...prev, restaurantName: name }));
        setShowDropdown(false);
        setSuggestions([]);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/restaurants/prefill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id: placeId }),
            });
            const data = await res.json();
            setFormData((prev) => ({
                ...prev,
                restaurantName: data.name  || prev.restaurantName,
                phone:          data.phone || prev.phone,
                address:        data.address || prev.address,
                website:        data.website || prev.website,
                cuisineType:    data.cuisine_type || prev.cuisineType,
            }));
        } catch { /* silent — user can fill manually */ }
    }

    async function handleWebsiteBlur() {
        if (!formData.website || formData.website.length < 5) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/restaurants/prefill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ website_url: formData.website }),
            });
            const data = await res.json();
            setFormData((prev) => ({
                ...prev,
                restaurantName: prev.restaurantName || data.name || '',
                phone:          prev.phone || data.phone || '',
                address:        prev.address || data.address || '',
                cuisineType:    prev.cuisineType || data.cuisine_type || '',
            }));
        } catch { /* silent */ }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            await register(formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-green-50 border-4 border-green-500 rounded-2xl p-8">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-500 text-white p-4 rounded-full">
                                <CheckCircle size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
                        <p className="text-gray-700 mb-4">
                            Please check your email to verify your account. We've sent a verification link to{' '}
                            <strong>{formData.email}</strong>
                        </p>
                        <p className="text-sm text-gray-600">Redirecting to login...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">TableNow</h1>
                    <p className="text-gray-600">Your Restaurant Hostess 24/7</p>
                </div>

                <div className="bg-white border-4 border-black rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-black text-white p-4 rounded-full">
                            <UserPlus size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-6">Create Your Account</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Restaurant Name *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Le Petit Bistrot"
                                        value={formData.restaurantName}
                                        onChange={(e) => handleRestaurantNameChange(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                        className="input w-full"
                                        autoComplete="off"
                                        required
                                    />
                                    {loadingSuggest && (
                                        <div className="absolute right-3 top-3 text-gray-400 text-xs">...</div>
                                    )}
                                    {showDropdown && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                            {suggestions.map((s) => (
                                                <li
                                                    key={s.placeId}
                                                    onMouseDown={() => handleSelectSuggestion(s.placeId, s.name)}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                                >
                                                    <span className="font-medium">{s.name}</span>
                                                    <span className="text-gray-400 ml-2 text-xs">{s.address}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Owner Name *</label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="contact@restaurant.com"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="••••••••"
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
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Cuisine Type</label>
                                <input
                                    type="text"
                                    name="cuisineType"
                                    value={formData.cuisineType}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Italian, French, etc."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input"
                                placeholder="123 Main St, City, Country"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Website</label>
                            <input
                                type="url"
                                placeholder="https://votre-restaurant.fr"
                                value={formData.website || ''}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                onBlur={handleWebsiteBlur}
                                className="input w-full"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="loading mr-2"></span>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-black font-semibold hover:underline">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
