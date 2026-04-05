import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonPanel from './LessonPanel';

const mockModule = {
    title: 'Protein Design Fundamentals',
    lessonContent: {
        summary: 'This is **bold text** and *italic text* for testing.',
        keyTerms: [
            { term: 'AlphaFold', definition: 'A protein structure prediction system' },
            { term: 'pLDDT', definition: 'Per-residue confidence score' },
        ],
        readingLinks: [
            { title: 'AlphaFold Paper', url: 'https://example.com/paper' },
        ],
        preLabQuestions: [
            'What is a protein backbone?',
            'How does diffusion work?',
        ],
    },
};

describe('LessonPanel', () => {
    it('returns null when module is null', () => {
        const { container } = render(<LessonPanel module={null} onClose={vi.fn()} />);
        expect(container.innerHTML).toBe('');
    });

    it('returns null when lessonContent is missing', () => {
        const { container } = render(<LessonPanel module={{ title: 'Test' }} onClose={vi.fn()} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders module title', () => {
        render(<LessonPanel module={mockModule} onClose={vi.fn()} />);
        expect(screen.getByText('Protein Design Fundamentals')).toBeInTheDocument();
    });

    it('renders overview with bold and italic as React elements (not HTML)', () => {
        render(<LessonPanel module={mockModule} onClose={vi.fn()} />);
        const bold = screen.getByText('bold text');
        expect(bold.tagName).toBe('STRONG');
        const italic = screen.getByText('italic text');
        expect(italic.tagName).toBe('EM');
    });

    it('does not use dangerouslySetInnerHTML', () => {
        const { container } = render(<LessonPanel module={mockModule} onClose={vi.fn()} />);
        // Verify no raw HTML was injected — bold text should be in a <strong> element
        const strongs = container.querySelectorAll('strong');
        expect(strongs.length).toBeGreaterThan(0);
        expect(strongs[0].textContent).toBe('bold text');
    });

    it('switches to Key Terms tab', () => {
        render(<LessonPanel module={mockModule} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Key Terms'));
        expect(screen.getByText('AlphaFold')).toBeInTheDocument();
        expect(screen.getByText('A protein structure prediction system')).toBeInTheDocument();
    });

    it('switches to Reading tab and renders links', () => {
        render(<LessonPanel module={mockModule} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Reading'));
        const link = screen.getByText('AlphaFold Paper');
        expect(link.closest('a')).toHaveAttribute('href', 'https://example.com/paper');
        expect(link.closest('a')).toHaveAttribute('target', '_blank');
        expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('switches to Pre-Lab Check tab and renders questions', () => {
        render(<LessonPanel module={mockModule} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Pre-Lab Check'));
        expect(screen.getByText('What is a protein backbone?')).toBeInTheDocument();
        expect(screen.getByText('How does diffusion work?')).toBeInTheDocument();
    });

    it('calls onClose when X button is clicked', () => {
        const onClose = vi.fn();
        render(<LessonPanel module={mockModule} onClose={onClose} />);
        // The X button is rendered by the Lucide X icon — find by role or nearest button
        const buttons = screen.getAllByRole('button');
        // The close button is the one without text content from our known buttons
        const closeBtn = buttons.find(b => !b.textContent.includes('Enter Lab') && !b.textContent.includes('Overview'));
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders Enter Lab button when onOpenLab is provided', () => {
        const onOpenLab = vi.fn();
        const onClose = vi.fn();
        render(<LessonPanel module={mockModule} onClose={onClose} onOpenLab={onOpenLab} />);
        const enterLabBtn = screen.getAllByText('Enter Lab')[0];
        fireEvent.click(enterLabBtn);
        expect(onClose).toHaveBeenCalled();
        expect(onOpenLab).toHaveBeenCalled();
    });

    it('does not render Enter Lab button when onOpenLab is not provided', () => {
        render(<LessonPanel module={mockModule} onClose={vi.fn()} />);
        expect(screen.queryByText('Enter Lab')).not.toBeInTheDocument();
    });
});
