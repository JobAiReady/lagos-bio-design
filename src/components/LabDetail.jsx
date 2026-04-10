import React, { useState, useEffect } from 'react';
import { X, Terminal, FileCode, CheckCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useModalA11y } from '../hooks/useModalA11y';

const LabDetail = ({ module, onClose }) => {
    const [completedSteps, setCompletedSteps] = useState([]);

    const [user, setUser] = useState(null);
    const [_loading, setLoading] = useState(true);

    // Check auth state
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    // Load progress from Supabase (or localStorage if not logged in)
    useEffect(() => {
        const loadProgress = async () => {
            if (!module?.title) return;
            setLoading(true);

            if (user) {
                // Load from Supabase
                const { data, error: _fetchError } = await supabase
                    .from('user_progress')
                    .select('completed_steps')
                    .eq('user_id', user.id)
                    .eq('module_id', module.title)
                    .single();

                if (data) {
                    setCompletedSteps(data.completed_steps || []);
                } else {
                    setCompletedSteps([]);
                }
            } else {
                // Load from localStorage
                const savedProgress = localStorage.getItem(`lab-progress-${module.title}`);
                if (savedProgress) {
                    setCompletedSteps(JSON.parse(savedProgress));
                } else {
                    setCompletedSteps([]);
                }
            }
            setLoading(false);
        };

        loadProgress();
    }, [module, user]);

    // Save progress
    const toggleStep = async (index) => {
        let newSteps;
        if (completedSteps.includes(index)) {
            newSteps = completedSteps.filter(i => i !== index);
        } else {
            newSteps = [...completedSteps, index];
        }

        setCompletedSteps(newSteps);

        if (user) {
            // Save to Supabase
            await supabase
                .from('user_progress')
                .upsert({
                    user_id: user.id,
                    module_id: module.title,
                    completed_steps: newSteps,
                    updated_at: new Date().toISOString()
                });
        } else {
            // Save to localStorage
            localStorage.setItem(`lab-progress-${module.title}`, JSON.stringify(newSteps));
        }
    };

    const modalRef = useModalA11y(!!module, onClose);

    if (!module) return null;

    const totalSteps = module.labContent?.steps?.length || 0;
    const progress = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div ref={modalRef} role="dialog" aria-modal="true" aria-label={`Lab: ${module.title}`} tabIndex={-1} className="w-full max-w-4xl bg-slate-900 border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] outline-none">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-950/50 rounded-lg border border-emerald-500/20">
                            <Terminal className="text-emerald-500" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Lab Environment</h2>
                            <p className="text-sm text-slate-400 font-mono">{module.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{progress}% Complete</span>
                            <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close lab"
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left: Instructions */}
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                    <FileCode size={18} /> Mission Objective
                                </h3>
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-slate-300 leading-relaxed">
                                    {module.labContent?.objective || "Initialize the lab environment to begin this module's practical exercise."}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-white mb-4">Step-by-Step Protocol</h3>
                                <div className="space-y-4">
                                    {(module.labContent?.steps || []).map((step, idx) => {
                                        const isCompleted = completedSteps.includes(idx);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex gap-4 group cursor-pointer transition-all ${isCompleted ? 'opacity-75' : 'opacity-100'}`}
                                                onClick={() => toggleStep(idx)}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <button
                                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold transition-all ${isCompleted
                                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                                            : 'bg-slate-800 border-slate-600 text-slate-400 group-hover:border-emerald-500 group-hover:text-emerald-500'
                                                            }`}
                                                    >
                                                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                                    </button>
                                                    {idx < (module.labContent?.steps?.length || 0) - 1 && <div className={`w-0.5 h-full my-2 transition-colors ${isCompleted ? 'bg-emerald-900' : 'bg-slate-800'}`}></div>}
                                                </div>
                                                <div className="pb-8 flex-1">
                                                    <h4 className={`font-bold text-sm mb-1 transition-colors ${isCompleted ? 'text-emerald-400 line-through' : 'text-emerald-400'}`}>{step.title}</h4>
                                                    <p className={`text-sm mb-2 transition-colors ${isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>{step.description}</p>
                                                    {step.code && step.code !== "N/A" && (
                                                        <div
                                                            className={`p-3 rounded border font-mono text-xs overflow-x-auto transition-colors ${isCompleted
                                                                ? 'bg-slate-950/50 border-slate-800/50 text-slate-600'
                                                                : 'bg-slate-950 border-slate-800 text-slate-400'
                                                                }`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {step.code}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>
                        </div>

                        {/* Right: Status & Tools */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">System Status</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Environment</span>
                                        <span className="text-emerald-400 font-mono">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">GPU Allocation</span>
                                        <span className="text-emerald-400 font-mono">T4 Tensor Core</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Latency</span>
                                        <span className="text-emerald-400 font-mono">24ms</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-950/20 p-5 rounded-xl border border-blue-500/20">
                                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Required Tools
                                </h4>
                                <ul className="space-y-2 text-sm text-blue-200/70">
                                    {module.labContent?.prerequisites?.map((req, i) => (
                                        <li key={i}>• {req}</li>
                                    )) || <li>• Standard Lab Environment</li>}
                                </ul>
                            </div>

                            {module.colabUrl && (
                                <a
                                    href={module.colabUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mb-3"
                                >
                                    <FileCode size={18} /> Open in Colab
                                </a>
                            )}

                            {module.bonusColabUrl && (
                                <a
                                    href={module.bonusColabUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 mb-3"
                                >
                                    <FileCode size={18} /> Bonus Lab: VibeGen Demo
                                </a>
                            )}

                            <button
                                onClick={() => window.location.href = '/workspace'}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Terminal size={18} /> Launch Workspace
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default LabDetail;
