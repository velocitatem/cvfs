'use client';

import { useEffect, useRef, useState } from 'react';
import CVTree from '@/components/cv/CVTree';
import DiffViewer from '@/components/cv/DiffViewer';
import InsightsPanel from '@/components/cv/InsightsPanel';
import Link from 'next/link';
import {
    appendPatches,
    createBranch, createSubmission, deleteDocument, deleteVersion,
    Document, downloadVersionUrl,
    fetchDocuments, fetchInsights, fetchSubmissions, fetchPublicAssetAnalytics, getPublicPdfUrl,
    InsightsResult,
    IS_DEMO,
    publishVersion, PublicAsset, PublicAssetAnalytics,
    requestAiSuggestions,
    Submission,
    SubmissionStatus,
    StructuredBlock,
    Suggestion,
    updateSubmissionStatus,
    updateSuggestion,
    uploadDocument,
    Version,
} from '@/libs/api';
import {
    DEMO_DOCUMENTS, DEMO_DOC_ID, DEMO_INSIGHTS, DEMO_SUBMISSIONS,
} from './demo-data';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
    draft: 'Draft',
    tailoring: 'Tailoring',
    pending_review: 'Passed screening',
    published: 'Submitted',
    archived: 'Closed',
};

const SUBMISSION_STATUS_OPTIONS: Array<{ value: SubmissionStatus; label: string }> = [
    { value: 'draft', label: 'Draft' },
    { value: 'tailoring', label: 'Tailoring' },
    { value: 'published', label: 'Submitted' },
    { value: 'pending_review', label: 'Passed screening' },
    { value: 'archived', label: 'Closed' },
];

function isSubmittedStatus(status: SubmissionStatus) {
    return status === 'published' || status === 'pending_review' || status === 'archived';
}

function statusBadge(status: SubmissionStatus) {
    const cls = ({
        draft: 'badge-draft', tailoring: 'badge-submitted', pending_review: 'badge-interviewing',
        published: 'badge-public', archived: 'badge-closed',
    } as Record<SubmissionStatus, string>)[status] ?? 'badge-draft';
    return <span className={`badge ${cls}`}>{SUBMISSION_STATUS_LABELS[status] ?? status.replace('_', ' ')}</span>;
}

