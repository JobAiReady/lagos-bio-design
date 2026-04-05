import React, { useEffect, useState, useCallback, useRef } from 'react';
import JobAiReadyHeader from '../components/JobAiReadyHeader';
import ProteinCard from '../components/ProteinCard';
import { fetchGallery, fetchLikeCounts, fetchUserLikes, toggleLike } from '../lib/gallery';
import { useAuth } from '../contexts/useAuth';
import { Loader2, Search } from 'lucide-react';

const Gallery = () => {
    const { user } = useAuth();
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [likeCounts, setLikeCounts] = useState({});
    const [userLikes, setUserLikes] = useState(new Set());
    const searchRef = useRef(search);

    const loadGallery = useCallback(async (pageNum, searchTerm, append = false) => {
        try {
            const result = await fetchGallery({ page: pageNum, search: searchTerm });
            let allDesigns;
            if (append) {
                setDesigns(prev => {
                    allDesigns = [...prev, ...result.data];
                    return allDesigns;
                });
            } else {
                allDesigns = result.data;
                setDesigns(allDesigns);
            }
            setHasMore(result.hasMore);

            // Fetch like data
            const ids = (allDesigns || result.data).map(d => d.id);
            const [counts, likes] = await Promise.all([
                fetchLikeCounts(ids),
                fetchUserLikes(user?.id),
            ]);
            setLikeCounts(counts);
            setUserLikes(likes);
        } catch (error) {
            console.error('Error loading gallery:', error);
        }
    }, [user]);

    useEffect(() => {
        const isNewSearch = searchRef.current !== search;
        searchRef.current = search;
        let cancelled = false;

        const debounce = setTimeout(() => {
            if (isNewSearch) setPage(0);
            loadGallery(0, search).finally(() => {
                if (!cancelled) setLoading(false);
            });
        }, search ? 300 : 0);

        return () => { cancelled = true; clearTimeout(debounce); };
    }, [search, loadGallery]);

    const handleToggleLike = async (designId) => {
        if (!user) return;
        try {
            const liked = await toggleLike(designId, user.id);
            setUserLikes(prev => {
                const next = new Set(prev);
                liked ? next.add(designId) : next.delete(designId);
                return next;
            });
            setLikeCounts(prev => ({
                ...prev,
                [designId]: (prev[designId] || 0) + (liked ? 1 : -1),
            }));
        } catch (err) {
            console.error('Like toggle failed:', err);
        }
    };

    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        await loadGallery(nextPage, search, true);
        setPage(nextPage);
        setLoadingMore(false);
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

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setLoading(true); }}
                            placeholder="Search structures..."
                            aria-label="Search protein designs"
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
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {designs.map((design) => (
                                <ProteinCard
                                    key={design.id}
                                    design={design}
                                    likeCount={likeCounts[design.id] || 0}
                                    isLiked={userLikes.has(design.id)}
                                    onToggleLike={user ? handleToggleLike : undefined}
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex justify-center mt-10">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-sm text-slate-300 transition-colors disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </span>
                                    ) : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-24 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        <h3 className="text-xl text-slate-300 font-medium mb-2">
                            {search ? 'No matching designs' : 'No designs yet'}
                        </h3>
                        <p className="text-slate-500">
                            {search ? 'Try a different search term.' : 'Be the first to publish a protein structure!'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Gallery;
