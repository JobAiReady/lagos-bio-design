import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase
vi.mock('../lib/supabase', () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    return {
        supabase: {
            auth: {
                getUser: vi.fn(),
            },
            from: vi.fn(() => ({
                insert: mockInsert,
            })),
            __mockInsert: mockInsert,
        },
    };
});

import { supabase } from '../lib/supabase';
import { useAnalytics } from './useAnalytics';

const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={['/workspace']}>{children}</MemoryRouter>
);

describe('useAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('auto-tracks page_view on mount for authenticated users', async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-1' } },
        });

        renderHook(() => useAnalytics(), { wrapper });

        // Wait for the async trackEvent to complete
        await vi.waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('analytics_events');
        });

        const insertCall = supabase.from('analytics_events').insert.mock.calls[0][0];
        expect(insertCall.user_id).toBe('user-1');
        expect(insertCall.event_type).toBe('page_view');
        expect(insertCall.metadata.path).toBe('/workspace');
    });

    it('does not track events for unauthenticated users', async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: null },
        });

        renderHook(() => useAnalytics(), { wrapper });

        // Give async code time to settle
        await new Promise((r) => setTimeout(r, 50));

        // from() is not called because user is null
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('exposes trackEvent function', () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: null },
        });

        const { result } = renderHook(() => useAnalytics(), { wrapper });
        expect(typeof result.current.trackEvent).toBe('function');
    });

    it('trackEvent includes custom metadata', async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-2' } },
        });

        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        supabase.from.mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useAnalytics(), { wrapper });

        // Wait for auto page_view to complete
        await vi.waitFor(() => {
            expect(mockInsert).toHaveBeenCalled();
        });

        mockInsert.mockClear();

        // Now call trackEvent manually with custom metadata
        await result.current.trackEvent('lab_started', { module: 'AlphaFold' });

        expect(mockInsert).toHaveBeenCalledWith({
            user_id: 'user-2',
            event_type: 'lab_started',
            metadata: {
                path: '/workspace',
                module: 'AlphaFold',
            },
        });
    });

    it('handles analytics errors gracefully without throwing', async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-3' } },
        });

        const mockInsert = vi.fn().mockResolvedValue({
            error: { message: 'Insert failed' },
        });
        supabase.from.mockReturnValue({ insert: mockInsert });

        // Should not throw
        renderHook(() => useAnalytics(), { wrapper });

        await vi.waitFor(() => {
            expect(mockInsert).toHaveBeenCalled();
        });
    });
});
