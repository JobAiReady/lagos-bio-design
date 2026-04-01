import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const useAnalytics = () => {
    const location = useLocation();

    const trackEvent = useCallback(async (eventType, metadata = {}) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return; // Don't track unauthenticated users

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
    }, [location.pathname]);

    // Auto-track page views
    useEffect(() => {
        trackEvent('page_view');
    }, [location.pathname, trackEvent]);

    return { trackEvent };
};
