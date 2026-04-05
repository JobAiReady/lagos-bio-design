import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LabDetail from './LabDetail';

// Mock supabase
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockSingle = vi.fn();
const mockEqModuleId = vi.fn().mockReturnValue({ single: mockSingle });
const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqModuleId });
const mockSelectProgress = vi.fn().mockReturnValue({ eq: mockEqUserId });

vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
        from: vi.fn(() => ({
            select: mockSelectProgress,
            upsert: mockUpsert,
        })),
    },
}));

import { supabase } from '../lib/supabase';

const mockModule = {
    title: 'AlphaFold Module',
    colabUrl: 'https://colab.research.google.com/test',
    labContent: {
        objective: 'Predict a protein structure',
        prerequisites: ['Python 3.11', 'PyTorch'],
        steps: [
            { title: 'Step 1', description: 'Load the model', code: 'import torch' },
            { title: 'Step 2', description: 'Run prediction', code: 'model.predict()' },
            { title: 'Step 3', description: 'Analyze results', code: 'N/A' },
        ],
        deliverable: 'A PDB file',
    },
};

describe('LabDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('returns null when module is null', () => {
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
        const { container } = render(<LabDetail module={null} onClose={vi.fn()} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders module title and objective', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

        render(<LabDetail module={mockModule} onClose={vi.fn()} />);

        expect(screen.getByText('AlphaFold Module')).toBeInTheDocument();
        expect(screen.getByText('Predict a protein structure')).toBeInTheDocument();
    });

    it('renders all steps', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

        render(<LabDetail module={mockModule} onClose={vi.fn()} />);

        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('Step 2')).toBeInTheDocument();
        expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('renders code blocks for steps (except N/A)', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

        render(<LabDetail module={mockModule} onClose={vi.fn()} />);

        expect(screen.getByText('import torch')).toBeInTheDocument();
        expect(screen.getByText('model.predict()')).toBeInTheDocument();
        // "N/A" code should not render a code block
        expect(screen.queryByText('N/A')).not.toBeInTheDocument();
    });

    it('renders prerequisites', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

        render(<LabDetail module={mockModule} onClose={vi.fn()} />);

        expect(screen.getByText(/Python 3\.11/)).toBeInTheDocument();
        expect(screen.getByText(/PyTorch/)).toBeInTheDocument();
    });

    it('shows 0% progress initially', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

        render(<LabDetail module={mockModule} onClose={vi.fn()} />);

        expect(screen.getByText('0% Complete')).toBeInTheDocument();
    });

    it('calls onClose when X is clicked', async () => {
        supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
        const onClose = vi.fn();

        render(<LabDetail module={mockModule} onClose={onClose} />);

        const closeButton = screen.getByLabelText('Close lab');
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    describe('localStorage fallback (unauthenticated)', () => {
        beforeEach(() => {
            supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
        });

        it('saves progress to localStorage when step is toggled', async () => {
            render(<LabDetail module={mockModule} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('0% Complete')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Load the model'));

            await waitFor(() => {
                const saved = JSON.parse(localStorage.getItem('lab-progress-AlphaFold Module'));
                expect(saved).toContain(0);
            });
        });

        it('loads progress from localStorage on mount', async () => {
            localStorage.setItem('lab-progress-AlphaFold Module', JSON.stringify([0, 1]));

            render(<LabDetail module={mockModule} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('67% Complete')).toBeInTheDocument();
            });
        });

        it('untoggling a step removes it from localStorage', async () => {
            localStorage.setItem('lab-progress-AlphaFold Module', JSON.stringify([0]));

            render(<LabDetail module={mockModule} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('33% Complete')).toBeInTheDocument();
            });

            // Click step 1 again to untoggle
            fireEvent.click(screen.getByText('Load the model'));

            await waitFor(() => {
                const saved = JSON.parse(localStorage.getItem('lab-progress-AlphaFold Module'));
                expect(saved).not.toContain(0);
                expect(screen.getByText('0% Complete')).toBeInTheDocument();
            });
        });
    });

    describe('Supabase persistence (authenticated)', () => {
        const mockUser = { id: 'user-abc', email: 'test@example.com' };

        beforeEach(() => {
            supabase.auth.getSession.mockResolvedValue({
                data: { session: { user: mockUser } },
            });
        });

        it('loads progress from Supabase for authenticated user', async () => {
            mockSingle.mockResolvedValueOnce({
                data: { completed_steps: [0, 2] },
                error: null,
            });

            render(<LabDetail module={mockModule} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('67% Complete')).toBeInTheDocument();
            });

            expect(supabase.from).toHaveBeenCalledWith('user_progress');
        });

        it('saves progress to Supabase when step is toggled', async () => {
            mockSingle.mockResolvedValueOnce({ data: null, error: null });

            render(<LabDetail module={mockModule} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('0% Complete')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Load the model'));

            await waitFor(() => {
                expect(mockUpsert).toHaveBeenCalledWith({
                    user_id: 'user-abc',
                    module_id: 'AlphaFold Module',
                    completed_steps: [0],
                    updated_at: expect.any(String),
                });
            });
        });

        it('handles empty Supabase response gracefully', async () => {
            mockSingle.mockResolvedValueOnce({ data: null, error: null });

            render(<LabDetail module={mockModule} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('0% Complete')).toBeInTheDocument();
            });
        });
    });

    it('renders Colab link when colabUrl is provided', () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

        render(<LabDetail module={mockModule} onClose={vi.fn()} />);

        const colabLink = screen.getByText('Open in Colab');
        expect(colabLink.closest('a')).toHaveAttribute('href', 'https://colab.research.google.com/test');
        expect(colabLink.closest('a')).toHaveAttribute('target', '_blank');
    });
});
