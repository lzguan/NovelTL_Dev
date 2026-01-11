import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get_novel_by_id } from "../../api/novels";
import { type Novel } from "../../types/novel";
import { routeTo } from "../../routes";

export const NovelHeader = ({ novelId }: { novelId: number }) => {
    const [novel, setNovel] = useState<Novel | null>(null);

    useEffect(() => {
        get_novel_by_id(novelId).then(setNovel).catch(console.error);
    }, [novelId]);

    if (!novel) return <div>Loading novel info...</div>;

    return (
        <div style={{ marginBottom: '10px' }}>
            <Link to={routeTo.view.novel(novel.novel_id)} style={{ textDecoration: 'none', color: '#666', fontSize: '0.9rem' }}>
                &larr; Back to {novel.novel_title}
            </Link>
        </div>
    );
};