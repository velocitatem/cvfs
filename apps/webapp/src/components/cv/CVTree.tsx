'use client';

import { useState } from 'react';
import { Version } from '@/libs/api';

type TreeNode = { version: Version; children: TreeNode[] };

function buildTree(versions: Version[]): TreeNode | null {
    const map = new Map(versions.map(v => [v.id, { version: v, children: [] as TreeNode[] }]));
    let root: TreeNode | null = null;
    for (const node of map.values()) {
        const pid = node.version.parent_version_id;
        if (!pid) { root = node; } else { map.get(pid)?.children.push(node); }
    }
    return root;
}

const STATUS_CLASS: Record<string, string> = {
    draft: 'badge badge-draft', submitted: 'badge badge-submitted',
    interviewing: 'badge badge-interviewing', offer: 'badge badge-offer',
    rejected: 'badge badge-rejected', closed: 'badge badge-closed',
};

function Node({ node, depth, selectedId, onSelect }: {
    node: TreeNode; depth: number; selectedId: string | null; onSelect: (id: string) => void;
}) {
    const [open, setOpen] = useState(true);
    const v = node.version;
    const isSelected = v.id === selectedId;
    const hasChildren = node.children.length > 0;

    return (
        <div>
            <div
                onClick={() => onSelect(v.id)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    paddingLeft: 12 + depth * 16, paddingRight: 8,
                    height: 30, cursor: 'pointer',
                    background: isSelected ? 'var(--selected-bg)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--selected-border)' : '2px solid transparent',
                    transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
                <button
                    onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                    style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hasChildren ? 1 : 0, cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'var(--text-faint)', flexShrink: 0 }}
                >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                        <path d="M2 1l4 3-4 3V1z" />
                    </svg>
                </button>

                <span style={{ flex: 1, fontSize: 13, fontWeight: !v.parent_version_id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                    {v.version_label || v.branch_name}
                </span>
            </div>
            {open && node.children.map(child => (
                <Node key={child.version.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
            ))}
        </div>
    );
}

export default function CVTree({ versions, selectedVersionId, onSelect }: {
    versions: Version[]; selectedVersionId: string | null; onSelect: (id: string) => void;
}) {
    const tree = buildTree(versions);
    if (!tree) return <div style={{ padding: 16, fontSize: 13, color: 'var(--text-faint)' }}>No versions</div>;
    return (
        <div style={{ paddingBottom: 8 }}>
            <Node node={tree} depth={0} selectedId={selectedVersionId} onSelect={onSelect} />
        </div>
    );
}
