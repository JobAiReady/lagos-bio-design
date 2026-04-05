import React, { useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const WorkspaceTerminal = ({ output, isRunning }) => {
    const outputEndRef = useRef(null);

    useEffect(() => {
        outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [output]);

    return (
        <div role="log" aria-label="Terminal output" aria-live="polite" className="h-48 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
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
    );
};

export default WorkspaceTerminal;
