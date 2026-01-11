import { useEffect, useState } from "react";
import { get_chapter_revision_by_id } from "../../api/novels";
import { type RawChapterRevision } from "../../types/novel";

interface Props {
    revisionId: number | null;
}

export const RevisionContentDisplay = ({ revisionId }: Props) => {
    // 1. Initialize state based on props. 
    // If revisionId exists, we are loading. If null, we are not.
    const [loading, setLoading] = useState(!!revisionId);
    const [revision, setRevision] = useState<RawChapterRevision | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 2. STOP. If we have no ID, do NOTHING. 
        // We do not need to "reset" state here because the component remounts 
        // on ID change (thanks to the key prop), or we handle the null case 
        // in the render return below.
        if (!revisionId) return;

        let mounted = true;
        
        get_chapter_revision_by_id(revisionId)
            .then((data) => {
                if (mounted) {
                    setRevision(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (mounted) {
                    console.error(err);
                    setError("Failed to load revision content.");
                    setLoading(false);
                }
            });

        return () => { mounted = false; };
    }, [revisionId]);

    // --- Render Phase Logic ---

    // Case A: Loading (Only if we have an ID)
    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading content...</div>;
    }

    // Case B: No ID passed (e.g. empty list or initial load)
    if (!revisionId) {
        return (
            <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                backgroundColor: '#fff0f0', 
                border: '1px dashed #ffa0a0', 
                borderRadius: '8px',
                color: '#d63031',
                marginTop: '20px'
            }}>
                <h3>No Content Available</h3>
                <p>There are no revisions for this chapter yet.</p>
            </div>
        );
    }

    // Case C: Error or Success
    if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</div>;
    if (!revision) return null;

    return (
        <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            lineHeight: '1.8', 
            fontSize: '1.15rem',
            fontFamily: 'Georgia, serif',
            backgroundColor: '#fff',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            borderRadius: '4px'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>{revision.raw_chapter_revision_title}</h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{revision.raw_chapter_revision_text}</div>
        </div>
    );
};