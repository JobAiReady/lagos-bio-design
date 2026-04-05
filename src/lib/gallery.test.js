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
        function mockChain(resolvedValue) {
            const mockRange = vi.fn().mockResolvedValueOnce(resolvedValue);
            const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            supabase.from.mockReturnValueOnce({ select: mockSelect });
            return { mockSelect, mockEq, mockOrder, mockRange };
        }

        it('fetches public designs with pagination', async () => {
            const mockDesigns = [
                { id: '1', title: 'Design A', profiles: { full_name: 'Alice' } },
                { id: '2', title: 'Design B', profiles: { full_name: 'Bob' } },
            ];

            const { mockSelect, mockEq, mockOrder, mockRange } = mockChain({
                data: mockDesigns, error: null, count: 2,
            });

            const result = await fetchGallery();

            expect(supabase.from).toHaveBeenCalledWith('protein_gallery');
            expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('profiles'), { count: 'exact' });
            expect(mockEq).toHaveBeenCalledWith('is_public', true);
            expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(mockRange).toHaveBeenCalledWith(0, 11);
            expect(result).toEqual({ data: mockDesigns, total: 2, hasMore: false });
        });

        it('returns hasMore=true when more pages exist', async () => {
            mockChain({ data: Array(12).fill({ id: '1' }), error: null, count: 25 });

            const result = await fetchGallery({ page: 0 });
            expect(result.hasMore).toBe(true);
        });

        it('throws on fetch error', async () => {
            mockChain({ data: null, error: { message: 'Network error' }, count: null });

            await expect(fetchGallery()).rejects.toEqual({ message: 'Network error' });
        });

        it('returns empty data when no designs exist', async () => {
            mockChain({ data: [], error: null, count: 0 });

            const result = await fetchGallery();
            expect(result).toEqual({ data: [], total: 0, hasMore: false });
        });

        it('passes search filter with or clause', async () => {
            const mockOr = vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 });
            const mockRange = vi.fn().mockReturnValue({ or: mockOr });
            const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            supabase.from.mockReturnValueOnce({ select: mockSelect });

            await fetchGallery({ search: 'kinase' });

            expect(mockOr).toHaveBeenCalledWith(
                'title.ilike.%kinase%,description.ilike.%kinase%'
            );
        });
    });
});
