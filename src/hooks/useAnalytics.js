import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

export const useAnalytics = () => {
    const location = useLocation();
    const { user } = useAuth();

    const trackEvent = useCallback(async (eventType, metadata = {}) => {
        if (!user) return; // Don't track unauthenticated users

        try {
            const { error } = await supabase
                .from('analytics_events')
                .insert({
                    user_id: user.id,
                    event_type: eventType,
                    metadata: {
                        path: location.pathname,
                        ...metadata
                    }
                });

            if (error) {
                console.warn('Analytics Error:', error);
            }
        } catch (err) {
            console.warn('Analytics Exception:', err);
        }
    }, [user, location.pathname]);

    // Auto-track page views
    useEffect(() => {
        trackEvent('page_view');
    }, [location.pathname, trackEvent]);

    return { trackEvent };
};
