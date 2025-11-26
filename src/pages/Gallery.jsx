import React, { useEffect, useState } from 'react';
import JobAiReadyHeader from '../components/JobAiReadyHeader';
import ProteinCard from '../components/ProteinCard';
import { fetchGallery } from '../lib/gallery';
import { Loader2, Search } from 'lucide-react';

const Gallery = () => {
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async () => {
        try {
            const data = await fetchGallery();
            setDesigns(data || []);
        } catch (error) {
            console.error('Error loading gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
            <JobAiReadyHeader />

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-800 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
                            Protein Gallery
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-lg">
                            Explore de novo protein designs created by the global bio-design community.
                            Open source, verified, and ready for synthesis.
                        </p>
                    </div>

                    {/* Search (Visual Only for now) */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search structures..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : designs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {designs.map((design) => (
                            <ProteinCard key={design.id} design={design} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        <h3 className="text-xl text-slate-300 font-medium mb-2">No designs yet</h3>
                        <p className="text-slate-500">Be the first to publish a protein structure!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Gallery;
