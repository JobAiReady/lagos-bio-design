import React from 'react';
import { Calendar, MapPin, Microscope } from 'lucide-react';

const HeroSection = () => {
    return (
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
    );
};

export default HeroSection;
