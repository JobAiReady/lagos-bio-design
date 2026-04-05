import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Award, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyCertificate = () => {
    const { code } = useParams();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const verify = async () => {
            const { data, error } = await supabase
                .from('certificates')
                .select('verification_code, issued_at, user_id, profiles:user_id (full_name)')
                .eq('verification_code', code)
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setCert(data);
            }
            setLoading(false);
        };
        verify();
    }, [code]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        <p className="text-slate-400">Verifying certificate...</p>
                    </div>
                ) : notFound ? (
                    <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-slate-100 mb-2">Certificate Not Found</h1>
                        <p className="text-slate-400 text-sm mb-6">
                            This verification code does not match any issued certificate.
                        </p>
                        <Link
                            to="/"
                            className="text-emerald-400 hover:text-emerald-300 text-sm hover:underline"
                        >
                            Back to Bootcamp
                        </Link>
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <Award className="w-8 h-8 text-emerald-400" />
                        </div>
                        <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-3" />
                        <h1 className="text-xl font-bold text-slate-100 mb-1">Verified Certificate</h1>
                        <p className="text-slate-400 text-sm mb-6">
                            This certificate is authentic and was issued by the Lagos Bio-Design Bootcamp.
                        </p>

                        <div className="bg-slate-950 rounded-lg p-4 mb-4 border border-slate-800">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recipient</p>
                            <p className="text-lg font-semibold text-white">
                                {cert.profiles?.full_name || 'Student'}
                            </p>
                        </div>

                        <div className="bg-slate-950 rounded-lg p-4 mb-6 border border-slate-800">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Issued</p>
                            <p className="text-slate-300">
                                {new Date(cert.issued_at).toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                })}
                            </p>
                        </div>

                        <p className="text-xs text-slate-600 font-mono">{code}</p>

                        <Link
                            to="/"
                            className="block mt-6 text-emerald-400 hover:text-emerald-300 text-sm hover:underline"
                        >
                            Learn more about the bootcamp
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyCertificate;
