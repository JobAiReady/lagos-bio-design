import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useModuleProgress = (modulesData, user, refreshKey) => {
    const [moduleProgress, setModuleProgress] = useState({});

    useEffect(() => {
        const loadProgress = async () => {
            const progressMap = {};

            if (user) {
                const { data } = await supabase
                    .from('user_progress')
                    .select('module_id, completed_steps')
                    .eq('user_id', user.id);

                if (data) {
                    data.forEach(row => {
                        const mod = modulesData.find(m => m.title === row.module_id);
                        if (mod) {
                            const totalSteps = mod.labContent?.steps?.length || 0;
                            progressMap[row.module_id] = totalSteps > 0 ? Math.round((row.completed_steps.length / totalSteps) * 100) : 0;
                        }
                    });
                }
            } else {
                modulesData.forEach(mod => {
                    const saved = localStorage.getItem(`lab-progress-${mod.title}`);
                    if (saved) {
                        const completedSteps = JSON.parse(saved);
                        const totalSteps = mod.labContent?.steps?.length || 0;
                        progressMap[mod.title] = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;
                    } else {
                        progressMap[mod.title] = 0;
                    }
                });
            }
            setModuleProgress(progressMap);
        };

        loadProgress();
        window.addEventListener('storage', loadProgress);
        return () => window.removeEventListener('storage', loadProgress);
    }, [modulesData, user, refreshKey]);

    return moduleProgress;
};
