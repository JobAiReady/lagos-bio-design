import React, { useState } from 'react';
import { X, BookOpen, GraduationCap, ExternalLink, HelpCircle, ChevronRight, FlaskConical } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

const LessonPanel = ({ module, onClose, onOpenLab }) => {
    const [activeSection, setActiveSection] = useState('overview');

    const modalRef = useModalA11y(!!module?.lessonContent, onClose);

    if (!module || !module.lessonContent) return null;

    const { lessonContent } = module;

    const renderInline = (text) => {
        const parts = [];
        const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }
            if (match[1]) {
                parts.push(<strong key={match.index} className="text-emerald-400">{match[1]}</strong>);
            } else if (match[2]) {
                parts.push(<em key={match.index} className="text-slate-300">{match[2]}</em>);
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }
        return parts;
    };

    const renderMarkdown = (text) => {
        return text.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-slate-300 leading-relaxed mb-4">
                {renderInline(paragraph)}
            </p>
        ));
    };

    const sections = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'terms', label: 'Key Terms', icon: GraduationCap },
        { id: 'reading', label: 'Reading', icon: ExternalLink },
        { id: 'questions', label: 'Pre-Lab Check', icon: HelpCircle },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div ref={modalRef} role="dialog" aria-modal="true" aria-label={`Lesson: ${module.title}`} tabIndex={-1} className="w-full max-w-4xl bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] outline-none">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-950/50 rounded-lg border border-blue-500/20">
                            <BookOpen className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Lesson</h2>
                            <p className="text-sm text-slate-400 font-mono">{module.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {onOpenLab && (
                            <button
                                onClick={() => { onClose(); onOpenLab(); }}
                                className="flex items-center gap-2 text-sm px-4 py-2 bg-emerald-900/50 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg transition-all"
                            >
                                <FlaskConical size={14} />
                                Enter Lab
                                <ChevronRight size={14} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            aria-label="Close lesson"
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950/50">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                                    activeSection === section.id
                                        ? 'text-blue-400 border-blue-400 bg-blue-950/20'
                                        : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                            >
                                <Icon size={14} />
                                {section.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* Overview */}
                    {activeSection === 'overview' && (
                        <div className="max-w-3xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <BookOpen size={18} className="text-blue-400" />
                                Conceptual Overview
                            </h3>
                            <div className="prose prose-invert max-w-none">
                                {renderMarkdown(lessonContent.summary)}
                            </div>
                        </div>
                    )}

                    {/* Key Terms */}
                    {activeSection === 'terms' && (
                        <div className="max-w-3xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <GraduationCap size={18} className="text-blue-400" />
                                Key Terms & Definitions
                            </h3>
                            <div className="space-y-3">
                                {lessonContent.keyTerms.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/30 transition-colors"
                                    >
                                        <dt className="font-bold text-blue-400 text-sm mb-1">{item.term}</dt>
                                        <dd className="text-slate-300 text-sm leading-relaxed">{item.definition}</dd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reading Links */}
                    {activeSection === 'reading' && (
                        <div className="max-w-3xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <ExternalLink size={18} className="text-blue-400" />
                                Recommended Reading
                            </h3>
                            <div className="space-y-3">
                                {lessonContent.readingLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/30 hover:bg-slate-800 transition-all group"
                                    >
                                        <div className="p-2 bg-blue-950/50 rounded border border-blue-500/20 group-hover:bg-blue-900/50 transition-colors">
                                            <ExternalLink size={14} className="text-blue-400" />
                                        </div>
                                        <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{link.title}</span>
                                    </a>
                                ))}
                            </div>
                            <p className="text-xs text-slate-600 mt-6">These links open in a new tab. Reading is recommended but not required before the lab.</p>
                        </div>
                    )}

                    {/* Pre-Lab Questions */}
                    {activeSection === 'questions' && (
                        <div className="max-w-3xl">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <HelpCircle size={18} className="text-blue-400" />
                                Pre-Lab Self-Check
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Reflect on these questions before starting the lab. No grading — just make sure you can reason through each one.</p>
                            <div className="space-y-4">
                                {lessonContent.preLabQuestions.map((question, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-4 bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                                    >
                                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-950 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                                            {idx + 1}
                                        </span>
                                        <p className="text-slate-300 text-sm leading-relaxed pt-0.5">{question}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
                                <p className="text-sm text-emerald-400 font-medium mb-2">Ready for the lab?</p>
                                <p className="text-xs text-slate-500 mb-3">If you can answer the questions above, you're prepared for the hands-on exercise.</p>
                                {onOpenLab && (
                                    <button
                                        onClick={() => { onClose(); onOpenLab(); }}
                                        className="flex items-center gap-2 text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
                                    >
                                        <FlaskConical size={14} />
                                        Enter Lab
                                        <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonPanel;
