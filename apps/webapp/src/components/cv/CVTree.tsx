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

const DOT_COLORS = ['#0a0a0a', '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

function Node({ node, depth, selectedId, onSelect, onDelete, colorIndex = 0 }: {
    node: TreeNode; depth: number; selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete?: (id: string) => void;
    colorIndex?: number;
}) {
    const [open, setOpen] = useState(true);
    const [hovered, setHovered] = useState(false);
    const v = node.version;
    const isRoot = !v.parent_version_id;
    const isSelected = v.id === selectedId;
    const isLeaf = node.children.length === 0;
    const dotColor = DOT_COLORS[colorIndex % DOT_COLORS.length];

    return (
        <div style={{ position: 'relative' }}>
            {depth > 0 && (
                <div style={{
                    position: 'absolute', left: -1, top: 15,
                    width: 14, height: 1, background: 'var(--border-strong)', zIndex: 1,
                }} />
            )}

            <div
                onClick={() => onSelect(v.id)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    paddingLeft: depth > 0 ? 18 : 8, paddingRight: 4,
                    height: 30, cursor: 'pointer', borderRadius: 4, userSelect: 'none',
                    background: isSelected ? 'var(--selected-bg)' : hovered ? 'var(--hover)' : 'transparent',
                    borderLeft: isSelected && depth === 0 ? '2px solid var(--selected-border)' : '2px solid transparent',
                }}
            >
                <button
                    onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                    style={{
                        width: 12, height: 12, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', background: 'none',
                        border: 'none', padding: 0, color: 'var(--text-faint)', flexShrink: 0,
                        opacity: node.children.length > 0 ? 1 : 0, pointerEvents: node.children.length > 0 ? 'auto' : 'none',
                    }}
                >
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"
                        style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }}>
                        <path d="M2 1l4 3-4 3V1z" />
                    </svg>
                </button>

                <span style={{
                    width: isRoot ? 8 : 7, height: isRoot ? 8 : 7,
                    borderRadius: '50%', flexShrink: 0,
                    background: isRoot || isSelected ? dotColor : 'transparent',
                    border: `2px solid ${dotColor}`,
                    transition: 'background 0.1s',
                }} />

                <span style={{
                    flex: 1, fontSize: 13,
                    fontWeight: isRoot ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: isSelected ? 'var(--text)' : isRoot ? 'var(--text)' : 'var(--text-muted)',
                }}>
                    {v.version_label || v.branch_name}
                </span>

                {v.patches.length > 0 && (
                    <span style={{
                        fontSize: 10, color: 'var(--text-faint)',
                        background: 'var(--hover)', padding: '1px 4px',
                        borderRadius: 3, flexShrink: 0,
                    }}>
                        {v.patches.length}
                    </span>
                )}

                {!isRoot && isLeaf && onDelete && hovered && (
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(v.id); }}
                        title="Delete branch"
                        aria-label="Delete branch"
                        style={{
                            width: 18, height: 18, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', background: 'none',
                            border: 'none', padding: 0, color: '#dc2626', flexShrink: 0,
                            borderRadius: 3, fontSize: 14, lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {open && node.children.length > 0 && (
                <div style={{
                    marginLeft: depth > 0 ? 22 : 14,
                    borderLeft: `1px solid var(--border)`,
                    paddingLeft: 0,
                }}>
                    {node.children.map((child, i) => (
                        <Node
                            key={child.version.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            colorIndex={depth === 0 ? i + 1 : colorIndex}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CVTree({ versions, selectedVersionId, onSelect, onDeleteVersion }: {
    versions: Version[]; selectedVersionId: string | null;
    onSelect: (id: string) => void;
    onDeleteVersion?: (id: string) => void;
}) {
    const tree = buildTree(versions);
    if (!tree) return <div style={{ padding: 16, fontSize: 13, color: 'var(--text-faint)' }}>No versions</div>;
    return (
        <div style={{ paddingBottom: 8 }}>
            <Node node={tree} depth={0} selectedId={selectedVersionId} onSelect={onSelect} onDelete={onDeleteVersion} />
        </div>
    );
}

