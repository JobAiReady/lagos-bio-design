import { supabase } from './supabase';

export function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    let code = 'LBD-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += '-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

export async function fetchCohorts() {
    const { data, error } = await supabase
        .from('cohorts')
        .select('*, profiles(count)')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(c => ({
        ...c,
        enrolled: c.profiles?.[0]?.count ?? 0,
    }));
}

export async function createCohort({ name, startDate, maxStudents, accessCode }) {
    const { data, error } = await supabase
        .from('cohorts')
        .insert([{
            name,
            start_date: startDate,
            max_students: maxStudents,
            access_code: accessCode || generateAccessCode(),
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCohort(id, updates) {
    const { data, error } = await supabase
        .from('cohorts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
