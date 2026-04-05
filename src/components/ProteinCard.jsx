import React from 'react';
import { User, Box, Tag, Heart, Star } from 'lucide-react';

const ProteinCard = ({ design, likeCount = 0, isLiked = false, onToggleLike }) => {
    const { title, description: _description, tags, profiles, thumbnail_url, created_at, featured } = design;

    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all group">
            {/* Thumbnail Area */}
            <div className="h-48 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                {thumbnail_url ? (
                    <img
                        src={thumbnail_url}
                        alt={title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="text-slate-600 flex flex-col items-center">
                        <Box className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-xs uppercase tracking-widest">No Preview</span>
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />

                {/* Featured Badge */}
                {featured && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-yellow-500/90 text-slate-900 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                        <Star size={10} />
                        Featured
                    </div>
                )}

                {/* Like Button */}
                {onToggleLike && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleLike(design.id); }}
                        className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs transition-colors hover:bg-slate-800"
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                    >
                        <Heart
                            size={14}
                            className={isLiked ? 'text-red-500 fill-red-500' : 'text-slate-400'}
                        />
                        <span className={isLiked ? 'text-red-400' : 'text-slate-400'}>{likeCount}</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="text-lg font-bold text-slate-100 mb-1 group-hover:text-emerald-400 transition-colors">
                    {title}
                </h3>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                    {profiles?.avatar_url ? (
                        <img src={profiles.avatar_url} className="w-5 h-5 rounded-full" alt={profiles.full_name} />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-3 h-3 text-slate-400" />
                        </div>
                    )}
                    <span className="text-xs text-slate-400">
                        {profiles?.full_name || 'Anonymous Scientist'}
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-xs text-slate-500">
                        {new Date(created_at).toLocaleDateString()}
                    </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {tags && tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-[10px] uppercase tracking-wider border border-slate-700 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProteinCard;