// ── modals ────────────────────────────────────────────────────────────────────

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: (doc: Document) => void }) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef<HTMLInputElement>(null);

    const submit = async () => {
        if (!title.trim() || !file) { setError('Title and file required.'); return; }
        setLoading(true); setError('');
        try {
            const doc = await uploadDocument(title.trim(), desc.trim() || null, file);
            await Promise.resolve(onDone(doc));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Upload CV</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                    <input placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
                    <div onClick={() => ref.current?.click()} style={{
                        border: '1px dashed var(--border-strong)', borderRadius: 5, padding: '16px 0',
                        textAlign: 'center', cursor: 'pointer', fontSize: 13,
                        color: file ? 'var(--text)' : 'var(--text-muted)',
                    }}>
                        {file ? file.name : 'Click to select .docx'}
                    </div>
                    <input ref={ref} type="file" accept=".docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                            {loading ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BranchModal({
    version, initialPatches, onClose, onDone,
}: {
    version: Version;
    initialPatches?: Array<{ target_path: string; operation: string; old_value: string; new_value: string }>;
    onClose: () => void;
    onDone: (v: Version) => void;
}) {
    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const patches = initialPatches ?? [];

    const submit = async () => {
        if (!name.trim()) { setError('Branch name required.'); return; }
        setLoading(true); setError('');
        try {
            const v = await createBranch(version.id, name.trim(), label.trim() || null, patches as Record<string, unknown>[]);
            await Promise.resolve(onDone(v));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                <div className="modal-title">
                    New branch from <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{version.branch_name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Branch name (e.g. ml-engineer)" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    <input placeholder="Label (optional)" value={label} onChange={e => setLabel(e.target.value)} />
                    {patches.length > 0 && (
                        <div style={{ padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }}>
                            <div className="label" style={{ marginBottom: 6 }}>Staged edits ({patches.length})</div>
                            {patches.map((p, i) => (
                                <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                                    ± {p.target_path}
                                </div>
                            ))}
                        </div>
                    )}
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                            {loading ? 'Creating…' : 'Create branch'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SubmissionModal({ version, onClose, onDone }: { version: Version; onClose: () => void; onDone: (s: Submission) => void }) {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [url, setUrl] = useState('');
    const [jd, setJd] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!company.trim() || !role.trim()) { setError('Company and role required.'); return; }
        setLoading(true); setError('');
        try {
            const s = await createSubmission(version.id, company.trim(), role.trim(), url.trim() || null, jd.trim() || null);
            await Promise.resolve(onDone(s));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-title">New submission from <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{version.branch_name}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} autoFocus />
                        <input placeholder="Role title" value={role} onChange={e => setRole(e.target.value)} />
                    </div>
                    <input placeholder="Job URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
                    <textarea
                        placeholder="Paste job description (used for AI tailoring)"
                        value={jd} onChange={e => setJd(e.target.value)}
                        style={{ height: 100, resize: 'vertical' }}
                    />
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                            {loading ? 'Saving…' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PublishModal({ version, onClose, onDone }: { version: Version; onClose: () => void; onDone: (asset: PublicAsset) => void }) {
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        setLoading(true); setError('');
        try {
            const asset = await publishVersion(version.id, null, slug.trim() || null);
            await Promise.resolve(onDone(asset));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Publish version</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Freezes an immutable public artifact. Existing shares remain stable.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Custom slug (optional)" value={slug} onChange={e => setSlug(e.target.value)} autoFocus />
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                            {loading ? 'Publishing…' : 'Publish'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── content tab with inline editing ──────────────────────────────────────────

type PendingEdit = { old_value: string; new_value: string };

function ContentTab({
    blocks,
    pendingEdits,
    onEdit,
}: {
    blocks: StructuredBlock[];
    pendingEdits: Map<string, PendingEdit>;
    onEdit: (path: string, oldVal: string, newVal: string) => void;
}) {
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState('');

    const startEdit = (b: StructuredBlock) => {
        setEditing(b.path);
        setDraft(pendingEdits.get(b.path)?.new_value ?? b.text);
    };

    const saveEdit = (b: StructuredBlock) => {
        if (draft.trim() && draft !== b.text) {
            onEdit(b.path, b.text, draft.trim());
        }
        setEditing(null);
    };

    const cancelEdit = () => setEditing(null);

    if (!blocks.length) return (
        <div style={{ padding: '20px 0', color: 'var(--text-faint)', fontSize: 13 }}>No content blocks parsed.</div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {blocks.map((b) => {
                const pending = pendingEdits.get(b.path);
                const isEditing = editing === b.path;
                return (
                    <div key={b.path} style={{
                        borderBottom: '1px solid var(--border)',
                        padding: '6px 0',
                        background: pending ? '#fffbeb' : 'transparent',
                    }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)',
                                flexShrink: 0, width: 100, paddingTop: 3,
                            }}>
                                {b.path}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {isEditing ? (
                                    <>
                                        <textarea
                                            value={draft}
                                            onChange={e => setDraft(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveEdit(b); if (e.key === 'Escape') cancelEdit(); }}
                                            style={{ width: '100%', minHeight: 60, fontSize: 13, resize: 'vertical', marginBottom: 6 }}
                                            autoFocus
                                        />
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => saveEdit(b)}>
                                                Stage edit
                                            </button>
                                            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={cancelEdit}>
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <span style={{
                                            fontSize: 13, color: pending ? '#92400e' : 'var(--text)',
                                            lineHeight: 1.5, flex: 1,
                                        }}>
                                            {pending ? pending.new_value : b.text}
                                        </span>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ fontSize: 11, padding: '2px 7px', flexShrink: 0 }}
                                            onClick={() => startEdit(b)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── submissions tab ───────────────────────────────────────────────────────────

function SubmissionsTab({
    submissions, loading,
    onNewSubmission, onRefresh, onStatusChange,
}: {
    submissions: Submission[];
    loading: boolean;
    onNewSubmission: () => void;
    onRefresh: () => void;
    onStatusChange: (submissionId: string, status: SubmissionStatus) => void;
}) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState<string | null>(null);
    const [aiJd, setAiJd] = useState<Record<string, string>>({});
    const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({});

    const submittedCount = submissions.filter(s => isSubmittedStatus(s.status)).length;
    const passedScreeningCount = submissions.filter(s => s.status === 'pending_review').length;
    const successRate = submittedCount > 0
        ? Math.round((passedScreeningCount / submittedCount) * 100)
        : 0;

    const loadAi = async (s: Submission) => {
        const jd = aiJd[s.id] ?? s.job_description ?? '';
        if (!jd.trim()) return;
        setAiLoading(s.id);
        try {
            const res = await requestAiSuggestions(s.id, jd);
            setSuggestions(prev => ({ ...prev, [s.id]: res }));
            onRefresh();
        } catch { /* ignore */ }
        finally { setAiLoading(null); }
    };

    const toggleSuggestion = async (sub: Submission, sug: Suggestion, accepted: boolean) => {
        try {
            await updateSuggestion(sub.id, sug.id, accepted);
            setSuggestions(prev => ({
                ...prev,
                [sub.id]: (prev[sub.id] ?? sub.suggestions).map(s => s.id === sug.id ? { ...s, accepted } : s),
            }));
        } catch { /* ignore */ }
    };

    const changeStatus = async (sub: Submission, nextStatus: SubmissionStatus) => {
        if (sub.status === nextStatus) return;
        setStatusLoading(sub.id);
        try {
            const updated = await updateSubmissionStatus(sub.id, nextStatus);
            onStatusChange(updated.id, updated.status);
        } catch {
            // ignore for now
        } finally {
            setStatusLoading(null);
        }
    };

    if (loading) return <div style={{ padding: '20px 0', color: 'var(--text-faint)', fontSize: 13 }}>Loading…</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onNewSubmission}>+ New submission</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                    <div className="label" style={{ marginBottom: 4 }}>Submitted</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{submittedCount}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                    <div className="label" style={{ marginBottom: 4 }}>Passed screening</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{passedScreeningCount}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                    <div className="label" style={{ marginBottom: 4 }}>Success rate</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{successRate}%</div>
                </div>
            </div>

            {submissions.length === 0 && (
                <div style={{ padding: '20px 0', color: 'var(--text-faint)', fontSize: 13 }}>
                    No submissions yet. Create one to track a job application and get AI tailoring suggestions.
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {submissions.map(s => {
                    const isOpen = expanded === s.id;
                    const sugs = suggestions[s.id] ?? s.suggestions;

                    return (
                        <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                            {/* header row */}
                            <div
                                onClick={() => setExpanded(isOpen ? null : s.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                    cursor: 'pointer', background: isOpen ? 'var(--hover)' : 'transparent',
                                }}
                            >
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" style={{ color: 'var(--text-faint)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s', flexShrink: 0 }}>
                                    <path d="M2 1l4 3-4 3V1z" />
                                </svg>
                                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                                    {s.company_name} — {s.role_title}
                                </span>
                                {statusBadge(s.status)}
                                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmt(s.created_at)}</span>
                            </div>

                            {/* expanded body */}
                            {isOpen && (
                                <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                                    {s.job_url && (
                                        <a href={s.job_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
                                            {s.job_url}
                                        </a>
                                    )}

                                    <div style={{ marginBottom: 12 }}>
                                        <div className="label" style={{ marginBottom: 6 }}>Application stage</div>
                                        <select
                                            value={s.status}
                                            onChange={e => changeStatus(s, e.target.value as SubmissionStatus)}
                                            disabled={statusLoading === s.id}
                                            style={{ maxWidth: 280 }}
                                        >
                                            {SUBMISSION_STATUS_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* AI tailoring */}
                                    <div style={{ marginBottom: 12 }}>
                                        <div className="label" style={{ marginBottom: 6 }}>AI tailoring</div>
                                        <textarea
                                            placeholder="Paste or edit job description for AI suggestions…"
                                            value={aiJd[s.id] ?? s.job_description ?? ''}
                                            onChange={e => setAiJd(prev => ({ ...prev, [s.id]: e.target.value }))}
                                            style={{ height: 80, resize: 'vertical', fontSize: 12, marginBottom: 6 }}
                                        />
                                        <button
                                            className="btn btn-ghost"
                                            style={{ fontSize: 12 }}
                                            disabled={aiLoading === s.id || !(aiJd[s.id] ?? s.job_description)}
                                            onClick={() => loadAi(s)}
                                        >
                                            {aiLoading === s.id ? 'Generating…' : sugs.length > 0 ? 'Regenerate suggestions' : 'Get AI suggestions'}
                                        </button>
                                    </div>

                                    {/* suggestions list */}
                                    {sugs.length > 0 && (
                                        <div>
                                            <div className="label" style={{ marginBottom: 8 }}>Suggestions ({sugs.length})</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {sugs.map(sug => (
                                                    <div key={sug.id} style={{
                                                        borderLeft: `3px solid ${sug.accepted === true ? '#22c55e' : sug.accepted === false ? '#ef4444' : 'var(--border-strong)'}`,
                                                        paddingLeft: 10,
                                                    }}>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                                                                ± {sug.target_path}
                                                            </span>
                                                            {sug.metadata_json?.confidence !== undefined && (
                                                                <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                                                                    {Math.round((sug.metadata_json.confidence as number) * 100)}% conf
                                                                </span>
                                                            )}
                                                        </div>
                                                        {sug.proposed_text && (
                                                            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4, lineHeight: 1.4 }}>
                                                                {sug.proposed_text}
                                                            </div>
                                                        )}
                                                        {sug.rationale && (
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontStyle: 'italic' }}>
                                                                {sug.rationale}
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ fontSize: 11, padding: '2px 8px', color: sug.accepted === true ? '#166534' : 'var(--text-muted)', borderColor: sug.accepted === true ? '#86efac' : 'var(--border)' }}
                                                                onClick={() => toggleSuggestion(s, sug, true)}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ fontSize: 11, padding: '2px 8px', color: sug.accepted === false ? '#991b1b' : 'var(--text-muted)', borderColor: sug.accepted === false ? '#fca5a5' : 'var(--border)' }}
                                                                onClick={() => toggleSuggestion(s, sug, false)}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── main dashboard ────────────────────────────────────────────────────────────

type Modal = 'upload' | 'branch' | 'submission' | 'publish' | null;
type Tab = 'content' | 'patches' | 'submissions' | 'insights';

export default function Dashboard() {
    const [docs, setDocs] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState<Modal>(null);
    const [publishedAnalytics, setPublishedAnalytics] = useState<Record<string, PublicAssetAnalytics>>({});
    const [recentlyPublishedSlug, setRecentlyPublishedSlug] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('content');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [pendingEdits, setPendingEdits] = useState<Map<string, { old_value: string; new_value: string }>>(new Map());
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [docHovered, setDocHovered] = useState<string | null>(null);
    const [applyLoading, setApplyLoading] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [insights, setInsights] = useState<InsightsResult | null>(null);

    useEffect(() => {
        if (IS_DEMO) {
            setDocs(DEMO_DOCUMENTS);
            setAllSubmissions(DEMO_SUBMISSIONS);
            setSelectedDocId(DEMO_DOC_ID);
            setInsights(DEMO_INSIGHTS);
            setLoading(false);
            return;
        }
        Promise.all([fetchDocuments(), fetchSubmissions().catch(() => [])])
            .then(([d, allSubs]) => {
                setDocs(d);
                setAllSubmissions(allSubs);
                if (d.length) { setSelectedDocId(d[0].id); setSelectedVersionId(null); }
            })
            .catch(() => setError('Failed to load documents. Make sure the backend is running.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (IS_DEMO || !selectedDocId) return;
        fetchInsights().then(setInsights).catch(() => setInsights(null));
    }, [selectedDocId]);

    useEffect(() => {
        setPendingEdits(new Map());
        setApplyError('');
        setApplyLoading(false);
        setPublishedAnalytics({});
        setRecentlyPublishedSlug(null);
    }, [selectedVersionId]);

    useEffect(() => {
        if (activeTab !== 'submissions' || !selectedVersionId) return;
        setSubsLoading(true);
        fetchSubmissions(selectedVersionId)
            .then(setSubmissions)
            .catch(() => { })
            .finally(() => setSubsLoading(false));
    }, [activeTab, selectedVersionId]);

    const selectedDoc = docs.find(d => d.id === selectedDocId) ?? null;
    const selectedVersion = selectedDoc?.versions.find(v => v.id === selectedVersionId) ?? null;
    const selectedDocVersionIds = new Set((selectedDoc?.versions ?? []).map(v => v.id));
    const selectedDocSubmissions = allSubmissions.filter(s => selectedDocVersionIds.has(s.version_id));
    const selectedDocSubmittedCount = selectedDocSubmissions.filter(s => isSubmittedStatus(s.status)).length;
    const selectedDocPassedScreeningCount = selectedDocSubmissions.filter(s => s.status === 'pending_review').length;
    const selectedDocSuccessRate = selectedDocSubmittedCount > 0
        ? Math.round((selectedDocPassedScreeningCount / selectedDocSubmittedCount) * 100)
        : 0;
    const publishedAssets = selectedVersion?.public_assets ?? [];
    const sortedPublishedAssets = [...publishedAssets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const publicBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');

    const resolveAssetUrl = (asset: PublicAsset): string => {
        if (asset.url) return asset.url;
        if (publicBaseUrl) return `${publicBaseUrl}/cv/${asset.slug}`;
        return `/cv/${asset.slug}`;
    };

    const loadPublishedAnalytics = async (slug: string) => {
        try {
            const stats = await fetchPublicAssetAnalytics(slug);
            setPublishedAnalytics(prev => ({ ...prev, [slug]: stats }));
        } catch {
            // swallow for now; UI button can be retried
        }
    };

    const refreshDocs = async () => {
        const fresh = await fetchDocuments().catch(() => docs);
        setDocs(fresh);
        refreshAllSubs();
        return fresh;
    };

    const refreshSubs = () => {
        if (!selectedVersionId) return;
        fetchSubmissions(selectedVersionId).then(setSubmissions).catch(() => { });
    };

    function refreshAllSubs() {
        fetchSubmissions().then(setAllSubmissions).catch(() => { });
    }

    const onUploadDone = (doc: Document) => {
        setDocs(prev => [doc, ...prev.filter(d => d.id !== doc.id)]);
        setSelectedDocId(doc.id);
        setSelectedVersionId(null);
        setModal(null);
        setSidebarOpen(false);
    };

    const onBranchDone = async (v: Version) => {
        const fresh = await refreshDocs();
        const doc = fresh.find(d => d.id === selectedDocId);
        if (doc?.versions.find(x => x.id === v.id)) setSelectedVersionId(v.id);
        setPendingEdits(new Map());
        setModal(null);
    };

    const onSubmissionDone = (s: Submission) => {
        setSubmissions(prev => [s, ...prev]);
        setAllSubmissions(prev => [s, ...prev]);
        setModal(null);
        setActiveTab('submissions');
    };

    const handleSubmissionStatusChange = (submissionId: string, status: SubmissionStatus) => {
        setSubmissions(prev => prev.map(s => (s.id === submissionId ? { ...s, status } : s)));
        setAllSubmissions(prev => prev.map(s => (s.id === submissionId ? { ...s, status } : s)));
    };

    const stageEdit = (path: string, old_value: string, new_value: string) => {
        setPendingEdits(prev => new Map(prev).set(path, { old_value, new_value }));
    };

    const discardEdits = () => setPendingEdits(new Map());

    const applyStagedEdits = async () => {
        if (!selectedVersionId || !stagedPatches.length) return;
        setApplyLoading(true);
        setApplyError('');
        try {
            await appendPatches(selectedVersionId, stagedPatches as Record<string, unknown>[]);
            await refreshDocs();
            setPendingEdits(new Map());
        } catch (e: unknown) {
            setApplyError(e instanceof Error ? e.message : 'Failed to apply edits');
        } finally {
            setApplyLoading(false);
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (IS_DEMO) return;
        if (!confirm('Delete this CV and all its branches? This cannot be undone.')) return;
        try {
            await deleteDocument(docId);
            const updated = docs.filter(d => d.id !== docId);
            setDocs(updated);
            if (selectedDocId === docId) {
                setSelectedDocId(updated[0]?.id ?? null);
                setSelectedVersionId(null);
            }
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : 'Delete failed');
        }
    };

    const handleDeleteVersion = async (versionId: string) => {
        if (IS_DEMO) return;
        const hasChildren = selectedDoc?.versions.some(v => v.parent_version_id === versionId);
        const msg = hasChildren
            ? 'Delete this branch and all its sub-branches? This cannot be undone.'
            : 'Delete this branch? This cannot be undone.';
        if (!confirm(msg)) return;
        try {
            await deleteVersion(versionId);
            const fresh = await refreshDocs();
            if (selectedVersionId === versionId) {
                const doc = fresh.find(d => d.id === selectedDocId) ?? null;
                if (!doc) setSelectedDocId(null);
                setSelectedVersionId(null);
            }
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : 'Delete failed');
        }
    };

    const selectVersion = (id: string) => {
        setSelectedVersionId(id);
        setActiveTab('content');
        setSidebarOpen(false);
    };

    const pendingCount = pendingEdits.size;
    const stagedPatches = [...pendingEdits.entries()].map(([path, { old_value, new_value }]) => ({
        target_path: path, operation: 'replace_text', old_value, new_value,
    }));

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <div className="dashboard-root">
            {/* top bar */}
            <div className="topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        className="btn btn-ghost sidebar-toggle"
                        style={{ padding: '4px 8px', fontSize: 16 }}
                        onClick={() => setSidebarOpen(o => !o)}
                        aria-label="Toggle menu"
                    >
                        ☰
                    </button>
                    <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                        cvfs
                    </Link>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {IS_DEMO && (
                        <span style={{ fontSize: 11, padding: '2px 10px', background: '#7c3aed', color: '#fff', borderRadius: 9999, fontWeight: 600, letterSpacing: '0.04em' }}>
                            DEMO
                        </span>
                    )}
                    {!IS_DEMO && (
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal('upload')}>
                            + Upload CV
                        </button>
                    )}
                    {!IS_DEMO && (
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={logout}>
                            Sign out
                        </button>
                    )}
                </div>
            </div>

            <div className="dashboard-body">
                {/* sidebar overlay on mobile */}
                {sidebarOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* left panel */}
                <div className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
                    {loading && <div style={{ padding: 16, fontSize: 13, color: 'var(--text-faint)' }}>Loading…</div>}
                    {error && <div style={{ padding: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

                    {!loading && !error && docs.length === 0 && (
                        <div style={{ padding: 16 }}>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No CVs yet.</p>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setModal('upload')}>
                                Upload your first CV
                            </button>
                        </div>
                    )}

                    {docs.length > 0 && (
                        <>
                            <div style={{ padding: '10px 12px 6px' }}>
                                <div className="label" style={{ marginBottom: 6 }}>Documents</div>
                                {docs.map(d => (
                                    <div
                                        key={d.id}
                                        onMouseEnter={() => setDocHovered(d.id)}
                                        onMouseLeave={() => setDocHovered(null)}
                                        onClick={() => {
                                            setSelectedDocId(d.id);
                                            setSelectedVersionId(null);
                                            setActiveTab('content');
                                            setSidebarOpen(false);
                                        }}
                                        style={{
                                            padding: '5px 8px', borderRadius: 4, cursor: 'pointer',
                                            fontSize: 13, fontWeight: d.id === selectedDocId ? 600 : 400,
                                            background: d.id === selectedDocId ? 'var(--selected-bg)' : 'transparent',
                                            display: 'flex', alignItems: 'flex-start', gap: 4,
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>
                                                {d.versions.length} version{d.versions.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        {docHovered === d.id && (
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDeleteDoc(d.id); }}
                                                title="Delete CV"
                                                aria-label="Delete CV"
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#dc2626', fontSize: 14, lineHeight: 1, padding: '2px 2px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <hr className="divider" style={{ margin: '4px 0' }} />

                            {selectedDoc && (
                                <div style={{ padding: '6px 0' }}>
                                    <div className="label" style={{ padding: '0 12px 6px' }}>Branches</div>
                                    <CVTree
                                        versions={selectedDoc.versions}
                                        selectedVersionId={selectedVersionId}
                                        onSelect={selectVersion}
                                        onDeleteVersion={handleDeleteVersion}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* main panel */}
                <div className="main-panel">
                    {!selectedVersion && !loading && (
                        <div style={{ padding: '16px 20px', overflow: 'auto' }}>
                            {selectedDoc ? (
                                <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff', padding: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div className="label" style={{ marginBottom: 3 }}>Dashboard overview</div>
                                            <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {selectedDoc.title}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{selectedDoc.versions.length} version{selectedDoc.versions.length !== 1 ? 's' : ''}</span>
                                    </div>

                                    <div style={{ color: 'var(--text-faint)', fontSize: 13, marginBottom: 10 }}>
                                        Select a branch to view details.
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 10 }}>
                                        <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: 'var(--surface)' }}>
                                            <div className="label" style={{ marginBottom: 3 }}>Submissions</div>
                                            <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedDocSubmissions.length}</div>
                                        </div>
                                        <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: 'var(--surface)' }}>
                                            <div className="label" style={{ marginBottom: 3 }}>Submitted</div>
                                            <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedDocSubmittedCount}</div>
                                        </div>
                                        <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: 'var(--surface)' }}>
                                            <div className="label" style={{ marginBottom: 3 }}>Passed screening</div>
                                            <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedDocPassedScreeningCount}</div>
                                        </div>
                                        <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: 'var(--surface)' }}>
                                            <div className="label" style={{ marginBottom: 3 }}>Success rate</div>
                                            <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedDocSuccessRate}%</div>
                                        </div>
                                    </div>

                                    <div style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', maxHeight: 320, overflow: 'auto' }}>
                                        <div className="label" style={{ padding: '8px 10px 4px' }}>Full branch tree</div>
                                        <CVTree
                                            versions={selectedDoc.versions}
                                            selectedVersionId={selectedVersionId}
                                            onSelect={selectVersion}
                                        />
                                    </div>

                                    {insights?.has_data && (
                                        <div style={{ marginTop: 10 }}>
                                            <div className="label" style={{ marginBottom: 8 }}>NLP insights</div>
                                            <InsightsPanel data={insights} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ paddingTop: 60, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                                    Select a resume to view details.
                                </div>
                            )}
                        </div>
                    )}

                    {selectedVersion && (
                        <>
                            {/* version header */}
                            <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedVersion.version_label || selectedVersion.branch_name}
                                        </h2>
                                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            {selectedVersion.parent_version_id ? (
                                                <span>
                                                    branched from{' '}
                                                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                                                        {selectedDoc?.versions.find(v => v.id === selectedVersion.parent_version_id)?.branch_name ?? '…'}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="badge badge-draft" style={{ fontFamily: 'var(--font-mono)' }}>root</span>
                                            )}
                                            <span>{fmt(selectedVersion.created_at)}</span>
                                            {selectedVersion.patches.length > 0 && (
                                                <span>{selectedVersion.patches.length} patch{selectedVersion.patches.length !== 1 ? 'es' : ''}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* action buttons */}
                                    <div className="action-buttons">
                                        {!IS_DEMO && <button className="btn btn-ghost" onClick={() => setModal('branch')}>Branch</button>}
                                        {!IS_DEMO && <button className="btn btn-ghost" onClick={() => { setModal('submission'); }}>Submit</button>}
                                        {!IS_DEMO && <button className="btn btn-ghost" onClick={() => setModal('publish')}>Publish</button>}
                                        {IS_DEMO && (
                                            <a href="/demo-cv.docx" download="alex-rivera-cv.docx" className="btn btn-ghost">
                                                ↓ DOCX
                                            </a>
                                        )}
                                        {!IS_DEMO && selectedVersion.artifact_docx_key && selectedDoc && (
                                            <a href={downloadVersionUrl(selectedDoc.id, selectedVersion.id)} download className="btn btn-ghost">
                                                ↓ DOCX
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {sortedPublishedAssets.length > 0 && (
                                    <div style={{
                                        padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                                        borderRadius: 5, marginBottom: 12, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10,
                                    }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ color: '#166534', fontWeight: 500 }}>Published variants ({sortedPublishedAssets.length})</span>
                                            {recentlyPublishedSlug && (
                                                <span style={{ fontSize: 11, color: '#14532d', background: '#dcfce7', padding: '1px 8px', borderRadius: 9999 }}>
                                                    Latest: {recentlyPublishedSlug}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {sortedPublishedAssets.map(asset => {
                                                const stats = publishedAnalytics[asset.slug];
                                                return (
                                                    <div key={asset.id} style={{ border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <span style={{ fontFamily: 'var(--font-mono)', color: '#166534', fontSize: 12 }}>{asset.slug}</span>
                                                            <span style={{ fontSize: 11, color: '#166534' }}>{fmt(asset.created_at)}</span>
                                                            {recentlyPublishedSlug === asset.slug && (
                                                                <span style={{ fontSize: 10, color: '#14532d', background: '#dcfce7', padding: '1px 6px', borderRadius: 9999 }}>New</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                                                            <a href={resolveAssetUrl(asset)} target="_blank" rel="noreferrer" style={{ color: '#166534', fontSize: 12, textDecoration: 'underline' }}>
                                                                Share link
                                                            </a>
                                                            <span style={{ color: '#bbf7d0' }}>|</span>
                                                            <a href={getPublicPdfUrl(asset.slug)} target="_blank" rel="noreferrer" style={{ color: '#166534', fontSize: 12, textDecoration: 'underline' }}>
                                                                View PDF
                                                            </a>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                                                            <span style={{ fontSize: 11, color: '#166534' }}>
                                                                {stats
                                                                    ? (
                                                                        <>
                                                                            {stats.view_count} view{stats.view_count !== 1 ? 's' : ''}
                                                                            {stats.last_viewed_at && (
                                                                                <> · last {fmt(stats.last_viewed_at)}</>
                                                                            )}
                                                                        </>
                                                                    )
                                                                    : 'No stats yet'}
                                                            </span>
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ fontSize: 11, padding: '2px 8px' }}
                                                                onClick={() => loadPublishedAnalytics(asset.slug)}
                                                            >
                                                                {stats ? 'Refresh stats' : 'Fetch stats'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* staged edits bar */}
                                {pendingCount > 0 && (
                                    <div style={{
                                        padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a',
                                        borderRadius: 5, marginBottom: 12, fontSize: 13, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                                    }}>
                                        <span style={{ color: '#92400e', flex: 1 }}>
                                            {pendingCount} staged edit{pendingCount !== 1 ? 's' : ''}
                                        </span>
                                        <button
                                            className="btn btn-primary"
                                            style={{ fontSize: 12, padding: '3px 10px', background: '#92400e', borderColor: '#92400e' }}
                                            onClick={applyStagedEdits}
                                            disabled={applyLoading}
                                        >
                                            {applyLoading ? 'Applying…' : 'Apply to branch'}
                                        </button>
                                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '3px 8px' }} onClick={() => setModal('branch')}>
                                            Save as new branch
                                        </button>
                                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '3px 8px' }} onClick={discardEdits}>
                                            Discard
                                        </button>
                                        {applyError && (
                                            <span style={{ color: '#b91c1c', fontSize: 12, flexBasis: '100%' }}>
                                                {applyError}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* tabs */}
                                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
                                    {(['content', 'patches', 'submissions', 'insights'] as Tab[]).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setActiveTab(t)}
                                            style={{
                                                padding: '6px 14px', fontSize: 13, background: 'none', border: 'none',
                                                cursor: 'pointer', color: activeTab === t ? 'var(--text)' : 'var(--text-muted)',
                                                borderBottom: activeTab === t ? '2px solid var(--text)' : '2px solid transparent',
                                                fontWeight: activeTab === t ? 500 : 400,
                                                marginBottom: -1, transition: 'color 0.1s', whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {t === 'patches' ? `Patches (${selectedVersion.patches.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* tab content */}
                            <div style={{ padding: '16px 20px', flex: 1, overflow: 'auto' }}>
                                {activeTab === 'content' && (
                                    <ContentTab
                                        blocks={selectedVersion.structured_blocks ?? []}
                                        pendingEdits={pendingEdits}
                                        onEdit={stageEdit}
                                    />
                                )}
                                {activeTab === 'patches' && (
                                    <DiffViewer patches={selectedVersion.patches} />
                                )}
                                {activeTab === 'submissions' && (
                                    <SubmissionsTab
                                        submissions={IS_DEMO
                                            ? DEMO_SUBMISSIONS.filter(s => {
                                                const doc = DEMO_DOCUMENTS.find(d => d.id === selectedDocId);
                                                return doc?.versions.some(v => v.id === s.version_id);
                                            })
                                            : submissions}
                                        loading={subsLoading}
                                        onNewSubmission={() => !IS_DEMO && setModal('submission')}
                                        onRefresh={() => !IS_DEMO && refreshSubs()}
                                        onStatusChange={handleSubmissionStatusChange}
                                    />
                                )}
                                {activeTab === 'insights' && (
                                    <InsightsPanel data={insights} />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* modals */}
            {modal === 'upload' && (
                <UploadModal onClose={() => setModal(null)} onDone={onUploadDone} />
            )}
            {modal === 'branch' && selectedVersion && (
                <BranchModal
                    version={selectedVersion}
                    initialPatches={stagedPatches}
                    onClose={() => setModal(null)}
                    onDone={onBranchDone}
                />
            )}
            {modal === 'submission' && selectedVersion && (
                <SubmissionModal version={selectedVersion} onClose={() => setModal(null)} onDone={onSubmissionDone} />
            )}
            {modal === 'publish' && selectedVersion && (
                <PublishModal
                    version={selectedVersion}
                    onClose={() => setModal(null)}
                    onDone={asset => {
                        setModal(null);
                        setRecentlyPublishedSlug(asset.slug);
                        setPublishedAnalytics({});
                        refreshDocs();
                    }}
                />
            )}
        </div>
    );
}
