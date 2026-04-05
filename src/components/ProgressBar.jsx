import React from 'react';

const ProgressBar = ({ value = 0, label, color = 'bg-emerald-500' }) => (
    <div>
        {label && (
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-xs font-mono text-slate-500">{value}%</span>
            </div>
        )}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    </div>
);

export default ProgressBar;
