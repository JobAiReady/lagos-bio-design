import React, { useState } from 'react';
import { X, Upload, Loader2, Tag } from 'lucide-react';
import { publishDesign } from '../lib/gallery';
import { sanitizeText, sanitizeDescription, sanitizeTags } from '../utils/sanitize';
import { useModalA11y } from '../hooks/useModalA11y';

const PublishModal = ({ isOpen, onClose, runData, user, onPublishSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState(null);

    const modalRef = useModalA11y(isOpen, onClose);

    if (!isOpen) return null;

    const handlePublish = async (e) => {
        e.preventDefault();
        setIsPublishing(true);
        setError(null);

        try {
            // Sanitize and prepare tags array
            const tagList = sanitizeTags(
                tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
            );

            // Validate required fields
            const sanitizedTitle = sanitizeText(title);
            const sanitizedDescription = sanitizeDescription(description);

            if (!sanitizedTitle || sanitizedTitle.length < 3) {
                throw new Error('Title must be at least 3 characters long');
            }

            // Construct design object with sanitized data
            const design = {
                user_id: user.id,
                title: sanitizedTitle,
                description: sanitizedDescription,
                tags: tagList,
                run_id: runData?.id, // Link to the run if available
                metrics: runData?.metrics,
                // For now, we use a placeholder or the run's PDB if we had it
                // In a real flow, we'd upload the PDB from the workspace state here
                thumbnail_url: 'https://placehold.co/600x400/0f172a/10b981?text=Protein+Structure',
                is_public: true
            };

            await publishDesign(design);

            onPublishSuccess();
            onClose();
        } catch (err) {
            console.error('Publish error:', err);
            setError('Failed to publish. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Publish to Gallery" tabIndex={-1} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl outline-none">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-emerald-500" />
                        Publish to Gallery
                    </h2>
                    <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handlePublish} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Stable 4-Helix Bundle"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your design hypothesis and results..."
                            rows={4}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Tags (comma separated)</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="RFDiffusion, Binder, Stable"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPublishing}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                'Publish Design'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PublishModal;
