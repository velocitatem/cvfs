const API = "";

export type StructuredBlock = {
    path: string;
    block_type: string;
    text: string;
    keywords: string[];
};

export type Patch = {
    id: string;
    target_path: string;
    operation: string;
    old_value?: string | null;
    new_value?: string | null;
    metadata_json?: Record<string, unknown> | null;
    created_at: string;
};

export type Version = {
    id: string;
    branch_name: string;
    version_label?: string | null;
    parent_version_id?: string | null;
    structured_blocks?: StructuredBlock[] | null;
    artifact_docx_key?: string | null;
    patches: Patch[];
    created_at: string;
    updated_at: string;
};

export type Document = {
    id: string;
    title: string;
    description?: string | null;
    owner_id: string;
    root_version_id?: string | null;
    versions: Version[];
    created_at: string;
    updated_at: string;
};

export type Suggestion = {
    id: string;
    target_path: string;
    operation: string;
    proposed_text?: string | null;
    rationale?: string | null;
    accepted?: boolean | null;
    metadata_json?: { keywords?: string[]; confidence?: number } | null;
};

export type Submission = {
    id: string;
    version_id: string;
    company_name: string;
    role_title: string;
    job_url?: string | null;
    job_description?: string | null;
    status: string;
    suggestions: Suggestion[];
    created_at: string;
};

export type PublicAsset = {
    id: string;
    slug: string;
    artifact_key: string;
    is_public: boolean;
    url?: string | null;
    version_id?: string | null;
    submission_id?: string | null;
    created_at: string;
};

export type PublicAssetAnalytics = {
    slug: string;
    view_count: number;
    last_viewed_at?: string | null;
};

// reads OIDC bearer token from client-readable cookie (set by /api/auth/callback)
function getAuthHeader(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    const token = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('oidc_token_pub='))?.split('=')[1];
    return token ? { authorization: `Bearer ${decodeURIComponent(token)}` } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        ...init,
        headers: { accept: 'application/json', ...getAuthHeader(), ...init?.headers },
    });
    if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') {
            document.cookie = 'oidc_token_pub=; max-age=0; path=/';
            document.cookie = 'oidc_token=; max-age=0; path=/';
            window.location.href = '/login';
        }
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(detail || `HTTP ${res.status}`);
    }
    return res.json();
}

export const fetchDocuments = (): Promise<Document[]> =>
    req<{ items: Document[] }>('/api/v1/documents', { cache: 'no-store' }).then(r => r.items);

export const fetchDocument = (id: string): Promise<Document> =>
    req<Document>(`/api/v1/documents/${id}`, { cache: 'no-store' });

export async function uploadDocument(title: string, description: string | null, file: File): Promise<Document> {
    const form = new FormData();
    form.append('title', title);
    if (description) form.append('description', description);
    form.append('file', file);
    return req<Document>('/api/v1/documents', { method: 'POST', body: form });
}

export const downloadVersionUrl = (documentId: string, versionId: string): string =>
    `${API}/api/v1/documents/${documentId}/versions/${versionId}/download`;

export async function createBranch(
    parentVersionId: string,
    branchName: string,
    versionLabel?: string | null,
    patches: Record<string, unknown>[] = [],
): Promise<Version> {
    return req<Version>('/api/v1/versions/branches', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ parent_version_id: parentVersionId, branch_name: branchName, version_label: versionLabel ?? null, patches }),
    });
}

export async function createSubmission(
    versionId: string,
    companyName: string,
    roleTitle: string,
    jobUrl?: string | null,
    jobDescription?: string | null,
): Promise<Submission> {
    return req<Submission>('/api/v1/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version_id: versionId, company_name: companyName, role_title: roleTitle, job_url: jobUrl ?? null, job_description: jobDescription ?? null }),
    });
}

export const fetchSubmissions = (versionId: string): Promise<Submission[]> =>
    req<Submission[]>(`/api/v1/submissions?version_id=${versionId}`);

export const fetchSubmission = (id: string): Promise<Submission> =>
    req<Submission>(`/api/v1/submissions/${id}`);

export async function requestAiSuggestions(
    submissionId: string,
    jobDescription: string,
    focusKeywords: string[] = [],
): Promise<Suggestion[]> {
    return req<Suggestion[]>(`/api/v1/submissions/${submissionId}/ai`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription, focus_keywords: focusKeywords }),
    });
}

export async function updateSuggestion(
    submissionId: string,
    suggestionId: string,
    accepted: boolean,
): Promise<Suggestion> {
    return req<Suggestion>(`/api/v1/submissions/${submissionId}/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accepted }),
    });
}

export async function publishVersion(
    versionId?: string | null,
    submissionId?: string | null,
    slug?: string | null,
): Promise<PublicAsset> {
    return req<PublicAsset>('/api/v1/public/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version_id: versionId ?? null, submission_id: submissionId ?? null, slug: slug ?? null }),
    });
}

export const getPublicPdfUrl = (slug: string): string =>
    `${API}/api/v1/public/${encodeURIComponent(slug)}/pdf`;

export const fetchPublicAssetAnalytics = (slug: string): Promise<PublicAssetAnalytics> =>
    req<PublicAssetAnalytics>(`/api/v1/public/${encodeURIComponent(slug)}/analytics`);

export async function deleteDocument(documentId: string): Promise<void> {
    const res = await fetch(`${API}/api/v1/documents/${documentId}`, {
        method: 'DELETE',
        headers: { accept: 'application/json', ...getAuthHeader() },
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(detail || `HTTP ${res.status}`);
    }
}

export async function deleteVersion(versionId: string): Promise<void> {
    const res = await fetch(`${API}/api/v1/versions/${versionId}`, {
        method: 'DELETE',
        headers: { accept: 'application/json', ...getAuthHeader() },
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(detail || `HTTP ${res.status}`);
    }
}
