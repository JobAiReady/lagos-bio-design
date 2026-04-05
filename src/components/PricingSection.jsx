import React from 'react';
import { Check, Sparkles } from 'lucide-react';

const tiers = [
    {
        name: 'Free',
        price: '0',
        description: 'Get started with the fundamentals',
        features: [
            'All 5 course modules',
            'Browser-based Python lab',
            'Basic AI assistant',
            'Protein Gallery access',
            'Community support',
        ],
        cta: 'Get Started',
        highlight: false,
    },
    {
        name: 'Pro',
        price: '49',
        period: '/cohort',
        description: 'Full experience with Claude AI',
        features: [
            'Everything in Free',
            'Claude-powered AI assistant',
            'Certificate of completion',
            'Cohort-based learning',
            'Priority support',
        ],
        cta: 'Join Next Cohort',
        highlight: true,
    },
];

const PricingSection = ({ onApply }) => (
    <section className="py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Choose Your Path</h2>
            <p className="text-slate-400">
                Start free or join a guided cohort for the full experience.
            </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiers.map(tier => (
                <div
                    key={tier.name}
                    className={`rounded-xl p-6 border transition-all ${
                        tier.highlight
                            ? 'bg-gradient-to-br from-emerald-900/30 to-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/20'
                            : 'bg-slate-900 border-slate-800'
                    }`}
                >
                    {tier.highlight && (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                            <Sparkles size={12} />
                            Most Popular
                        </div>
                    )}

                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    <p className="text-sm text-slate-400 mt-1 mb-4">{tier.description}</p>

                    <div className="mb-6">
                        <span className="text-4xl font-bold text-white">${tier.price}</span>
                        {tier.period && <span className="text-slate-500 text-sm">{tier.period}</span>}
                    </div>

                    <ul className="space-y-3 mb-6">
                        {tier.features.map(feature => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                                <Check size={16} className={tier.highlight ? 'text-emerald-400' : 'text-slate-500'} />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={onApply}
                        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            tier.highlight
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                    >
                        {tier.cta}
                    </button>
                </div>
            ))}
        </div>
    </section>
);

export default PricingSection;
