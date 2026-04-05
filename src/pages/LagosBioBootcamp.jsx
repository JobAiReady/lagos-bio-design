import React, { useState, useMemo } from 'react';
import { Dna, BookOpen, Cpu, ShieldAlert, Globe2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobAiReadyHeader from '../components/JobAiReadyHeader';
import AuthModal from '../components/AuthModal';
import LabDetail from '../components/LabDetail';
import LessonPanel from '../components/LessonPanel';
import CourseModule from '../components/CourseModule';
import HeroSection from '../components/HeroSection';
import BootcampFooter from '../components/BootcampFooter';
import CertificateButton from '../components/CertificateButton';
import PricingSection from '../components/PricingSection';
import AiAssistant from '../components/AiAssistant';
import AiFloatingButton from '../components/AiFloatingButton';
import { modules as modulesData } from '../data/modules.jsx';
import { useModuleProgress } from '../hooks/useModuleProgress';
import { useCertificate } from '../hooks/useCertificate';
import { useAuth } from '../contexts/useAuth';

export default function LagosBioBootcamp() {
    const [openModule, setOpenModule] = useState(0);
    const [activeTab, setActiveTab] = useState('curriculum');
    const [selectedLab, setSelectedLab] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    // Build AI context based on what the student is currently viewing
    const aiContext = useMemo(() => {
        if (selectedLesson) {
            return {
                type: 'lesson',
                moduleTitle: selectedLesson.title,
                summary: selectedLesson.lessonContent?.summary || '',
                keyTerms: selectedLesson.lessonContent?.keyTerms?.map(t => `${t.term}: ${t.definition}`).join('\n') || '',
            };
        }
        if (selectedLab) {
            return {
                type: 'lab',
                moduleTitle: selectedLab.title,
                objective: selectedLab.labContent?.objective || '',
                steps: selectedLab.labContent?.steps?.map(s => `${s.title}: ${s.description}`).join('\n') || '',
            };
        }
        return { type: 'curriculum' };
    }, [selectedLesson, selectedLab]);

    const moduleProgress = useModuleProgress(modulesData, user, selectedLab);
    const { isEligible, isGenerating, generateCertificate } = useCertificate(moduleProgress, modulesData, profile);

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
                            {!user && (
                                <button
                                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    Pricing
                                </button>
                            )}
                            {user && (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <BarChart3 size={14} />
                                    My Progress
                                </button>
                            )}
                            <button
                                onClick={() => user ? navigate('/workspace') : setIsAuthOpen(true)}
                                className="bg-white text-slate-900 px-4 py-2 rounded-md text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/5"
                            >
                                {user ? 'Enter Workspace' : 'Apply Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <HeroSection />

            {!user && (
                <div id="pricing">
                    <PricingSection onApply={() => setIsAuthOpen(true)} />
                </div>
            )}

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {activeTab === 'curriculum' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
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
                                    module={mod}
                                    isOpen={openModule === index}
                                    toggle={() => setOpenModule(index === openModule ? -1 : index)}
                                    progress={moduleProgress[mod.title] || 0}
                                    user={user}
                                    onOpenLesson={() => setSelectedLesson(mod)}
                                    onOpenLab={() => setSelectedLab(mod)}
                                />
                            ))}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-8">
                            {user && isEligible && (
                                <CertificateButton
                                    isEligible={isEligible}
                                    isGenerating={isGenerating}
                                    onGenerate={generateCertificate}
                                />
                            )}
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 sticky top-24">
                                <h4 className="font-bold text-white mb-4">Why This Matters</h4>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    &quot;Biology is becoming an information technology. The future belongs to those who can program life.&quot;
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

            <BootcampFooter />

            <LabDetail module={selectedLab} onClose={() => setSelectedLab(null)} />
            <LessonPanel
                module={selectedLesson}
                onClose={() => setSelectedLesson(null)}
                onOpenLab={() => { setSelectedLesson(null); setSelectedLab(selectedLesson); }}
            />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            <AiAssistant
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                context={aiContext}
                userPlan={profile?.plan || 'free'}
            />
            <AiFloatingButton isOpen={isAiOpen} onClick={() => setIsAiOpen(!isAiOpen)} />
        </div>
    );
}
