import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../lib/api';
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

    const borderColor = status === 'success' ? 'var(--acc)' : status === 'error' ? 'var(--red)' : 'var(--line2)';
    const iconColor   = status === 'success' ? 'var(--acc)' : status === 'error' ? 'var(--red)' : 'var(--t2)';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{ width: '100%', maxWidth: '340px' }}>
                <div style={{
                    background: 'var(--bg1)',
                    border: '1px solid var(--line)',
                    borderTop: `2px solid ${borderColor}`,
                    borderRadius: '10px',
                    padding: '40px 32px',
                    textAlign: 'center',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        {status === 'loading' && (
                            <div style={{ color: 'var(--t2)' }}>
                                <Loader size={40} className="animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div style={{ color: iconColor }}>
                                <CheckCircle size={40} />
                            </div>
                        )}
                        {status === 'error' && (
                            <div style={{ color: iconColor }}>
                                <XCircle size={40} />
                            </div>
                        )}
                    </div>

                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', marginBottom: '10px' }}>
                        {status === 'loading' && t('auth.verify.loadingTitle')}
                        {status === 'success' && t('auth.verify.successTitle')}
                        {status === 'error'   && t('auth.verify.errorTitle')}
                    </h2>

                    <p style={{ fontSize: '13px', color: 'var(--t2)', marginBottom: '16px' }}>{message}</p>

                    {status === 'success' && (
                        <p style={{ fontSize: '12px', color: 'var(--t3)' }}>
                            {t('auth.verify.redirectLogin')}
                        </p>
                    )}

                    {status === 'error' && (
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '100%', height: '40px',
                                background: 'var(--acc)', color: '#0c0c0c',
                                border: 'none', borderRadius: '6px',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            {t('auth.verify.goLogin')}
                        </button>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--t3)' }}>
                    Table<span style={{ color: 'var(--acc)' }}>Now</span>
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
