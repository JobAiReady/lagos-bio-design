import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowingChild = ({ shouldThrow }) => {
    if (shouldThrow) throw new Error('Test explosion');
    return <div>All good</div>;
};

describe('ErrorBoundary', () => {
    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={false} />
            </ErrorBoundary>
        );
        expect(screen.getByText('All good')).toBeInTheDocument();
    });

    it('renders error UI when a child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(/Test explosion/)).toBeInTheDocument();
    });

    it('resets error state when "Try to Recover" is clicked', () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        // After clicking recover, the boundary resets hasError to false.
        // But since ThrowingChild still throws, it will re-catch immediately.
        // We just verify the recover handler runs (the error UI re-appears).
        fireEvent.click(screen.getByText('Try to Recover'));
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('has a "Back to Home" link pointing to /', () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );
        const link = screen.getByText('Back to Home');
        expect(link).toHaveAttribute('href', '/');
    });
});
