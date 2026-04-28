import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../lib/api';
import LanguageToggle from '../components/LanguageToggle';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        verifyEmail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verifyEmail = async () => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage(t('auth.verify.invalidLink'));
            return;
        }

        try {
            const response = await authAPI.verifyEmail(token);
            setStatus('success');
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.error || t('auth.verify.verificationFailed'));
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="flex justify-end mb-4">
                    <LanguageToggle variant="light" />
                </div>
                <div className="text-center">
                    <div className={`border-4 rounded-2xl p-8 ${status === 'success' ? 'bg-green-50 border-green-500' :
                        status === 'error' ? 'bg-red-50 border-red-500' :
                            'bg-gray-50 border-gray-300'
                        }`}>
                        <div className="flex justify-center mb-4">
                            {status === 'loading' && (
                                <div className="bg-gray-500 text-white p-4 rounded-full">
                                    <Loader size={48} className="animate-spin" />
                                </div>
                            )}
                            {status === 'success' && (
                                <div className="bg-green-500 text-white p-4 rounded-full">
                                    <CheckCircle size={48} />
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="bg-red-500 text-white p-4 rounded-full">
                                    <XCircle size={48} />
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold mb-4">
                            {status === 'loading' && t('auth.verify.loadingTitle')}
                            {status === 'success' && t('auth.verify.successTitle')}
                            {status === 'error'   && t('auth.verify.errorTitle')}
                        </h2>

                        <p className="text-gray-700 mb-4">{message}</p>

                        {status === 'success' && (
                            <p className="text-sm text-gray-600">
                                {t('auth.verify.redirectLogin')}
                            </p>
                        )}

                        {status === 'error' && (
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-primary"
                            >
                                {t('auth.verify.goLogin')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
