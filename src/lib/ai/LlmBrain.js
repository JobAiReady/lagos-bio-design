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
                context: {
                    activeFile: context.activeFile,
                    code: context.code,
                    logs: context.logs,
                },
            },
        });

        if (error) {
            throw new Error(error.message || 'Edge Function call failed');
        }

        return {
            text: data?.response || 'No response from AI.',
            actions: [],
        };
    },
};
