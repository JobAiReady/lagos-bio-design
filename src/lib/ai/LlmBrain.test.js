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

        const result = await LlmBrain.process({
            message: 'Help me',
            context: { code: 'print("hi")', logs: ['output'], activeFile: 'test.py' },
        });

        expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-chat', {
            body: {
                message: 'Help me',
                context: {
                    activeFile: 'test.py',
                    code: 'print("hi")',
                    logs: ['output'],
                },
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

    it('returns fallback text when response is empty', async () => {
        supabase.functions.invoke.mockResolvedValueOnce({
            data: { response: null },
            error: null,
        });

        const result = await LlmBrain.process({
            message: 'Hello',
            context: { code: '', logs: [], activeFile: 'main.py' },
        });

        expect(result.text).toBe('No response from AI.');
    });
});
