import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get_chapter_revisions_by_chapter } from "../../api/novels";
import { type RawChapterRevisionMeta } from "../../types/novel";
import { routeTo } from "../../routes";

interface Props {
    chapterId: number;
    activeRevisionId: number | null;
}

export const RevisionSidebar = ({ chapterId, activeRevisionId }: Props) => {
    // Initialize loading to true. The key prop in parent resets this on change.
    const [loading, setLoading] = useState(true);
    const [revisions, setRevisions] = useState<RawChapterRevisionMeta[]>([]);

    useEffect(() => {
        let mounted = true;
        // Do NOT call setLoading(true) here.

        get_chapter_revisions_by_chapter(chapterId)
            .then(data => {
                if (mounted) {
                    setRevisions(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [chapterId]);

    if (loading) return <div style={{ padding: '15px', color: '#666' }}>Loading versions...</div>;

    return (
        <div style={{ backgroundColor: '#fafafa', padding: '15px', height: '100%' }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Versions</h4>
            {revisions.length === 0 ? (
                <div style={{ fontStyle: 'italic', color: '#999', fontSize: '0.9rem' }}>No revisions found.</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {revisions.map((rev) => {
                        const isActive = rev.raw_chapter_revision_id === activeRevisionId;
                        return (
                            <li key={rev.raw_chapter_revision_id} style={{ marginBottom: '8px' }}>
                                <Link 
                                    to={routeTo.view.chapter(chapterId, rev.raw_chapter_revision_id)}
                                    style={{ 
                                        textDecoration: 'none',
                                        display: 'block',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem',
                                        backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                                        color: isActive ? '#1976d2' : '#333',
                                        fontWeight: isActive ? 'bold' : 'normal',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    {rev.raw_chapter_revision_title || '(Untitled)'}
                                    {rev.raw_chapter_revision_is_primary && ' ⭐'}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};