import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from './AuthModal';

// Mock supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            resend: vi.fn(),
        },
        rpc: vi.fn(),
    },
}));

import { supabase } from '../lib/supabase';

describe('AuthModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.style.overflow = 'unset';
    });

    it('returns null when not open', () => {
        const { container } = render(<AuthModal isOpen={false} onClose={vi.fn()} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders sign in form by default', () => {
        render(<AuthModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    });

    it('renders sign up form when initialMode is signup', () => {
        render(<AuthModal isOpen={true} onClose={vi.fn()} initialMode="signup" />);
        expect(screen.getByText('Create Account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter cohort code')).toBeInTheDocument();
    });

    it('toggles between sign in and sign up', () => {
        render(<AuthModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Sign Up'));
        expect(screen.getByText('Create Account')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Sign In'));
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('calls onClose when X button is clicked', () => {
        const onClose = vi.fn();
        render(<AuthModal isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('locks body scroll when open', () => {
        render(<AuthModal isOpen={true} onClose={vi.fn()} />);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('signs in successfully', async () => {
        const onClose = vi.fn();
        supabase.auth.signInWithPassword.mockResolvedValueOnce({ error: null });

        render(<AuthModal isOpen={true} onClose={onClose} />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/••••/), {
            target: { value: 'password123' },
        });

        fireEvent.submit(screen.getByPlaceholderText('name@example.com').closest('form'));

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('displays sign in error', async () => {
        supabase.auth.signInWithPassword.mockResolvedValueOnce({
            error: { message: 'Invalid login credentials' },
        });

        render(<AuthModal isOpen={true} onClose={vi.fn()} />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/••••/), {
            target: { value: 'wrong' },
        });

        fireEvent.submit(screen.getByPlaceholderText('name@example.com').closest('form'));

        await waitFor(() => {
            expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
        });
    });

    it('shows error for invalid email', async () => {
        render(<AuthModal isOpen={true} onClose={vi.fn()} />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'not-an-email' },
        });
        fireEvent.change(screen.getByPlaceholderText(/••••/), {
            target: { value: 'password123' },
        });

        fireEvent.submit(screen.getByPlaceholderText('name@example.com').closest('form'));

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        });
    });

    it('switches to password reset mode', () => {
        render(<AuthModal isOpen={true} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Forgot Password?'));
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    it('sends password reset email', async () => {
        supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

        render(<AuthModal isOpen={true} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Forgot Password?'));

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.click(screen.getByText('Send Reset Link'));

        await waitFor(() => {
            expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
                'test@example.com',
                { redirectTo: expect.any(String) }
            );
            expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        });
    });
});
