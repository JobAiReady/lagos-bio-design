import { supabase } from './supabase';

// Upload a PDB file to Supabase Storage
export const uploadPDB = async (file, userId) => {
    // Create a unique path: user_id/timestamp_filename
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { data: _uploadData, error } = await supabase.storage
        .from('designs')
        .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(fileName);

    return publicUrl;
};

// Publish a design to the database
export const publishDesign = async (design) => {
    /* 
      design object should look like:
      {
        user_id: '...',
        title: '...',
        description: '...',
        pdb_url: '...',
        tags: ['...'],
        metrics: {...}
      }
    */
    const { data, error } = await supabase
        .from('protein_gallery')
        .insert([design])
        .select();

    if (error) throw error;
    return data[0];
};

// Fetch public designs for the gallery with pagination
const PAGE_SIZE = 12;

export const fetchGallery = async ({ page = 0, search = '' } = {}) => {
    let query = supabase
        .from('protein_gallery')
        .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `, { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], total: count || 0, hasMore: (page + 1) * PAGE_SIZE < (count || 0) };
};
