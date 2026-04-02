'use client';

import { useEffect, useRef, useState } from 'react';
import CVTree from '@/components/cv/CVTree';
import DiffViewer from '@/components/cv/DiffViewer';
import Link from 'next/link';
import {
    createBranch, createSubmission, Document, downloadVersionUrl,
    fetchDocuments, publishVersion, uploadDocument, Version,
} from '@/libs/api';

// ─── tiny helpers ────────────────────────────────────────────────────────────

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="label" style={{ padding: '0 0 8px' }}>{title}</div>
            {children}
        </div>
    );
}

// ─── modals ───────────────────────────────────────────────────────────────────

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
        try { onDone(await uploadDocument(title.trim(), desc.trim() || null, file)); }
        catch (e: unknown) { setError(e instanceof Error ? e.message : 'Upload failed'); setLoading(false); }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Upload CV</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Title (e.g. My Resume)" value={title} onChange={e => setTitle(e.target.value)} />
                    <input placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
                    <div
                        onClick={() => ref.current?.click()}
                        style={{ border: '1px dashed var(--border-strong)', borderRadius: 5, padding: '18px 0', textAlign: 'center', cursor: 'pointer', fontSize: 13, color: file ? 'var(--text)' : 'var(--text-muted)' }}
                    >
                        {file ? file.name : 'Click to select .docx file'}
                    </div>
                    <input ref={ref} type="file" accept=".docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
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

function BranchModal({ version, onClose, onDone }: { version: Version; onClose: () => void; onDone: (v: Version) => void }) {
    const [name, setName] = useState('');
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!name.trim()) { setError('Branch name required.'); return; }
        setLoading(true); setError('');
        try { onDone(await createBranch(version.id, name.trim(), label.trim() || null)); }
        catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); setLoading(false); }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">New branch from <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{version.branch_name}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Branch name (e.g. ml-engineer)" value={name} onChange={e => setName(e.target.value)} />
                    <input placeholder="Label (optional)" value={label} onChange={e => setLabel(e.target.value)} />
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                            {loading ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SubmissionModal({ version, onClose, onDone }: { version: Version; onClose: () => void; onDone: () => void }) {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!company.trim() || !role.trim()) { setError('Company and role required.'); return; }
        setLoading(true); setError('');
        try { await createSubmission(version.id, company.trim(), role.trim(), url.trim() || null); onDone(); }
        catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); setLoading(false); }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">New submission from <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{version.branch_name}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
                    <input placeholder="Role title" value={role} onChange={e => setRole(e.target.value)} />
                    <input placeholder="Job URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
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

