import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart3, CheckCircle, Circle, ArrowLeft, Award } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useModuleProgress } from '../hooks/useModuleProgress';
import { useCertificate } from '../hooks/useCertificate';
import { modules as modulesData } from '../data/modules.jsx';
import ProgressBar from '../components/ProgressBar';
import CertificateButton from '../components/CertificateButton';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user, profile, loading } = useAuth();
    const moduleProgress = useModuleProgress(modulesData, user);
    const { isEligible, isGenerating, generateCertificate } = useCertificate(moduleProgress, modulesData, profile);

    useEffect(() => {
        if (!loading && !user) navigate('/');
    }, [loading, user, navigate]);

    if (loading) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                Loading...
            </div>
        );
    }

    const completedModules = modulesData.filter(m => moduleProgress[m.title] === 100).length;
    const overallProgress = modulesData.length > 0
        ? Math.round(modulesData.reduce((sum, m) => sum + (moduleProgress[m.title] || 0), 0) / modulesData.length)
        : 0;

    const moduleColors = ['bg-yellow-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500'];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                        aria-label="Back to bootcamp"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="text-emerald-500" size={24} />
                            My Progress
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {profile?.full_name || user?.email}
                        </p>
                    </div>
                </div>

                {/* Overall Progress Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-slate-400">Overall Completion</p>
                            <p className="text-3xl font-bold text-white mt-1">{overallProgress}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">Modules Completed</p>
                            <p className="text-3xl font-bold text-emerald-400 mt-1">
                                {completedModules}<span className="text-lg text-slate-500">/{modulesData.length}</span>
                            </p>
                        </div>
                    </div>
                    <ProgressBar value={overallProgress} />
                </div>

                {/* Module Progress */}
                <div className="space-y-4 mb-10">
                    {modulesData.map((mod, i) => {
                        const progress = moduleProgress[mod.title] || 0;
                        const isComplete = progress === 100;

                        return (
                            <div
                                key={mod.title}
                                className={`bg-slate-900 border rounded-xl p-5 transition-all ${
                                    isComplete ? 'border-emerald-500/30' : 'border-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {isComplete
                                        ? <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                                        : <Circle size={20} className="text-slate-600 shrink-0" />
                                    }
                                    <h3 className={`text-sm font-semibold ${isComplete ? 'text-emerald-400' : 'text-slate-200'}`}>
                                        {mod.title}
                                    </h3>
                                </div>
                                <ProgressBar value={progress} color={moduleColors[i] || 'bg-emerald-500'} />
                                <p className="text-xs text-slate-500 mt-2">{mod.duration} &middot; {mod.level}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Certificate Section */}
                {isEligible && (
                    <CertificateButton
                        isEligible={isEligible}
                        isGenerating={isGenerating}
                        onGenerate={generateCertificate}
                    />
                )}

                {!isEligible && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
                        <Award size={24} className="text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                            Complete all 5 modules to earn your certificate
                        </p>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/workspace" className="text-emerald-400 hover:text-emerald-300 text-sm hover:underline">
                        Continue in Workspace →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
