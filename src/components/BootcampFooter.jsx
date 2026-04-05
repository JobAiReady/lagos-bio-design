import React from 'react';

const BootcampFooter = () => {
    return (
        <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="mb-4">&copy; 2026 Lagos Bio-Design Bootcamp. All rights reserved.</p>
                <p className="text-xs text-slate-600 mb-3">For educational and research training purposes only. Not medical advice. Computational predictions are not experimental results.</p>
                <p className="text-xs text-slate-700 mb-3">
                    <a href="https://github.com/JobAiReady/lagos-bio-design/blob/main/PRIVACY_POLICY.md" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 underline">Privacy Policy</a>
                    <span className="mx-2">&middot;</span>
                    <a href="https://github.com/JobAiReady/lagos-bio-design/blob/main/DISCLAIMER.md" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 underline">Disclaimers</a>
                    <span className="mx-2">&middot;</span>
                    <a href="https://github.com/JobAiReady/lagos-bio-design/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 underline">Attributions</a>
                </p>
                <p className="text-xs font-mono text-emerald-900/50">Powered by JobAiReady.ai Intelligence Layer</p>
            </div>
        </footer>
    );
};

export default BootcampFooter;
