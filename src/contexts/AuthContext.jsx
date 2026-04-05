import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextValue';
import { supabase } from '../lib/supabase';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId) => {
        if (!userId) {
            setProfile(null);
            return;
        }
        const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, plan')
            .eq('id', userId)
            .single();
        setProfile(data);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const sessionUser = session?.user ?? null;
            setUser(sessionUser);
            fetchProfile(sessionUser?.id).finally(() => setLoading(false));
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const sessionUser = session?.user ?? null;
            setUser(sessionUser);
            fetchProfile(sessionUser?.id);
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
