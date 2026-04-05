import { describe, it, expect } from 'vitest';
import { HeuristicBrain } from './HeuristicBrain';

const workspaceCtx = (overrides = {}) => ({
    type: 'workspace',
    code: '',
    logs: [],
    activeFile: 'main.py',
    ...overrides,
});

describe('HeuristicBrain', () => {
    it('has correct metadata', () => {
        expect(HeuristicBrain.id).toBe('heuristic-v1');
        expect(HeuristicBrain.name).toBe('Lab Assistant (Basic)');
    });

    describe('workspace — error detection', () => {
        it('detects SyntaxError in logs', async () => {
            const result = await HeuristicBrain.process({
                message: 'help',
                context: workspaceCtx({ logs: ['SyntaxError: unexpected EOF'] }),
            });
            expect(result.text).toContain('SyntaxError');
            expect(result.text).toContain('parentheses');
        });

        it('detects ModuleNotFoundError in logs', async () => {
            const result = await HeuristicBrain.process({
                message: 'help',
                context: workspaceCtx({ logs: ['ModuleNotFoundError: No module named torch'] }),
            });
            expect(result.text).toContain('missing a library');
        });

        it('detects generic errors in logs', async () => {
            const result = await HeuristicBrain.process({
                message: 'help',
                context: workspaceCtx({ logs: ['ValueError: invalid literal'] }),
            });
            expect(result.text).toContain('ValueError: invalid literal');
        });
    });

    describe('workspace — contextual code help', () => {
        it('explains ESM code when asked', async () => {
            const result = await HeuristicBrain.process({
                message: 'explain this code',
                context: workspaceCtx({ code: 'model = esm.pretrained.esm2()' }),
            });
            expect(result.text).toContain('ESM-2');
        });

        it('explains PyTorch code when asked', async () => {
            const result = await HeuristicBrain.process({
                message: 'what does this do',
                context: workspaceCtx({ code: 'import torch\nmodel = torch.load("model.pt")' }),
            });
            expect(result.text).toContain('PyTorch');
        });

        it('falls back to generic explain response', async () => {
            const result = await HeuristicBrain.process({
                message: 'explain',
                context: workspaceCtx({ code: 'x = 1', activeFile: 'script.py' }),
            });
            expect(result.text).toContain('script.py');
        });
    });

    describe('lesson context', () => {
        it('responds to explain in lesson mode', async () => {
            const result = await HeuristicBrain.process({
                message: 'explain this module',
                context: { type: 'lesson', moduleTitle: 'Module 1: The New Paradigm' },
            });
            expect(result.text).toContain('Module 1');
        });

        it('handles quiz requests in lesson mode', async () => {
            const result = await HeuristicBrain.process({
                message: 'quiz me',
                context: { type: 'lesson', moduleTitle: 'Module 2: Engineer Toolkit' },
            });
            expect(result.text).toContain('Module 2');
        });

        it('gives helpful default in lesson mode', async () => {
            const result = await HeuristicBrain.process({
                message: 'something random',
                context: { type: 'lesson', moduleTitle: 'Module 3: Generative AI' },
            });
            expect(result.text).toContain('Module 3');
        });
    });

    describe('lab context', () => {
        it('explains the objective when asked for help', async () => {
            const result = await HeuristicBrain.process({
                message: 'what do i do in this step?',
                context: { type: 'lab', moduleTitle: 'Module 1', objective: 'Visualize a protein' },
            });
            expect(result.text).toContain('Visualize a protein');
        });

        it('directs to Colab for code questions', async () => {
            const result = await HeuristicBrain.process({
                message: 'how do I run this code?',
                context: { type: 'lab', moduleTitle: 'Module 2' },
            });
            expect(result.text).toContain('Colab');
        });
    });

    describe('general context', () => {
        it('responds to hello', async () => {
            const result = await HeuristicBrain.process({
                message: 'hello',
                context: { type: 'curriculum' },
            });
            expect(result.text).toContain('Lab Assistant');
        });

        it('responds to protein questions', async () => {
            const result = await HeuristicBrain.process({
                message: 'what is alphafold?',
                context: { type: 'curriculum' },
            });
            expect(result.text).toContain('AlphaFold');
        });

        it('returns a helpful default for unmatched messages', async () => {
            const result = await HeuristicBrain.process({
                message: 'do a barrel roll',
                context: { type: 'curriculum' },
            });
            expect(result.text).toContain('explain');
        });
    });

    it('workspace error detection takes priority over other patterns', async () => {
        const result = await HeuristicBrain.process({
            message: 'hello',
            context: workspaceCtx({ logs: ['Error: kaboom'] }),
        });
        expect(result.text).toContain('error');
    });
});
