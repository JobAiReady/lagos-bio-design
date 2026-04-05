import React, { useState, useRef, useEffect } from 'react';
import {
    Play, Settings, ArrowLeft, Loader2, Upload, Bot, Cpu, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const WorkspaceTopBar = ({ navigate, user, isRunning, isPythonReady, onRun, onPublish, isAiOpen, onToggleAi }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('workspace-settings');
        return saved ? JSON.parse(saved) : { fontSize: 14, tabSize: 4, wordWrap: true, autoSave: true, theme: 'dark' };
    });
    const settingsRef = useRef(null);
    const profileRef = useRef(null);

    // Persist settings
    useEffect(() => {
        localStorage.setItem('workspace-settings', JSON.stringify(settings));
    }, [settings]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) setIsSettingsOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="h-12 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 select-none shrink-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 transition-colors"
                    title="Back to Dashboard"
                    aria-label="Back to Dashboard"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Cpu size={16} className="text-emerald-500 hidden sm:block" />
                    <span className="hidden sm:inline">JobAiReady Workspace</span>
                    <span className="text-slate-600 hidden sm:inline">/</span>
                    <span>Lab-01</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onRun}
                    disabled={isRunning || !isPythonReady}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isRunning || !isPythonReady
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                        }`}
                >
                    {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {isRunning ? 'RUNNING...' : 'RUN SCRIPT'}
                </button>

                <button
                    onClick={onPublish}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                    title="Publish to Gallery"
                >
                    <Upload size={14} />
                    <span className="hidden sm:inline">PUBLISH</span>
                </button>

                <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

                <button
                    onClick={onToggleAi}
                    className={`p-2 rounded-md transition-colors ${isAiOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
                    title="Toggle AI Assistant"
                    aria-label="Toggle AI Assistant"
                    aria-pressed={isAiOpen}
                >
                    <Bot size={18} />
                </button>

                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsProfileOpen(false); }}
                        className={`p-2 rounded-md transition-colors hidden sm:block ${isSettingsOpen ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
                        title="Settings"
                        aria-label="Settings"
                    >
                        <Settings size={18} />
                    </button>
                    {isSettingsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                            <h3 className="text-sm font-bold text-slate-200">Workspace Settings</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-400">Font Size</label>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSettings(s => ({ ...s, fontSize: Math.max(10, s.fontSize - 1) }))} className="w-6 h-6 bg-slate-800 rounded text-slate-300 hover:bg-slate-700 text-xs">-</button>
                                        <span className="text-xs text-slate-300 w-6 text-center">{settings.fontSize}</span>
                                        <button onClick={() => setSettings(s => ({ ...s, fontSize: Math.min(24, s.fontSize + 1) }))} className="w-6 h-6 bg-slate-800 rounded text-slate-300 hover:bg-slate-700 text-xs">+</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-400">Tab Size</label>
                                    <select
                                        value={settings.tabSize}
                                        onChange={(e) => setSettings(s => ({ ...s, tabSize: Number(e.target.value) }))}
                                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                                    >
                                        <option value={2}>2</option>
                                        <option value={4}>4</option>
                                        <option value={8}>8</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-400">Word Wrap</label>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, wordWrap: !s.wordWrap }))}
                                        className={`w-9 h-5 rounded-full transition-colors ${settings.wordWrap ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform mx-0.5 ${settings.wordWrap ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-400">Auto Save</label>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, autoSave: !s.autoSave }))}
                                        className={`w-9 h-5 rounded-full transition-colors ${settings.autoSave ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform mx-0.5 ${settings.autoSave ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-800">
                                <button
                                    onClick={() => { setSettings({ fontSize: 14, tabSize: 4, wordWrap: true, autoSave: true, theme: 'dark' }); }}
                                    className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                                >
                                    Reset to defaults
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => { setIsProfileOpen(!isProfileOpen); setIsSettingsOpen(false); }}
                        className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-indigo-400 transition-all"
                        title="Profile"
                        aria-label="Profile"
                    >
                        {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
                    </button>
                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                                    {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">{user?.email || 'User'}</p>
                                    <p className="text-xs text-slate-500">Cohort 1 Member</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-800 space-y-1">
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkspaceTopBar;
