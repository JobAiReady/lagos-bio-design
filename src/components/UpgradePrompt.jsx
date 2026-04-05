import React from 'react';
import { Sparkles } from 'lucide-react';

const UpgradePrompt = () => (
    <div className="mx-4 mt-2 px-3 py-2 bg-gradient-to-r from-emerald-900/30 to-slate-900 border border-emerald-500/20 rounded-lg flex items-center gap-2">
        <Sparkles size={12} className="text-emerald-400 shrink-0" />
        <p className="text-[10px] text-slate-400">
            <span className="text-emerald-400 font-medium">Pro</span> — Upgrade for Claude-powered AI assistance
        </p>
    </div>
);

export default UpgradePrompt;
