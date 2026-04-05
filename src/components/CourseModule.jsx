import React from 'react';
import {
    ChevronDown, ChevronUp, FlaskConical, BookOpen,
    CheckCircle2, Terminal, Lock
} from 'lucide-react';

const CourseModule = ({ module, isOpen, toggle, progress, user, onOpenLesson, onOpenLab }) => {
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
                                {module.lessonContent && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenLesson();
                                        }}
                                        className="text-xs px-3 py-1.5 rounded border transition-all flex items-center gap-1 bg-blue-900/50 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/30"
                                    >
                                        <BookOpen size={12} />
                                        Study Lesson
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!user) {
                                            alert('Please Sign In with your Access Code to enter the Lab.');
                                            return;
                                        }
                                        onOpenLab();
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

export default CourseModule;
