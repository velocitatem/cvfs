'use client';

import { useEffect, useRef, useState } from 'react';
import { previewVersionPdfUrl } from '@/libs/api';

function getToken(): string | null {
    if (typeof document === 'undefined') return null;
    return document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('oidc_token_pub='))?.split('=').slice(1).join('=') ?? null;
}

export default function PDFPreview({ documentId, versionId }: { documentId: string; versionId: string }) {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prevUrl = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const token = getToken();
        fetch(previewVersionPdfUrl(documentId, versionId), {
            headers: token ? { authorization: `Bearer ${decodeURIComponent(token)}` } : {},
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.blob();
            })
            .then(blob => {
                if (cancelled) return;
                if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
                const url = URL.createObjectURL(blob);
                prevUrl.current = url;
                setSrc(url);
            })
            .catch(e => { if (!cancelled) setError(e.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [documentId, versionId]);

    useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-faint)', fontSize: 13 }}>
            Rendering PDF…
        </div>
    );
    if (error) return (
        <div style={{ padding: 16, fontSize: 12, color: '#dc2626' }}>
            Preview unavailable: {error}
        </div>
    );
    if (!src) return null;

    return (
        <iframe
            src={src}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 4 }}
            title="CV Preview"
        />
    );
}
