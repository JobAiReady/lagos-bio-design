import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { generateCertificatePDF } from '../lib/certificate';

export const useCertificate = (moduleProgress, modulesData, profile) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [certificate, setCertificate] = useState(null);

    const isEligible = useMemo(() => {
        if (!modulesData || !moduleProgress) return false;
        return modulesData.length > 0 &&
            modulesData.every(mod => moduleProgress[mod.title] === 100);
    }, [moduleProgress, modulesData]);

    const generateCertificate = async () => {
        if (!isEligible || isGenerating) return;
        setIsGenerating(true);

        try {
            // Call RPC to issue certificate (validates server-side)
            const { data, error } = await supabase.rpc('issue_certificate');
            if (error) throw new Error(error.message);

            setCertificate(data);

            // Generate PDF
            const studentName = profile?.full_name || 'Student';
            const date = new Date(data.issued_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
            });
            const blob = await generateCertificatePDF(studentName, date, data.verification_code);

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LBD-Certificate-${studentName.replace(/\s+/g, '-')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Certificate generation failed:', err);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    };

    return { isEligible, isGenerating, certificate, generateCertificate };
};
