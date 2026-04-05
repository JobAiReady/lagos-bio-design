import React, { useState } from 'react';
import { Award, Download, Loader2 } from 'lucide-react';

const CertificateButton = ({ isEligible, isGenerating, onGenerate }) => {
    const [error, setError] = useState(null);

    if (!isEligible) return null;

    const handleClick = async () => {
        setError(null);
        try {
            await onGenerate();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-100">All Modules Complete!</h3>
                    <p className="text-xs text-slate-400">You've earned your certificate</p>
                </div>
            </div>

            <button
                onClick={handleClick}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        Download Certificate
                    </>
                )}
            </button>

            {error && (
                <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
        </div>
    );
};

export default CertificateButton;
