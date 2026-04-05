import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, FileCode, Terminal, BookOpen, FlaskConical, Lightbulb } from 'lucide-react';
import Markdown from 'react-markdown';
import { useAiBrain } from '../hooks/useAiBrain';
import UpgradePrompt from './UpgradePrompt';

/**
 * Build suggested prompts based on context type.
 */
const getSuggestedPrompts = (context) => {
    if (!context) return [];

    if (context.type === 'lesson') {
        return [
            `Explain the key concepts in "${context.moduleTitle}" in simple terms`,
            `Quiz me on the key terms from this module`,
            `How does this module connect to real-world biotech in Africa?`,
        ];
    }
    if (context.type === 'lab') {
        return [
            `Walk me through the objective of this lab step by step`,
            `What should I expect as output from this lab?`,
            `Explain the code in this lab — what does each command do?`,
        ];
    }
    if (context.type === 'workspace') {
        return [
            `Explain what this code does`,
            `How can I improve this script?`,
            `What proteins could I analyze with this approach?`,
        ];
    }
    // General / curriculum browsing
    return [
        `What will I learn in this bootcamp?`,
        `Explain protein design to a complete beginner`,
        `What is AlphaFold and why does it matter?`,
    ];
};

/**
 * Build a context summary string for the AI based on what's active.
 */
const getContextLabel = (context) => {
    if (!context) return null;
    if (context.type === 'lesson') return { icon: BookOpen, label: context.moduleTitle };
    if (context.type === 'lab') return { icon: FlaskConical, label: context.moduleTitle };
    if (context.type === 'workspace') return { icon: FileCode, label: context.activeFile };
    return null;
};

const AiAssistant = ({ isOpen, onClose, context = {}, userPlan = 'free' }) => {
    const { messages, sendMessage, isThinking, brainName, isPro } = useAiBrain(userPlan);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const hasUserMessaged = messages.length > 1;

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input, context);
        setInput('');
    };

    const handleSuggestion = (prompt) => {
        sendMessage(prompt, context);
    };

    if (!isOpen) return null;

    const contextInfo = getContextLabel(context);
    const suggestions = getSuggestedPrompts(context);

    return (
        <div className="fixed right-4 bottom-20 w-80 md:w-96 h-[500px] bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col z-[60] overflow-hidden ring-1 ring-emerald-500/20">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-100">AI Lab Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{brainName}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} aria-label="Close AI assistant" className="text-slate-500 hover:text-slate-300 transition-colors">
                    <X size={18} />
                </button>
            </div>

            {!isPro && <UpgradePrompt />}

            {/* Context Indicator */}
            {contextInfo && (
                <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 text-[10px] text-slate-500 font-mono overflow-hidden">
                    <contextInfo.icon size={10} className="shrink-0" />
                    <span className="truncate">{contextInfo.label}</span>
                    {context.type === 'workspace' && context.logs && (
                        <>
                            <span className="w-px h-3 bg-slate-800"></span>
                            <span className="flex items-center gap-1 shrink-0">
                                <Terminal size={10} />
                                {context.logs.length} logs
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                }`}
                        >
                            {msg.role === 'assistant' ? (
                                <Markdown
                                    components={{
                                        h2: ({ children }) => <h2 className="text-base font-bold text-emerald-400 mt-3 mb-1">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-sm font-semibold text-emerald-300 mt-2 mb-1">{children}</h3>,
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                                        li: ({ children }) => <li className="text-slate-300">{children}</li>,
                                        strong: ({ children }) => <strong className="text-emerald-400 font-semibold">{children}</strong>,
                                        code: ({ children, className }) => className
                                            ? <code className="block bg-slate-950 rounded-lg p-2 my-2 text-xs text-emerald-300 overflow-x-auto">{children}</code>
                                            : <code className="bg-slate-800 px-1 py-0.5 rounded text-xs text-emerald-300">{children}</code>,
                                        hr: () => <hr className="border-slate-700 my-2" />,
                                    }}
                                >
                                    {msg.text}
                                </Markdown>
                            ) : msg.text}
                        </div>
                    </div>
                ))}

                {/* Suggested Prompts — show before user sends first message */}
                {!hasUserMessaged && !isThinking && suggestions.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                            <Lightbulb size={10} />
                            Try asking
                        </div>
                        {suggestions.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestion(prompt)}
                                className="w-full text-left text-xs px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/30 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={context.type === 'lesson' ? 'Ask about this lesson...' : context.type === 'lab' ? 'Ask about this lab...' : 'Ask anything about biodesign...'}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isThinking}
                        className="absolute right-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AiAssistant;
