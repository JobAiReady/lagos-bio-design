import React, { useState, useEffect } from 'react';
import {
    Dna,
    Microscope,
    Cpu,
    BookOpen,
    MapPin,
    Calendar,
    ChevronDown,
    ChevronUp,
    FlaskConical,
    ShieldAlert,
    Globe2,
    Award,
    Zap,
    CheckCircle2,
    Terminal,
    Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import JobAiReadyHeader from '../components/JobAiReadyHeader';
import LabDetail from '../components/LabDetail';
import { modules as modulesData } from '../data/modules.jsx';

const CourseModule = ({ module, isOpen, toggle, progress, user }) => {
    return (
        <div className="border border-emerald-500/20 rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow-emerald-500/10 transition-all bg-slate-900/50 backdrop-blur-sm">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between p-5 hover:bg-emerald-950/30 transition-colors text-left"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${module.color} text-white shadow-lg shadow-emerald-900/20 relative`}>
                        {module.icon}
                        {progress === 100 && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-slate-900">
                                <CheckCircle2 size={10} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-200">{module.title}</h3>
                            {progress > 0 && (
                                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {progress}% Lab
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 font-mono">{module.duration} • {module.level}</p>
                        {progress > 0 && progress < 100 && (
                            <div className="w-full max-w-[200px] h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-5 border-t border-emerald-500/20 bg-slate-950/30">
                    <p className="mb-4 text-slate-300 leading-relaxed">{module.description}</p>

                    <div className="bg-slate-900 p-4 rounded-md border border-slate-800 mb-4">
                        <h4 className="font-semibold text-xs uppercase tracking-widest text-slate-500 mb-3">Core Competencies</h4>
                        <ul className="space-y-2">
                            {module.topics.map((topic, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                    <span>{topic}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm">
                        <div className="flex items-center gap-2 text-blue-400 font-medium">
                            <span className="bg-blue-950/50 border border-blue-500/20 px-2 py-1 rounded text-xs uppercase tracking-wider">Case Study</span>
                            <span className="text-slate-300">{module.caseStudy}</span>
                        </div>
                        {module.lab && (
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-orange-400 font-medium">
                                    <FlaskConical size={16} />
                                    {module.lab}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!user) {
                                            alert('Please Sign In with your Access Code to enter the Lab.');
                                            return;
                                        }
                                        module.onOpenLab();
                                    }}
                                    className={`text-xs px-3 py-1.5 rounded border transition-all flex items-center gap-1 ${user
                                        ? 'bg-emerald-900/50 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                        }`}
                                >
                                    {user ? <Terminal size={12} /> : <Lock size={12} />}
                                    {progress > 0 ? 'Continue Lab' : 'Enter Lab'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function LagosBioBootcamp() {
    const [openModule, setOpenModule] = useState(0);
    const [activeTab, setActiveTab] = useState('curriculum');
    const [selectedLab, setSelectedLab] = useState(null);
    const [moduleProgress, setModuleProgress] = useState({});
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load progress
    useEffect(() => {
        const loadProgress = async () => {
            const progressMap = {};

            if (user) {
                // Load from Supabase
                const { data } = await supabase
                    .from('user_progress')
                    .select('module_id, completed_steps')
                    .eq('user_id', user.id);

                if (data) {
                    data.forEach(row => {
                        const mod = modulesData.find(m => m.title === row.module_id);
                        if (mod) {
                            const totalSteps = mod.labContent?.steps?.length || 0;
                            progressMap[row.module_id] = totalSteps > 0 ? Math.round((row.completed_steps.length / totalSteps) * 100) : 0;
                        }
                    });
                }
            } else {
                // Load from localStorage
                modulesData.forEach(mod => {
                    const saved = localStorage.getItem(`lab-progress-${mod.title}`);
                    if (saved) {
                        const completedSteps = JSON.parse(saved);
                        const totalSteps = mod.labContent?.steps?.length || 0;
                        progressMap[mod.title] = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;
                    } else {
                        progressMap[mod.title] = 0;
                    }
                });
            }
            setModuleProgress(progressMap);
        };

        loadProgress();
        // Add event listener for storage changes (for local dev)
        window.addEventListener('storage', loadProgress);
        return () => window.removeEventListener('storage', loadProgress);
    }, [selectedLab, user]);

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-emerald-500/30">
            <JobAiReadyHeader />

            {/* Navigation */}
            <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                <Dna className="text-emerald-500" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Lagos Bio-Design Bootcamp</h1>
                                <p className="text-xs text-emerald-500 font-mono tracking-wider">BATCH 01 • YABA 2026</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <button
                                onClick={() => setActiveTab('curriculum')}
                                className={`text-sm font-medium transition-colors ${activeTab === 'curriculum' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Curriculum
                            </button>
                            <button
                                onClick={() => setActiveTab('mission')}
                                className={`text-sm font-medium transition-colors ${activeTab === 'mission' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Mission
                            </button>
                            <button className="bg-white text-slate-900 px-4 py-2 rounded-md text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/5">
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative border-b border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-slate-950">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Accepting Applications for Cohort 1
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                            Master the <span className="text-emerald-400">Generative Biology</span> Revolution
                        </h2>
                        <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                            From AlphaFold to RFDiffusion. Join the elite cohort of engineers in Lagos learning to design proteins as easily as writing code.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-slate-300 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                                <Calendar size={18} className="text-emerald-500" />
                                <span>8 Weeks</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                                <MapPin size={18} className="text-emerald-500" />
                                <span>Yaba, Lagos (Hybrid)</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                                <Microscope size={18} className="text-emerald-500" />
                                <span>Hands-on Lab</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {activeTab === 'curriculum' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* Left: Syllabus */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <BookOpen className="text-emerald-500" />
                                    Course Modules
                                </h3>
                                <span className="text-sm text-slate-500 font-mono">v2.5.0-beta</span>
                            </div>

                            {modulesData.map((mod, index) => (
                                <CourseModule
                                    key={index}
                                    module={{ ...mod, onOpenLab: () => setSelectedLab(mod) }}
                                    isOpen={openModule === index}
                                    toggle={() => setOpenModule(index === openModule ? -1 : index)}
                                    progress={moduleProgress[mod.title] || 0}
                                    user={user}
                                />
                            ))}
                        </div>

                        {/* Right: Sidebar Info */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 sticky top-24">
                                <h4 className="font-bold text-white mb-4">Why This Matters</h4>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    "Biology is becoming an information technology. The future belongs to those who can program life."
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-emerald-900/30 p-2 rounded text-emerald-500">
                                            <Cpu size={18} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-200 text-sm">Compute First</h5>
                                            <p className="text-xs text-slate-500 mt-1">Learn to use H100 clusters for biological inference.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-900/30 p-2 rounded text-blue-500">
                                            <ShieldAlert size={18} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-200 text-sm">Bio-Security</h5>
                                            <p className="text-xs text-slate-500 mt-1">Understand the ethical implications of de novo design.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto text-center py-12">
                        <Globe2 size={48} className="text-emerald-500 mx-auto mb-6" />
                        <h3 className="text-3xl font-bold text-white mb-4">The Yaba Manifesto</h3>
                        <p className="text-slate-400 leading-relaxed mb-8">
                            We believe that the next great breakthrough in biotechnology will not come from a traditional wet lab in Boston, but from a laptop in Lagos. By democratizing access to generative biology tools, we are empowering a new generation of African scientists to solve local challenges with global technology.
                        </p>
                    </div>
                )}
            </main>

            <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="mb-4">© 2026 Lagos Bio-Design Bootcamp. All rights reserved.</p>
                    <p className="text-xs font-mono text-emerald-900/50">Powered by JobAiReady.ai Intelligence Layer</p>
                </div>
            </footer>

            <LabDetail module={selectedLab} onClose={() => setSelectedLab(null)} />
        </div>
    );
}
