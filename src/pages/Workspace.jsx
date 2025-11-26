import React, { useState, useEffect, useRef } from 'react';
import {
    Terminal, FileCode, Play, Save, Settings,
    FolderOpen, ChevronRight, ChevronDown, X,
    Search, Menu, Layout, GitBranch, Cpu,
    ArrowLeft, Loader2, Upload, Bot
} from 'lucide-react';
import PublishModal from '../components/PublishModal';
import AiAssistant from '../components/AiAssistant';
import { useNavigate } from 'react-router-dom';
import { loadPyodide, runPythonScript } from '../utils/pyodideManager';
import ErrorBoundary from '../components/ErrorBoundary';
import { supabase } from '../lib/supabase';

const WorkspaceContent = () => {
    const navigate = useNavigate();
    const [activeFile, setActiveFile] = useState('script.py');
    const [isRunning, setIsRunning] = useState(false);
    const [isPythonReady, setIsPythonReady] = useState(false);
    const [output, setOutput] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [isMobile, setIsMobile] = useState(false);
    const [isPublishOpen, setIsPublishOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [user, setUser] = useState(null);
    const outputEndRef = useRef(null);

    // Check Auth
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/');
            } else {
                setUser(session.user);
            }
        });
    }, [navigate]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsMobile(true);
                setSidebarOpen(false);
            } else {
                setIsMobile(false);
                setSidebarOpen(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize Pyodide
    useEffect(() => {
        const initPython = async () => {
            setOutput(prev => [...prev, '> Initializing Python Runtime (Pyodide)...']);
            try {
                await loadPyodide();
                setIsPythonReady(true);
                setOutput(prev => [...prev, '> Python 3.11 Ready.', '> Bio-Design Libraries (Simulated) Loaded.']);
            } catch (err) {
                setOutput(prev => [...prev, `> Error loading Python: ${err.message}`]);
            }
        };
        initPython();
    }, []);

    // Scroll to bottom of output
    useEffect(() => {
        outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [output]);

    const files = [
        { name: 'script.py', type: 'python', content: 'import torch\nimport esm\n\nprint("Loading ESM-2 model...")\n# Load ESM-2 model (Simulated)\nmodel, alphabet = esm.pretrained.esm2_t33_650M_UR50D()\nbatch_converter = alphabet.get_batch_converter()\n\nprint("Model loaded successfully.")\nprint("Ready for inference.")' },
        { name: 'config.yaml', type: 'yaml', content: 'model:\n  name: esm2_t33_650M_UR50D\n  weights: true\n\ninference:\n  batch_size: 1' },
        { name: 'README.md', type: 'markdown', content: '# Protein Design Lab\n\nWelcome to the workspace. Use this environment to run your protein design experiments.' }
    ];

    const handleRun = async () => {
        if (!isPythonReady) return;

        setIsRunning(true);
        const file = files.find(f => f.name === activeFile);

        if (file && file.type === 'python') {
            setOutput(prev => [...prev, `> Running ${file.name}...`]);
            try {
                await runPythonScript(file.content, (msg) => {
                    setOutput(prev => [...prev, msg]);
                });
            } catch (err) {
                setOutput(prev => [...prev, `> Execution Error: ${err.message}`]);
            }
        } else {
            setOutput(prev => [...prev, `> Cannot run ${file?.name || 'unknown file'}. Only Python scripts are executable.`]);
        }

        setIsRunning(false);
    };

    const activeFileContent = files.find(f => f.name === activeFile)?.content || '';

    return (
        <div className="h-screen w-full bg-[#0f172a] text-slate-300 flex flex-col font-mono overflow-hidden">
            {/* Top Bar */}
            <div className="h-12 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 select-none shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 transition-colors"
                        title="Back to Dashboard"
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
                        onClick={handleRun}
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
                        onClick={() => setIsPublishOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                        title="Publish to Gallery"
                    >
                        <Upload size={14} />
                        <span className="hidden sm:inline">PUBLISH</span>
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

                    <button
                        onClick={() => setIsAiOpen(!isAiOpen)}
                        className={`p-2 rounded-md transition-colors ${isAiOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
                        title="Toggle AI Assistant"
                    >
                        <Bot size={18} />
                    </button>

                    <button className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hidden sm:block">
                        <Settings size={18} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        JD
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar */}
                <div className={`
            absolute md:relative z-20 h-full w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
        `}>
                    <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Explorer</span>
                        <button onClick={() => setSidebarOpen(false)} className="hover:text-slate-300 md:hidden">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-2">
                        <div className="px-2 mb-2">
                            <div className="flex items-center gap-1 text-slate-200 text-sm py-1 px-2 bg-slate-900 rounded-md">
                                <ChevronDown size={14} />
                                <FolderOpen size={14} className="text-blue-400" />
                                <span className="font-bold">project-root</span>
                            </div>
                            <div className="pl-4 mt-1 space-y-0.5">
                                {files.map(file => (
                                    <button
                                        key={file.name}
                                        onClick={() => {
                                            setActiveFile(file.name);
                                            if (isMobile) setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeFile === file.name
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                            }`}
                                    >
                                        <FileCode size={14} className={
                                            file.name.endsWith('.py') ? 'text-yellow-400' :
                                                file.name.endsWith('.yaml') ? 'text-red-400' :
                                                    'text-blue-400'
                                        } />
                                        {file.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-3 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <GitBranch size={12} />
                            <span>main</span>
                            <span className="ml-auto">v1.0.2</span>
                        </div>
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {isMobile && sidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/50 z-10"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-[#0f172a] w-full min-w-0">
                    {/* Tabs */}
                    <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2.5 border-r border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors shrink-0"
                        >
                            <Menu size={16} />
                        </button>
                        {files.map(file => (
                            <button
                                key={file.name}
                                onClick={() => setActiveFile(file.name)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm border-r border-slate-800 min-w-[120px] shrink-0 ${activeFile === file.name
                                    ? 'bg-[#0f172a] text-emerald-400 border-t-2 border-t-emerald-500'
                                    : 'bg-slate-950 text-slate-500 hover:bg-slate-900 hover:text-slate-300 border-t-2 border-t-transparent'
                                    }`}
                            >
                                <span>{file.name}</span>
                                {activeFile === file.name && (
                                    <X size={12} className="ml-auto hover:text-red-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Code Editor */}
                    <div className="flex-1 p-4 sm:p-6 overflow-auto font-mono text-sm leading-relaxed">
                        <div className="flex">
                            <div className="flex flex-col text-right pr-4 text-slate-600 select-none hidden sm:flex">
                                {activeFileContent.split('\n').map((_, i) => (
                                    <span key={i} className="h-6">{i + 1}</span>
                                ))}
                            </div>
                            <div className="flex-1 text-slate-300 whitespace-pre overflow-x-auto">
                                {activeFileContent.split('\n').map((line, i) => (
                                    <div key={i} className="h-6">{line}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Terminal */}
                    <div className="h-48 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                            <div className="flex items-center gap-4 overflow-x-auto">
                                <span className="text-xs font-bold text-slate-400 uppercase border-b-2 border-emerald-500 pb-2 -mb-2.5 whitespace-nowrap">Terminal</span>
                                <span className="text-xs font-bold text-slate-600 uppercase pb-2 whitespace-nowrap">Output</span>
                                <span className="text-xs font-bold text-slate-600 uppercase pb-2 whitespace-nowrap">Problems</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="text-slate-500 hover:text-slate-300"><ChevronDown size={14} /></button>
                                <button className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1">
                            <div className="text-slate-500">Microsoft Windows [Version 10.0.19045.3693]</div>
                            <div className="text-slate-500">(c) Microsoft Corporation. All rights reserved.</div>
                            <br />
                            <div className="flex items-center gap-2 text-slate-300 flex-wrap">
                                <span className="text-emerald-500">user@LagosBioBootcamp</span>
                                <span className="text-slate-500">:</span>
                                <span className="text-blue-400">~/lab-01</span>
                                <span className="text-slate-500">$</span>
                                <span>python script.py</span>
                            </div>
                            {output.map((line, i) => (
                                <div key={i} className="text-slate-300 pl-4 break-words">{line}</div>
                            ))}
                            {isRunning && (
                                <div className="pl-4 text-emerald-500 animate-pulse">_</div>
                            )}
                            <div ref={outputEndRef} />
                        </div>
                    </div>
                </div>
            </div>

            <PublishModal
                isOpen={isPublishOpen}
                onClose={() => setIsPublishOpen(false)}
                user={user}
                runData={{ metrics: { pLDDT: 85.5, rmsd: 1.2 } }}
                onPublishSuccess={() => {
                    setOutput(prev => [...prev, '> Design published to Gallery successfully!']);
                }}
            />

            <AiAssistant
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                context={{
                    activeFile,
                    code: activeFileContent,
                    logs: output
                }}
            />
        </div>
    );
};

const Workspace = () => (
    <ErrorBoundary>
        <WorkspaceContent />
    </ErrorBoundary>
);

export default Workspace;
