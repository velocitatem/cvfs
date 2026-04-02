'use client';

import { Patch } from '@/libs/api';

const OP_SYMBOL: Record<string, string> = {
    replace_text: '±', remove_block: '−', reorder_section: '↕', boost_keyword: '+',
};

export default function DiffViewer({ patches }: { patches: Patch[] }) {
    if (!patches.length) {
        return (
            <div style={{ padding: '20px 0', color: 'var(--text-faint)', fontSize: 13 }}>
                No patches — identical to parent.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {patches.map(p => (
                <div key={p.id} style={{ borderLeft: '2px solid var(--border-strong)', paddingLeft: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                            {OP_SYMBOL[p.operation] ?? '·'} {p.target_path}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.operation}</span>
                    </div>
                    {p.old_value && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5, padding: '3px 6px', background: '#fef2f2', borderRadius: 3, marginBottom: 3, color: '#991b1b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            − {p.old_value}
                        </div>
                    )}
                    {p.new_value && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5, padding: '3px 6px', background: '#f0fdf4', borderRadius: 3, color: '#166534', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            + {p.new_value}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
