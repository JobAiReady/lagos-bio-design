import { describe, it, expect } from 'vitest';
import { HeuristicBrain } from './HeuristicBrain';

describe('HeuristicBrain', () => {
    it('has correct metadata', () => {
        expect(HeuristicBrain.id).toBe('heuristic-v1');
        expect(HeuristicBrain.name).toBe('Lab Assistant (Basic)');
    });

    describe('error detection', () => {
        it('detects SyntaxError in logs', async () => {
            const result = await HeuristicBrain.process({
                message: 'help',
                context: { code: '', logs: ['SyntaxError: unexpected EOF'], activeFile: 'main.py' },
            });
            expect(result.text).toContain('Syntax Error');
            expect(result.text).toContain('parentheses');
        });

        it('detects ModuleNotFoundError in logs', async () => {
            const result = await HeuristicBrain.process({
                message: 'help',
                context: { code: '', logs: ['ModuleNotFoundError: No module named torch'], activeFile: 'main.py' },
            });
            expect(result.text).toContain('missing a library');
        });

        it('detects generic errors in logs', async () => {
            const result = await HeuristicBrain.process({
                message: 'help',
                context: { code: '', logs: ['ValueError: invalid literal'], activeFile: 'main.py' },
            });
            expect(result.text).toContain('ValueError: invalid literal');
        });
    });

    describe('contextual code help', () => {
        it('explains ESM code when asked', async () => {
            const result = await HeuristicBrain.process({
                message: 'explain this code',
                context: { code: 'model = esm.pretrained.esm2()', logs: [], activeFile: 'main.py' },
            });
            expect(result.text).toContain('ESM-2');
        });

        it('explains PyTorch code when asked', async () => {
            const result = await HeuristicBrain.process({
                message: 'what does this do',
                context: { code: 'import torch\nmodel = torch.load("model.pt")', logs: [], activeFile: 'main.py' },
            });
            expect(result.text).toContain('PyTorch');
        });

        it('falls back to generic explain response', async () => {
            const result = await HeuristicBrain.process({
                message: 'explain',
                context: { code: 'x = 1', logs: [], activeFile: 'script.py' },
            });
            expect(result.text).toContain('script.py');
        });
    });

    describe('greetings', () => {
        it('responds to hello', async () => {
            const result = await HeuristicBrain.process({
                message: 'hello',
                context: { code: '', logs: [], activeFile: 'main.py' },
            });
            expect(result.text).toContain('Lab Assistant');
        });

        it('responds to hi', async () => {
            const result = await HeuristicBrain.process({
                message: 'Hi there!',
                context: { code: '', logs: [], activeFile: 'main.py' },
            });
            expect(result.text).toContain('Lab Assistant');
        });
    });

    describe('default fallback', () => {
        it('returns a helpful default for unmatched messages', async () => {
            const result = await HeuristicBrain.process({
                message: 'do a barrel roll',
                context: { code: '', logs: [], activeFile: 'main.py' },
            });
            expect(result.text).toContain('explain');
            expect(result.text).toContain('errors');
        });
    });

    it('error detection takes priority over other patterns', async () => {
        const result = await HeuristicBrain.process({
            message: 'hello',
            context: { code: '', logs: ['Error: kaboom'], activeFile: 'main.py' },
        });
        // Should respond about the error, not the greeting
        expect(result.text).toContain('error');
    });
});
