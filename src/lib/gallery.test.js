import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadPDB, publishDesign, fetchGallery } from './gallery';

// Mock supabase
vi.mock('./supabase', () => {
    const mockUpload = vi.fn();
    const mockGetPublicUrl = vi.fn();
    const mockInsert = vi.fn();
    const mockSelect = vi.fn();
    const mockEq = vi.fn();
    const mockOrder = vi.fn();

    return {
        supabase: {
            storage: {
                from: vi.fn(() => ({
                    upload: mockUpload,
                    getPublicUrl: mockGetPublicUrl,
                })),
            },
            from: vi.fn(() => ({
                insert: mockInsert,
                select: vi.fn(() => ({
                    eq: mockEq,
                })),
            })),
        },
        // Expose mocks for test access
        __mocks: { mockUpload, mockGetPublicUrl, mockInsert, mockSelect, mockEq, mockOrder },
    };
});

import { supabase } from './supabase';

describe('gallery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadPDB', () => {
        it('uploads file and returns public URL', async () => {
            const mockFile = new File(['pdb content'], 'protein.pdb', { type: 'text/plain' });
            const storageMock = supabase.storage.from('designs');

            storageMock.upload.mockResolvedValueOnce({ data: { path: 'user1/123_protein.pdb' }, error: null });
            storageMock.getPublicUrl.mockReturnValueOnce({
                data: { publicUrl: 'https://storage.example.com/user1/123_protein.pdb' },
            });

            const url = await uploadPDB(mockFile, 'user1');

            expect(supabase.storage.from).toHaveBeenCalledWith('designs');
            expect(storageMock.upload).toHaveBeenCalledWith(
                expect.stringContaining('user1/'),
                mockFile
            );
            expect(url).toBe('https://storage.example.com/user1/123_protein.pdb');
        });

        it('throws on upload error', async () => {
            const mockFile = new File(['data'], 'test.pdb');
            const storageMock = supabase.storage.from('designs');
            storageMock.upload.mockResolvedValueOnce({
                data: null,
                error: { message: 'Storage quota exceeded' },
            });

            await expect(uploadPDB(mockFile, 'user1')).rejects.toEqual({
                message: 'Storage quota exceeded',
            });
        });

        it('generates unique filenames with timestamp', async () => {
            const mockFile = new File(['data'], 'model.pdb');
            const storageMock = supabase.storage.from('designs');
            storageMock.upload.mockResolvedValueOnce({ data: {}, error: null });
            storageMock.getPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'url' } });

            await uploadPDB(mockFile, 'user42');

            const uploadPath = storageMock.upload.mock.calls[0][0];
            expect(uploadPath).toMatch(/^user42\/\d+_model\.pdb$/);
        });
    });

    describe('publishDesign', () => {
        it('inserts design and returns the created record', async () => {
            const design = {
                user_id: 'user1',
                title: 'Test Protein',
                description: 'A test',
                tags: ['test'],
            };

            const mockSelect = vi.fn().mockResolvedValueOnce({
                data: [{ id: 'design-1', ...design }],
                error: null,
            });
            const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
            supabase.from.mockReturnValueOnce({ insert: mockInsert });

            const result = await publishDesign(design);

            expect(supabase.from).toHaveBeenCalledWith('protein_gallery');
            expect(mockInsert).toHaveBeenCalledWith([design]);
            expect(result).toEqual({ id: 'design-1', ...design });
        });

        it('throws on insert error', async () => {
            const mockSelect = vi.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'RLS violation' },
            });
            const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
            supabase.from.mockReturnValueOnce({ insert: mockInsert });

            await expect(publishDesign({ title: 'Fail' })).rejects.toEqual({
                message: 'RLS violation',
            });
        });
    });

    describe('fetchGallery', () => {
        it('fetches public designs ordered by created_at desc', async () => {
            const mockDesigns = [
                { id: '1', title: 'Design A', profiles: { full_name: 'Alice' } },
                { id: '2', title: 'Design B', profiles: { full_name: 'Bob' } },
            ];

            const mockOrder = vi.fn().mockResolvedValueOnce({ data: mockDesigns, error: null });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            supabase.from.mockReturnValueOnce({ select: mockSelect });

            const result = await fetchGallery();

            expect(supabase.from).toHaveBeenCalledWith('protein_gallery');
            expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('profiles'));
            expect(mockEq).toHaveBeenCalledWith('is_public', true);
            expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(result).toEqual(mockDesigns);
        });

        it('throws on fetch error', async () => {
            const mockOrder = vi.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'Network error' },
            });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            supabase.from.mockReturnValueOnce({ select: mockSelect });

            await expect(fetchGallery()).rejects.toEqual({
                message: 'Network error',
            });
        });

        it('returns empty array when no designs exist', async () => {
            const mockOrder = vi.fn().mockResolvedValueOnce({ data: [], error: null });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            supabase.from.mockReturnValueOnce({ select: mockSelect });

            const result = await fetchGallery();
            expect(result).toEqual([]);
        });
    });
});
