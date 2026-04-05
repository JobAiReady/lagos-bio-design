import React from 'react';
import { FileCode, FolderOpen, ChevronDown, X, GitBranch } from 'lucide-react';

const WorkspaceSidebar = ({ files, activeFile, onSelectFile, isOpen, onClose, isMobile }) => {
    return (
        <>
            <div className={`
                absolute md:relative z-20 h-full w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
            `}>
                <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Explorer</span>
                    <button onClick={onClose} className="hover:text-slate-300 md:hidden">
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
                                        onSelectFile(file.name);
                                        if (isMobile) onClose();
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

                <div className="p-3 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <GitBranch size={12} />
                        <span>main</span>
                        <span className="ml-auto">v1.0.2</span>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isMobile && isOpen && (
                <div
                    className="absolute inset-0 bg-black/50 z-10"
                    onClick={onClose}
                ></div>
            )}
        </>
    );
};

export default WorkspaceSidebar;
