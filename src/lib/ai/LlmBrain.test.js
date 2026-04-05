import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmBrain } from './LlmBrain';

vi.mock('../supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

import { supabase } from '../supabase';

describe('LlmBrain', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('has correct metadata', () => {
        expect(LlmBrain.id).toBe('llm-claude');
        expect(LlmBrain.name).toBe('Lab Assistant (Claude)');
    });

    it('calls the ai-chat Edge Function with correct payload', async () => {
        supabase.functions.invoke.mockResolvedValueOnce({
            data: { response: 'Claude says hello' },
            error: null,
        });

        const ctx = { type: 'workspace', code: 'print("hi")', logs: ['output'], activeFile: 'test.py' };
        const result = await LlmBrain.process({
            message: 'Help me',
            context: ctx,
        });

        expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
            body: {
                message: 'Help me',
                context: ctx,
            },
        });
        expect(result).toEqual({ text: 'Claude says hello', actions: [] });
    });

    it('throws on Edge Function error', async () => {
        supabase.functions.invoke.mockResolvedValueOnce({
            data: null,
            error: { message: 'Function not found' },
        });

        await expect(
            LlmBrain.process({
                message: 'Hello',
                context: { code: '', logs: [], activeFile: 'main.py' },
            })
        ).rejects.toThrow('Function not found');
    });

    it('throws when response field is missing', async () => {
        supabase.functions.invoke.mockResolvedValueOnce({
            data: { response: null },
            error: null,
        });

        await expect(
            LlmBrain.process({
                message: 'Hello',
                context: { code: '', logs: [], activeFile: 'main.py' },
            })
        ).rejects.toThrow('No response field in edge function reply');
    });

    it('throws when edge function returns an API error', async () => {
        supabase.functions.invoke.mockResolvedValueOnce({
            data: { error: 'LLM API error', details: 'Invalid API key' },
            error: null,
        });

        await expect(
            LlmBrain.process({
                message: 'Hello',
                context: { code: '', logs: [], activeFile: 'main.py' },
            })
        ).rejects.toThrow('Invalid API key');
    });
});
