import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import WorkspaceTopBar from '../components/WorkspaceTopBar';
import WorkspaceSidebar from '../components/WorkspaceSidebar';
import WorkspaceTerminal from '../components/WorkspaceTerminal';
import PyodideLoadingOverlay from '../components/PyodideLoadingOverlay';
import PublishModal from '../components/PublishModal';
import AiAssistant from '../components/AiAssistant';
import CodeEditor from '../components/CodeEditor';
import { usePyodide } from '../hooks/usePyodide';
import { useAuth } from '../contexts/useAuth';

const DEFAULT_FILES = [
    { name: 'script.py', type: 'python', content: '# Protein Design Lab - Intro Script\nimport numpy as np\n\n# Generate a random protein-like sequence\namino_acids = list("ACDEFGHIKLMNPQRSTVWY")\nseq_length = 50\nsequence = "".join(np.random.choice(amino_acids, seq_length))\n\nprint(f"Generated sequence ({seq_length} residues):")\nprint(sequence)\nprint(f"\\nMolecular weight estimate: {seq_length * 110:.0f} Da")\nprint("\\nNote: For GPU-heavy tools (AlphaFold, RFDiffusion),")\nprint("use the Open in Colab button in the Lab view.")' },
    { name: 'config.yaml', type: 'yaml', content: 'model:\n  name: esm2_t33_650M_UR50D\n  weights: true\n\ninference:\n  batch_size: 1' },
    { name: 'README.md', type: 'markdown', content: '# Protein Design Lab\n\nWelcome to the workspace. Use this environment to run your protein design experiments.\n\n## Running Code\n- Edit script.py and click RUN SCRIPT\n- Python runs in-browser via Pyodide (numpy available)\n- For GPU tools, use Google Colab notebooks from the Lab view' }
];

const WorkspaceContent = () => {
    const navigate = useNavigate();
    const [activeFile, setActiveFile] = useState('script.py');
    const [files, setFiles] = useState(DEFAULT_FILES);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isPublishOpen, setIsPublishOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const { user, profile, loading } = useAuth();

    const { isPythonReady, isRunning, stage, error, output, appendOutput, retry, runScript } = usePyodide();

    // Redirect if not authenticated (wait for auth to finish loading)
    useEffect(() => {
        if (!loading && !user) navigate('/');
    }, [user, loading, navigate]);

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

    const activeFileObj = files.find(f => f.name === activeFile);
    const activeFileContent = activeFileObj?.content || '';
    const activeFileType = activeFileObj?.type || 'python';

    const handleRun = useCallback(async () => {
        const file = files.find(f => f.name === activeFile);
        if (file && file.type === 'python') {
            await runScript(file.name, file.content);
        } else {
            appendOutput(`> Cannot run ${file?.name || 'unknown file'}. Only Python scripts are executable.`);
        }
    }, [files, activeFile, runScript, appendOutput]);

    const handleEditorChange = useCallback((newContent) => {
        setFiles(prev => prev.map(f =>
            f.name === activeFile ? { ...f, content: newContent } : f
        ));
    }, [activeFile]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center">
                <div className="text-emerald-400 font-mono text-sm">Loading workspace...</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#0f172a] text-slate-300 flex flex-col font-mono overflow-hidden">
            <WorkspaceTopBar
                navigate={navigate}
                user={user}
                isRunning={isRunning}
                isPythonReady={isPythonReady}
                onRun={handleRun}
                onPublish={() => setIsPublishOpen(true)}
                isAiOpen={isAiOpen}
                onToggleAi={() => setIsAiOpen(!isAiOpen)}
            />

            <div className="flex-1 flex overflow-hidden relative">
                <WorkspaceSidebar
                    files={files}
                    activeFile={activeFile}
                    onSelectFile={setActiveFile}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isMobile={isMobile}
                />

                <div className="flex-1 flex flex-col bg-[#0f172a] w-full min-w-0">
                    {/* File Tabs */}
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

                    {/* Code Editor with Loading Overlay */}
                    <div className="flex-1 overflow-hidden relative">
                        <CodeEditor
                            value={activeFileContent}
                            onChange={handleEditorChange}
                            language={activeFileType}
                        />
                        <PyodideLoadingOverlay stage={stage} error={error} onRetry={retry} />
                    </div>

                    <WorkspaceTerminal output={output} isRunning={isRunning} />
                </div>
            </div>

            <PublishModal
                isOpen={isPublishOpen}
                onClose={() => setIsPublishOpen(false)}
                user={user}
                runData={{ metrics: { pLDDT: 85.5, rmsd: 1.2 } }}
                onPublishSuccess={() => {
                    appendOutput('> Design published to Gallery successfully!');
                }}
            />

            <AiAssistant
                isOpen={isAiOpen}
                onClose={() => setIsAiOpen(false)}
                context={{ type: 'workspace', activeFile, code: activeFileContent, logs: output }}
                userPlan={profile?.plan || 'free'}
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
