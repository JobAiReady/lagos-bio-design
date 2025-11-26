import React, { useState, useEffect } from 'react';
import { BrainCircuit, User, LogOut, LayoutGrid, Terminal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';
import { Link, useLocation } from 'react-router-dom';

const JobAiReadyHeader = () => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="bg-slate-950 border-b border-slate-800 py-2 px-4 sticky top-0 z-50 backdrop-blur-md bg-slate-950/80">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo & Nav */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                        <BrainCircuit size={18} className="text-emerald-500" />
                        <span className="text-xs font-mono tracking-widest uppercase hidden sm:inline">
                            JobAiReady.ai <span className="text-slate-600 mx-2">//</span> Intelligent Ecosystem
                        </span>
                        <span className="text-xs font-mono tracking-widest uppercase sm:hidden">
                            LBD
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={`text-xs uppercase tracking-wider font-medium transition-colors ${isActive('/') ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Bootcamp
                        </Link>
                        <Link
                            to="/gallery"
                            className={`text-xs uppercase tracking-wider font-medium transition-colors flex items-center gap-1 ${isActive('/gallery') ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <LayoutGrid size={12} />
                            Gallery
                        </Link>
                        <Link
                            to="/workspace"
                            className={`text-xs uppercase tracking-wider font-medium transition-colors flex items-center gap-1 ${isActive('/workspace') ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Terminal size={12} />
                            Workspace
                        </Link>
                    </nav>
                </div>

                {/* User Controls */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 hidden lg:inline">{user.email}</span>
                            <button
                                onClick={handleSignOut}
                                className="text-slate-400 hover:text-red-400 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                            <div className="h-6 w-6 rounded-full bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-emerald-500 relative group cursor-pointer">
                                <User size={14} />
                                <span className="absolute top-0 right-0 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider border border-emerald-500/30 px-3 py-1 rounded hover:bg-emerald-500/10"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </div>
    );
};

export default JobAiReadyHeader;
