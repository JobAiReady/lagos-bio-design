import React from 'react';
import { Bot, X } from 'lucide-react';

const AiFloatingButton = ({ isOpen, onClick }) => (
    <button
        onClick={onClick}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        className={`fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center ${
            isOpen
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-slate-900/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-105'
        }`}
    >
        {isOpen ? <X size={22} /> : <Bot size={22} />}
    </button>
);

export default AiFloatingButton;
