import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, AlertCircle, Key } from 'lucide-react';
import { sanitizeEmail } from '../utils/sanitize';
import { useModalA11y } from '../hooks/useModalA11y';

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

    // Reset mode when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setIsSignUp(initialMode === 'signup');
        }
    }, [isOpen, initialMode]);

    const modalRef = useModalA11y(isOpen, onClose);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showSuccess, setShowSuccess] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const sanitizedEmail = sanitizeEmail(email);
            if (!sanitizedEmail) throw new Error('Please enter a valid email address');
            const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setResetSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const sanitizedEmail = sanitizeEmail(email);
            if (!sanitizedEmail) {
                throw new Error('Please enter a valid email address');
            }
            if (isSignUp) {
                // Atomic server-side verification + signup via Edge Function
                const res = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        },
                        body: JSON.stringify({
                            email: sanitizedEmail,
                            password,
                            accessCode,
                        }),
                    }
                );
                const result = await res.json();
                if (!res.ok) {
                    throw new Error(result.error || 'Signup failed. Please try again.');
                }
                setShowSuccess(true);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: sanitizedEmail,
                    password,
                });
                if (error) throw error;
                onClose();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (resetSent) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                            <Mail className="text-emerald-500" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                        <p className="text-slate-400 mb-6">
                            We&apos;ve sent a password reset link to <span className="text-emerald-400">{email}</span>.
                        </p>
                        <button
                            onClick={() => { setResetMode(false); setResetSent(false); onClose(); }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (resetMode) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h2 className="text-xl font-bold text-slate-100">Reset Password</h2>
                            <button onClick={() => { setResetMode(false); onClose(); }} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                            <p className="text-sm text-slate-400">Enter your email and we&apos;ll send you a link to reset your password.</p>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
                            </button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => { setResetMode(false); setError(null); }}
                                    className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                            <Mail className="text-emerald-500" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                        <p className="text-slate-400 mb-6">
                            We've sent a confirmation link to <span className="text-emerald-400">{email}</span>.
                            <br />
                            Please click the link to activate your account.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg transition-all mb-3"
                        >
                            Close
                        </button>

                        <button
                            onClick={async () => {
                                const { error } = await supabase.auth.resend({
                                    type: 'signup',
                                    email: email,
                                });
                                if (error) alert(error.message);
                                else alert('Confirmation email resent!');
                            }}
                            className="text-xs text-emerald-500 hover:text-emerald-400 hover:underline"
                        >
                            Resend Confirmation Link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" tabIndex={-1} className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 outline-none">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <h2 id="auth-modal-title" className="text-xl font-bold text-slate-100">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {isSignUp && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                <label className="text-sm font-medium text-emerald-400">Access Code</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        className="w-full bg-slate-950 border border-emerald-500/30 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="Enter cohort code"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Restricted to Lagos Bio-Design Cohort 1</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-slate-900 px-2 text-slate-500">or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleGoogleSignIn}
                            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </button>

                        {!isSignUp && (
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => { setResetMode(true); setError(null); }}
                                    className="text-xs text-slate-500 hover:text-emerald-400 hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <div className="text-center text-sm text-slate-500 mt-4">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
