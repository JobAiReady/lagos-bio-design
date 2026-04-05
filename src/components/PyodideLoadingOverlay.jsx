import React from 'react';
import { Loader2, X } from 'lucide-react';

const PyodideLoadingOverlay = ({ stage, error, onRetry }) => {
    if (!stage && !error) return null;

    return (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center max-w-sm px-6">
                {error ? (
                    <>
                        <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <X size={28} className="text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-red-400 mb-2">Python Failed to Load</h3>
                        <p className="text-sm text-slate-400 mb-4">{error}</p>
                        <button
                            onClick={onRetry}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all"
                        >
                            Retry
                        </button>
                    </>
                ) : (
                    <>
                        <Loader2 size={36} className="text-emerald-400 animate-spin mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-slate-200 mb-2">{stage.label}...</h3>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${stage.progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">This downloads ~50 MB on first visit</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PyodideLoadingOverlay;
