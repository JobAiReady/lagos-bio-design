import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublishModal from './PublishModal';

// Mock the gallery module
vi.mock('../lib/gallery', () => ({
    publishDesign: vi.fn(),
}));

import { publishDesign } from '../lib/gallery';

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    runData: { id: 'run-1', metrics: { pLDDT: 85 } },
    user: { id: 'user-123' },
    onPublishSuccess: vi.fn(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PublishModal', () => {

    it('returns null when not open', () => {
        const { container } = render(<PublishModal {...defaultProps} isOpen={false} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders the form when open', () => {
        render(<PublishModal {...defaultProps} />);
        expect(screen.getByText('Publish to Gallery')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g., Stable 4-Helix Bundle')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Describe your design hypothesis and results...')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
        const onClose = vi.fn();
        render(<PublishModal {...defaultProps} onClose={onClose} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('publishes with sanitized data on submit', async () => {
        publishDesign.mockResolvedValueOnce({});
        const onPublishSuccess = vi.fn();
        const onClose = vi.fn();

        render(
            <PublishModal
                {...defaultProps}
                onClose={onClose}
                onPublishSuccess={onPublishSuccess}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('e.g., Stable 4-Helix Bundle'), {
            target: { value: 'My Protein Design' },
        });
        fireEvent.change(screen.getByPlaceholderText('Describe your design hypothesis and results...'), {
            target: { value: 'A stable binder for testing' },
        });
        fireEvent.change(screen.getByPlaceholderText('RFDiffusion, Binder, Stable'), {
            target: { value: 'tag1, tag2' },
        });

        fireEvent.click(screen.getByText('Publish Design'));

        await waitFor(() => {
            expect(publishDesign).toHaveBeenCalledTimes(1);
        });

        const callArg = publishDesign.mock.calls[0][0];
        expect(callArg.title).toBe('My Protein Design');
        expect(callArg.user_id).toBe('user-123');
        expect(callArg.tags).toEqual(['tag1', 'tag2']);

        await waitFor(() => {
            expect(onPublishSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('shows error when title is too short', async () => {
        render(<PublishModal {...defaultProps} />);

        fireEvent.change(screen.getByPlaceholderText('e.g., Stable 4-Helix Bundle'), {
            target: { value: 'AB' },
        });
        fireEvent.change(screen.getByPlaceholderText('Describe your design hypothesis and results...'), {
            target: { value: 'Some description' },
        });

        fireEvent.click(screen.getByText('Publish Design'));

        await waitFor(() => {
            expect(screen.getByText('Failed to publish. Please try again.')).toBeInTheDocument();
        });
        expect(publishDesign).not.toHaveBeenCalled();
    });

    it('shows error when publishDesign rejects', async () => {
        publishDesign.mockRejectedValueOnce(new Error('Network error'));

        render(<PublishModal {...defaultProps} />);

        fireEvent.change(screen.getByPlaceholderText('e.g., Stable 4-Helix Bundle'), {
            target: { value: 'Valid Title Here' },
        });
        fireEvent.change(screen.getByPlaceholderText('Describe your design hypothesis and results...'), {
            target: { value: 'A description' },
        });

        fireEvent.click(screen.getByText('Publish Design'));

        await waitFor(() => {
            expect(screen.getByText('Failed to publish. Please try again.')).toBeInTheDocument();
        });
    });

    it('strips HTML tags from title via sanitizeText', async () => {
        publishDesign.mockResolvedValueOnce({});

        render(<PublishModal {...defaultProps} />);

        fireEvent.change(screen.getByPlaceholderText('e.g., Stable 4-Helix Bundle'), {
            target: { value: '<script>alert("xss")</script>Clean Title' },
        });
        fireEvent.change(screen.getByPlaceholderText('Describe your design hypothesis and results...'), {
            target: { value: 'Description text' },
        });

        fireEvent.click(screen.getByText('Publish Design'));

        await waitFor(() => {
            expect(publishDesign).toHaveBeenCalledTimes(1);
        });

        const callArg = publishDesign.mock.calls[0][0];
        expect(callArg.title).toBe('Clean Title');
        expect(callArg.title).not.toContain('<script>');
    });
});
