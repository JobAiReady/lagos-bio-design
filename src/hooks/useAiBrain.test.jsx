import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAiBrain } from './useAiBrain';

// Mock both brains
vi.mock('../lib/ai/HeuristicBrain', () => ({
    HeuristicBrain: {
        id: 'heuristic-v1',
        name: 'Lab Assistant (Basic)',
        process: vi.fn(),
    },
}));

vi.mock('../lib/ai/LlmBrain', () => ({
    LlmBrain: {
        id: 'llm-claude',
        name: 'Lab Assistant (Claude)',
        process: vi.fn(),
    },
}));

import { HeuristicBrain } from '../lib/ai/HeuristicBrain';
import { LlmBrain } from '../lib/ai/LlmBrain';

const context = { code: '', logs: [], activeFile: 'main.py' };

describe('useAiBrain', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes with a welcome message', () => {
        const { result } = renderHook(() => useAiBrain());
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].role).toBe('assistant');
        expect(result.current.messages[0].text).toContain('System Online');
    });

    it('starts with HeuristicBrain name on free plan', () => {
        const { result } = renderHook(() => useAiBrain('free'));
        expect(result.current.brainName).toBe('Lab Assistant (Basic)');
        expect(result.current.isPro).toBe(false);
    });

    it('starts with LlmBrain name on pro plan', () => {
        const { result } = renderHook(() => useAiBrain('pro'));
        expect(result.current.brainName).toBe('Lab Assistant (Claude)');
        expect(result.current.isPro).toBe(true);
    });

    it('starts not thinking', () => {
        const { result } = renderHook(() => useAiBrain());
        expect(result.current.isThinking).toBe(false);
    });

    it('uses LlmBrain for pro users', async () => {
        LlmBrain.process.mockResolvedValueOnce({ text: 'Claude response', actions: [] });

        const { result } = renderHook(() => useAiBrain('pro'));

        await act(async () => {
            result.current.sendMessage('Hello', context);
        });

        expect(LlmBrain.process).toHaveBeenCalledWith({
            message: 'Hello',
            context,
        });
        expect(HeuristicBrain.process).not.toHaveBeenCalled();
        expect(result.current.messages).toHaveLength(3);
        expect(result.current.messages[2].text).toBe('Claude response');
        expect(result.current.brainName).toBe('Lab Assistant (Claude)');
    });

    it('falls back to HeuristicBrain when LlmBrain fails', async () => {
        LlmBrain.process.mockRejectedValueOnce(new Error('Edge Function not deployed'));
        HeuristicBrain.process.mockResolvedValueOnce({ text: 'Heuristic fallback', actions: [] });

        const { result } = renderHook(() => useAiBrain('pro'));

        await act(async () => {
            result.current.sendMessage('Help me', context);
        });

        // Heuristic brain uses setTimeout(800) delay
        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(LlmBrain.process).toHaveBeenCalled();
        expect(HeuristicBrain.process).toHaveBeenCalled();
        expect(result.current.messages).toHaveLength(3);
        expect(result.current.messages[2].text).toBe('Heuristic fallback');
        expect(result.current.brainName).toBe('Lab Assistant (Basic)');
    });

    it('stays on HeuristicBrain after first LlmBrain failure', async () => {
        // First call: LlmBrain fails
        LlmBrain.process.mockRejectedValueOnce(new Error('Not deployed'));
        HeuristicBrain.process.mockResolvedValueOnce({ text: 'Fallback 1', actions: [] });

        const { result } = renderHook(() => useAiBrain('pro'));

        await act(async () => {
            result.current.sendMessage('First', context);
        });
        act(() => { vi.advanceTimersByTime(800); });

        // Second call: should skip LlmBrain entirely
        HeuristicBrain.process.mockResolvedValueOnce({ text: 'Fallback 2', actions: [] });
        LlmBrain.process.mockClear();

        await act(async () => {
            result.current.sendMessage('Second', context);
        });
        act(() => { vi.advanceTimersByTime(800); });

        expect(LlmBrain.process).not.toHaveBeenCalled();
        expect(result.current.brainName).toBe('Lab Assistant (Basic)');
    });

    it('uses HeuristicBrain for free users without trying LlmBrain', async () => {
        HeuristicBrain.process.mockResolvedValueOnce({ text: 'Basic response', actions: [] });

        const { result } = renderHook(() => useAiBrain('free'));

        await act(async () => {
            result.current.sendMessage('Hello', context);
        });
        act(() => { vi.advanceTimersByTime(800); });

        expect(LlmBrain.process).not.toHaveBeenCalled();
        expect(HeuristicBrain.process).toHaveBeenCalled();
        expect(result.current.messages[2].text).toBe('Basic response');
    });

    it('adds user message immediately on sendMessage', async () => {
        LlmBrain.process.mockResolvedValueOnce({ text: 'ok', actions: [] });

        const { result } = renderHook(() => useAiBrain('pro'));

        act(() => {
            result.current.sendMessage('Hello', context);
        });

        expect(result.current.messages).toHaveLength(2);
        expect(result.current.messages[1].role).toBe('user');
        expect(result.current.messages[1].text).toBe('Hello');
        expect(result.current.isThinking).toBe(true);
    });

    it('handles total brain failure gracefully', async () => {
        LlmBrain.process.mockRejectedValueOnce(new Error('LLM down'));
        HeuristicBrain.process.mockRejectedValueOnce(new Error('Heuristic crash'));

        const { result } = renderHook(() => useAiBrain('pro'));

        await act(async () => {
            result.current.sendMessage('Break!', context);
        });

        const errorMsg = result.current.messages[2];
        expect(errorMsg.role).toBe('assistant');
        expect(errorMsg.text).toContain('internal error');
        expect(errorMsg.isError).toBe(true);
        expect(result.current.isThinking).toBe(false);
    });
});
