import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, AlertCircle, Key } from 'lucide-react';

import { sanitizeEmail } from '../utils/sanitize';

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

    // Reset mode when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setIsSignUp(initialMode === 'signup');
        }
    }, [isOpen, initialMode]);

    // Lock body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showSuccess, setShowSuccess] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    if (!isOpen) return null;

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
                // Verify Access Code Securely via RPC
                const { data: isValid, error: rpcError } = await supabase.rpc('verify_cohort_code', {
                    code: accessCode
                });

                if (rpcError) {
                    console.error('RPC Error:', rpcError);
                    throw new Error('Failed to verify access code. Please try again.');
                }

                if (!isValid) {
                    throw new Error('Invalid Access Code. Please contact the administrator.');
                }

                const { error } = await supabase.auth.signUp({
                    email: sanitizedEmail,
                    password,
                });
                if (error) throw error;
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <h2 className="text-xl font-bold text-slate-100">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
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
