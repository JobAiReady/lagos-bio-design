import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextValue';
import { supabase } from '../lib/supabase';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [activeEnrollment, setActiveEnrollment] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId) => {
        setProfile(null);
        setActiveEnrollment(false);
        if (!userId) {
            return;
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, plan, cohort_id')
            .eq('id', userId)
            .single();
        if (error) {
            console.warn('[AuthContext] profile fetch failed:', error.message);
            setProfile(null);
            return;
        }
        setProfile(data);

        // A cohort_id alone is not enrollment — the cohort must still be active.
        // The server enforces this via the RESTRICTIVE policies backed by
        // public.is_active_enrollment(); mirror that predicate here so the UI
        // does not admit users the database will silently reject.
        const { data: isActive, error: enrollmentError } = await supabase.rpc(
            'is_active_enrollment'
        );
        if (enrollmentError) {
            // Fail open to the previous, weaker check rather than locking out a
            // whole cohort if the hardening migration has not been applied. The
            // server remains the real gate either way.
            console.warn(
                '[AuthContext] is_active_enrollment RPC failed, falling back to cohort_id:',
                enrollmentError.message
            );
            setActiveEnrollment(Boolean(data?.cohort_id));
            return;
        }
        setActiveEnrollment(Boolean(isActive));
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
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            isEnrolled: Boolean(user && profile?.cohort_id && activeEnrollment),
        }}>
            {children}
        </AuthContext.Provider>
    );
};
