import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

// Mock supabase
const mockUnsubscribe = vi.fn();
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

// Wires up a profiles fetch returning `profile`, and an is_active_enrollment
// RPC returning `enrollment`. Mirrors the two calls AuthContext makes.
const mockProfileFetch = (profile, enrollment = { data: true, error: null }) => {
    const single = vi.fn().mockResolvedValue({ data: profile, error: null });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    supabase.from.mockReturnValue({ select });
    supabase.rpc.mockResolvedValue(enrollment);
    return { select };
};

import { supabase } from '../lib/supabase';

const TestConsumer = () => {
    const { user, loading, isEnrolled } = useAuth();
    return (
        <div>
            <span data-testid="loading">{String(loading)}</span>
            <span data-testid="user">{user ? user.email : 'null'}</span>
            <span data-testid="enrolled">{String(isEnrolled)}</span>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        supabase.auth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: mockUnsubscribe } },
        });
    });

    it('starts with loading=true and user=null', () => {
        supabase.auth.getSession.mockReturnValue(new Promise(() => {})); // never resolves

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('loading').textContent).toBe('true');
        expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('sets user from session after getSession resolves', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: { user: { email: 'ada@example.com' } } },
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
            expect(screen.getByTestId('user').textContent).toBe('ada@example.com');
        });
    });

    it('derives enrollment from the server profile', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: { user: { id: 'user-1', email: 'ada@example.com' } } },
        });
        const { select } = mockProfileFetch({ full_name: 'Ada', plan: 'free', cohort_id: 7 });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('enrolled').textContent).toBe('true');
        });
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(select).toHaveBeenCalledWith('full_name, plan, cohort_id');
        expect(supabase.rpc).toHaveBeenCalledWith('is_active_enrollment');
    });

    it('is not enrolled when the cohort is no longer active', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: { user: { id: 'user-1', email: 'ada@example.com' } } },
        });
        // Profile still carries a cohort_id, but the cohort has been deactivated.
        mockProfileFetch(
            { full_name: 'Ada', plan: 'free', cohort_id: 7 },
            { data: false, error: null }
        );

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('enrolled').textContent).toBe('false');
    });

    it('falls back to cohort_id when the enrollment RPC is unavailable', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: { user: { id: 'user-1', email: 'ada@example.com' } } },
        });
        // e.g. the hardening migration has not been applied to this database.
        mockProfileFetch(
            { full_name: 'Ada', plan: 'free', cohort_id: 7 },
            { data: null, error: { message: 'function does not exist' } }
        );

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('enrolled').textContent).toBe('true');
        });
    });

    it('sets user to null when no session exists', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: null },
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
            expect(screen.getByTestId('user').textContent).toBe('null');
        });
    });

    it('subscribes to auth state changes', () => {
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: null },
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on unmount', () => {
        supabase.auth.getSession.mockResolvedValueOnce({
            data: { session: null },
        });

        const { unmount } = render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        unmount();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
});
