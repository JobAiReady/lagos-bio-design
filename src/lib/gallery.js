import { supabase } from './supabase';

// Upload a PDB file to Supabase Storage
export const uploadPDB = async (file, userId) => {
    // Create a unique path: user_id/timestamp_filename
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
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

// Fetch all public designs for the gallery
export const fetchGallery = async () => {
    const { data, error } = await supabase
        .from('protein_gallery')
        .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};
