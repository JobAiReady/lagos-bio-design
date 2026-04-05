import { describe, it, expect, vi } from 'vitest';

const mockText = vi.fn();
const mockOutput = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }));

class MockJsPDF {
    constructor() {
        this.internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } };
        this.setFillColor = vi.fn();
        this.setDrawColor = vi.fn();
        this.setLineWidth = vi.fn();
        this.setTextColor = vi.fn();
        this.setFontSize = vi.fn();
        this.setFont = vi.fn();
        this.rect = vi.fn();
        this.roundedRect = vi.fn();
        this.line = vi.fn();
        this.text = mockText;
        this.getTextWidth = vi.fn(() => 100);
        this.output = mockOutput;
    }
}

vi.mock('jspdf', () => ({ jsPDF: MockJsPDF }));

import { generateCertificatePDF } from './certificate';

describe('generateCertificatePDF', () => {
    it('returns a Blob', async () => {
        const blob = await generateCertificatePDF('Ada Lovelace', '5 April 2026', 'abc123');
        expect(blob).toBeInstanceOf(Blob);
    });

    it('renders the student name on the certificate', async () => {
        mockText.mockClear();
        await generateCertificatePDF('Ada Lovelace', '5 April 2026', 'abc123');
        const calls = mockText.mock.calls.map(c => c[0]);
        expect(calls).toContain('Ada Lovelace');
    });

    it('renders the verification code', async () => {
        mockText.mockClear();
        await generateCertificatePDF('Ada Lovelace', '5 April 2026', 'abc123');
        const calls = mockText.mock.calls.map(c => c[0]);
        expect(calls.some(t => t.includes('abc123'))).toBe(true);
    });

    it('renders the issue date', async () => {
        mockText.mockClear();
        await generateCertificatePDF('Ada Lovelace', '5 April 2026', 'abc123');
        const calls = mockText.mock.calls.map(c => c[0]);
        expect(calls.some(t => t.includes('5 April 2026'))).toBe(true);
    });

    it('outputs as blob format', async () => {
        mockOutput.mockClear();
        await generateCertificatePDF('Test', '1 Jan 2026', 'code');
        expect(mockOutput).toHaveBeenCalledWith('blob');
    });
});
