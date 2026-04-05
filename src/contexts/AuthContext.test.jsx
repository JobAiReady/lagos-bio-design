import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock supabase
const mockUnsubscribe = vi.fn();
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
    },
}));

import { supabase } from '../lib/supabase';

const TestConsumer = () => {
    const { user, loading } = useAuth();
    return (
        <div>
            <span data-testid="loading">{String(loading)}</span>
            <span data-testid="user">{user ? user.email : 'null'}</span>
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
