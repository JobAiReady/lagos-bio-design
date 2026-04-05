/**
 * LlmBrain.js
 *
 * The "Tier 2" intelligence engine for the AI Assistant.
 * Proxies requests to the Supabase ai-chat Edge Function (Claude API).
 * Conforms to the same interface as HeuristicBrain: .process() → { text, actions }
 */

import { supabase } from '../supabase';

export const LlmBrain = {
    id: 'llm-claude',
    name: 'Lab Assistant (Claude)',

    async process({ message, context }) {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: {
                message,
                context,
            },
        });

        if (error) {
            console.error('[LlmBrain] invoke error:', error);
            throw new Error(error.message || 'Edge Function call failed');
        }

        // Edge function returned a JSON error (non-2xx wrapped by Supabase)
        if (data?.error) {
            console.error('[LlmBrain] API error:', data.error, data.details);
            throw new Error(data.details || data.error);
        }

        if (!data?.response) {
            console.error('[LlmBrain] unexpected response shape:', data);
            throw new Error('No response field in edge function reply');
        }

        return {
            text: data.response,
            actions: [],
        };
    },
};
