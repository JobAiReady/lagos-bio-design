import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProteinCard from './ProteinCard';

const baseDesign = {
    title: 'Stable 4-Helix Bundle',
    description: 'A de novo designed protein',
    tags: ['RFDiffusion', 'Binder'],
    profiles: { full_name: 'Ada Lovelace', avatar_url: null },
    thumbnail_url: null,
    created_at: '2026-01-15T12:00:00Z',
};

describe('ProteinCard', () => {
    it('renders the design title', () => {
        render(<ProteinCard design={baseDesign} />);
        expect(screen.getByText('Stable 4-Helix Bundle')).toBeInTheDocument();
    });

    it('renders author name from profiles', () => {
        render(<ProteinCard design={baseDesign} />);
        expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });

    it('renders "Anonymous Scientist" when profiles.full_name is missing', () => {
        const design = { ...baseDesign, profiles: {} };
        render(<ProteinCard design={design} />);
        expect(screen.getByText('Anonymous Scientist')).toBeInTheDocument();
    });

    it('renders tags', () => {
        render(<ProteinCard design={baseDesign} />);
        expect(screen.getByText('RFDiffusion')).toBeInTheDocument();
        expect(screen.getByText('Binder')).toBeInTheDocument();
    });

    it('renders "No Preview" when thumbnail_url is null', () => {
        render(<ProteinCard design={baseDesign} />);
        expect(screen.getByText('No Preview')).toBeInTheDocument();
    });

    it('renders an image when thumbnail_url is provided', () => {
        const design = { ...baseDesign, thumbnail_url: 'https://example.com/img.png' };
        render(<ProteinCard design={design} />);
        const img = screen.getByAltText('Stable 4-Helix Bundle');
        expect(img).toHaveAttribute('src', 'https://example.com/img.png');
    });

    it('renders the formatted date', () => {
        render(<ProteinCard design={baseDesign} />);
        // Date formatting depends on locale, just check it renders something
        expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('handles missing tags gracefully', () => {
        const design = { ...baseDesign, tags: null };
        render(<ProteinCard design={design} />);
        expect(screen.getByText('Stable 4-Helix Bundle')).toBeInTheDocument();
    });
});