function PublishModal({ version, onClose, onDone }: { version: Version; onClose: () => void; onDone: (url: string) => void }) {
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        setLoading(true); setError('');
        try {
            const asset = await publishVersion(version.id, null, slug.trim() || null);
            onDone(asset.url ?? asset.slug);
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); setLoading(false); }
    };

    return (
        <div className="overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-title">Publish version</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Creates an immutable public artifact. The link stays stable even if you edit further.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Custom slug (optional)" value={slug} onChange={e => setSlug(e.target.value)} />
                    {error && <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
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

// ─── main dashboard ───────────────────────────────────────────────────────────

type Modal = 'upload' | 'branch' | 'submission' | 'publish' | null;

export default function Dashboard() {
    const [docs, setDocs] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState<Modal>(null);
    const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchDocuments()
            .then(d => { setDocs(d); if (d.length) { setSelectedDocId(d[0].id); setSelectedVersionId(d[0].root_version_id ?? null); } })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const selectedDoc = docs.find(d => d.id === selectedDocId) ?? null;
    const selectedVersion = selectedDoc?.versions.find(v => v.id === selectedVersionId) ?? null;

    const refreshDocs = async () => {
        try {
            const fresh = await fetchDocuments();
            setDocs(fresh);
            const doc = fresh.find(d => d.id === selectedDocId) ?? fresh[0] ?? null;
            if (doc) { setSelectedDocId(doc.id); }
        } catch { /* silent */ }
    };

    const onUploadDone = (doc: Document) => {
        setDocs(prev => [doc, ...prev.filter(d => d.id !== doc.id)]);
        setSelectedDocId(doc.id);
        setSelectedVersionId(doc.root_version_id ?? null);
        setModal(null);
    };

    const onBranchDone = (v: Version) => {
        refreshDocs().then(() => setSelectedVersionId(v.id));
        setModal(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
            {/* top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 44, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                    Resume Branches
                </Link>
                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setModal('upload')}>
                    + Upload CV
                </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* left panel */}
                <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                            {/* document selector */}
                            <div style={{ padding: '10px 12px 6px' }}>
                                <div className="label" style={{ marginBottom: 6 }}>Documents</div>
                                {docs.map(d => (
                                    <div
                                        key={d.id}
                                        onClick={() => { setSelectedDocId(d.id); setSelectedVersionId(d.root_version_id ?? null); }}
                                        style={{ padding: '5px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: d.id === selectedDocId ? 600 : 400, background: d.id === selectedDocId ? 'var(--selected-bg)' : 'transparent' }}
                                    >
                                        {d.title}
                                    </div>
                                ))}
                            </div>

                            <hr className="divider" style={{ margin: '6px 0' }} />

                            {/* version tree */}
                            {selectedDoc && (
                                <div style={{ padding: '6px 0' }}>
                                    <div className="label" style={{ padding: '0 12px 6px' }}>Versions</div>
                                    <CVTree
                                        versions={selectedDoc.versions}
                                        selectedVersionId={selectedVersionId}
                                        onSelect={setSelectedVersionId}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* main content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                    {!selectedVersion && !loading && (
                        <div style={{ paddingTop: 60, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                            Select a version to view details.
                        </div>
                    )}

                    {selectedVersion && (
                        <div style={{ maxWidth: 680 }}>
                            {/* version header */}
                            <div style={{ marginBottom: 20 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                                    {selectedVersion.version_label || selectedVersion.branch_name}
                                </h2>
                                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                    {selectedVersion.parent_version_id && (
                                        <span>
                                            branched from{' '}
                                            <span style={{ fontFamily: 'var(--font-mono)' }}>
                                                {selectedDoc?.versions.find(v => v.id === selectedVersion.parent_version_id)?.branch_name ?? '…'}
                                            </span>
                                        </span>
                                    )}
                                    {!selectedVersion.parent_version_id && <span style={{ fontFamily: 'var(--font-mono)' }}>root</span>}
                                    <span>{fmt(selectedVersion.created_at)}</span>
                                    {selectedVersion.patches.length > 0 && (
                                        <span>{selectedVersion.patches.length} patch{selectedVersion.patches.length !== 1 ? 'es' : ''}</span>
                                    )}
                                </div>
                            </div>

                            {/* action bar */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
                                <button className="btn btn-ghost" onClick={() => setModal('branch')}>New branch</button>
                                <button className="btn btn-ghost" onClick={() => setModal('submission')}>New submission</button>
                                <button className="btn btn-ghost" onClick={() => setModal('publish')}>Publish</button>
                                {selectedVersion.artifact_docx_key && selectedDoc && (
                                    <a
                                        href={downloadVersionUrl(selectedDoc.id, selectedVersion.id)}
                                        download
                                        className="btn btn-ghost"
                                    >
                                        ↓ DOCX
                                    </a>
                                )}
                            </div>

                            {publishedUrl && (
                                <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 5, marginBottom: 20, fontSize: 13 }}>
                                    Published:{' '}
                                    <a href={publishedUrl} target="_blank" rel="noreferrer" style={{ color: '#166534', wordBreak: 'break-all' }}>{publishedUrl}</a>
                                    <button onClick={() => setPublishedUrl(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontSize: 14 }}>×</button>
                                </div>
                            )}

                            <hr className="divider" style={{ marginBottom: 24 }} />

                            {/* structured blocks */}
                            {(selectedVersion.structured_blocks?.length ?? 0) > 0 && (
                                <Section title={`Content (${selectedVersion.structured_blocks!.length} blocks)`}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
                                        {selectedVersion.structured_blocks!.map((b, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', flexShrink: 0, width: 110, paddingTop: 1 }}>{b.path}</span>
                                                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {b.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* patches */}
                            <Section title={`Patches (${selectedVersion.patches.length} changes from parent)`}>
                                <DiffViewer patches={selectedVersion.patches} />
                            </Section>
                        </div>
                    )}
                </div>
            </div>

            {/* modals */}
            {modal === 'upload' && (
                <UploadModal onClose={() => setModal(null)} onDone={onUploadDone} />
            )}
            {modal === 'branch' && selectedVersion && (
                <BranchModal version={selectedVersion} onClose={() => setModal(null)} onDone={onBranchDone} />
            )}
            {modal === 'submission' && selectedVersion && (
                <SubmissionModal version={selectedVersion} onClose={() => setModal(null)} onDone={() => { setModal(null); }} />
            )}
            {modal === 'publish' && selectedVersion && (
                <PublishModal
                    version={selectedVersion}
                    onClose={() => setModal(null)}
                    onDone={url => { setPublishedUrl(url); setModal(null); }}
                />
            )}
        </div>
    );
}
