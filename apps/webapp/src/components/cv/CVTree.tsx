'use client';

import { MouseEvent, useState } from 'react';
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

export function versionToMarkdown(version: Version, parentName?: string): string {
    const header = `## ${version.version_label || version.branch_name}${parentName ? ` (from ${parentName})` : ''}`;
    const blocks = (version.structured_blocks ?? []).map(b =>
        `[${b.path}] ${b.block_type}: ${b.text}`
    ).join('\n');
    return `${header}\n\n${blocks || '(no blocks)'}`;
}

const DOT_COLORS = ['#0a0a0a', '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

function Node({ node, depth, selectedId, onSelect, onDelete, onCopyMarkdown, colorIndex = 0 }: {
    node: TreeNode; depth: number; selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete?: (id: string) => void;
    onCopyMarkdown?: (id: string) => void;
    colorIndex?: number;
}) {
    const [open, setOpen] = useState(true);
    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const v = node.version;
    const isRoot = !v.parent_version_id;
    const isSelected = v.id === selectedId;
    const dotColor = DOT_COLORS[colorIndex % DOT_COLORS.length];

    const handleCopy = (e: MouseEvent) => {
        e.stopPropagation();
        onCopyMarkdown?.(v.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

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

                {hovered && onCopyMarkdown && (
                    <button
                        onClick={handleCopy}
                        title="Copy Markdown"
                        aria-label="Copy Markdown"
                        style={{
                            width: 18, height: 18, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', background: 'none',
                            border: 'none', padding: 0, color: copied ? '#059669' : 'var(--text-faint)',
                            flexShrink: 0, borderRadius: 3, fontSize: 11, lineHeight: 1,
                        }}
                    >
                        {copied ? '✓' : '⎘'}
                    </button>
                )}

                {!isRoot && onDelete && hovered && (
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
                            onCopyMarkdown={onCopyMarkdown}
                            colorIndex={depth === 0 ? i + 1 : colorIndex}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CVTree({ versions, selectedVersionId, onSelect, onDeleteVersion, onCopyMarkdown }: {
    versions: Version[]; selectedVersionId: string | null;
    onSelect: (id: string) => void;
    onDeleteVersion?: (id: string) => void;
    onCopyMarkdown?: (id: string) => void;
}) {
    const tree = buildTree(versions);
    if (!tree) return <div style={{ padding: 16, fontSize: 13, color: 'var(--text-faint)' }}>No versions</div>;
    return (
        <div style={{ paddingBottom: 8 }}>
            <Node node={tree} depth={0} selectedId={selectedVersionId} onSelect={onSelect} onDelete={onDeleteVersion} onCopyMarkdown={onCopyMarkdown} />
        </div>
    );
}
