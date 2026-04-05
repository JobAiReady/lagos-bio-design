import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCertificate } from './useCertificate';

vi.mock('../lib/supabase', () => ({
    supabase: {
        rpc: vi.fn(),
    },
}));

vi.mock('../lib/certificate', () => ({
    generateCertificatePDF: vi.fn(() => Promise.resolve(new Blob(['pdf']))),
}));

const modulesData = [
    { title: 'Module 1', labContent: { steps: [1, 2, 3] } },
    { title: 'Module 2', labContent: { steps: [1, 2] } },
    { title: 'Module 3', labContent: { steps: [1] } },
    { title: 'Module 4', labContent: { steps: [1, 2] } },
    { title: 'Module 5', labContent: { steps: [1] } },
];

describe('useCertificate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('isEligible is false when not all modules are 100%', () => {
        const progress = {
            'Module 1': 100,
            'Module 2': 100,
            'Module 3': 50,
            'Module 4': 100,
            'Module 5': 100,
        };

        const { result } = renderHook(() =>
            useCertificate(progress, modulesData, { full_name: 'Test' })
        );

        expect(result.current.isEligible).toBe(false);
    });

    it('isEligible is true when all modules are 100%', () => {
        const progress = {
            'Module 1': 100,
            'Module 2': 100,
            'Module 3': 100,
            'Module 4': 100,
            'Module 5': 100,
        };

        const { result } = renderHook(() =>
            useCertificate(progress, modulesData, { full_name: 'Test' })
        );

        expect(result.current.isEligible).toBe(true);
    });

    it('isEligible is false when moduleProgress is empty', () => {
        const { result } = renderHook(() =>
            useCertificate({}, modulesData, { full_name: 'Test' })
        );

        expect(result.current.isEligible).toBe(false);
    });

    it('isEligible is false when modulesData is empty', () => {
        const { result } = renderHook(() =>
            useCertificate({ 'Module 1': 100 }, [], { full_name: 'Test' })
        );

        expect(result.current.isEligible).toBe(false);
    });

    it('starts with isGenerating false and certificate null', () => {
        const { result } = renderHook(() =>
            useCertificate({}, modulesData, null)
        );

        expect(result.current.isGenerating).toBe(false);
        expect(result.current.certificate).toBeNull();
    });
});
