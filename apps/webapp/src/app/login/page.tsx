'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function authentikBase(url?: string | null) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return parsed.origin.replace(/\/$/, '');
    } catch {
        return null;
    }
}

function authentikUrl() {
    const baseHost = authentikBase(process.env.NEXT_PUBLIC_AUTHENTIK_ISSUER);
    const clientId = process.env.NEXT_PUBLIC_AUTHENTIK_CLIENT_ID;
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
    if (!baseHost || !clientId) return null;
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: `${base}/api/auth/callback`,
        scope: 'openid email profile',
    });
    return `${baseHost}/application/o/authorize/?${params}`;
}

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const oidcUrl = typeof window !== 'undefined' ? authentikUrl() : null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        setLoading(true); setError('');
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
            router.push('/dashboard');
        } else {
            const j = await res.json().catch(() => ({}));
            setError(j.error ?? 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--bg)',
        }}>
            <div style={{ width: '100%', maxWidth: 360, padding: '0 20px' }}>
                {/* brand */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 6 }}>
                        cvfs
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Sign in to your account
                    </div>
                </div>

                {/* form card */}
                <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '24px 24px 20px',
                }}>
                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--text-muted)' }}>
                                Username
                            </label>
                            <input
                                type="text" autoComplete="username" autoFocus
                                value={username} onChange={e => setUsername(e.target.value)}
                                placeholder="admin"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--text-muted)' }}>
                                Password
                            </label>
                            <input
                                type="password" autoComplete="current-password"
                                value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div style={{ fontSize: 12, color: '#dc2626', padding: '6px 10px', background: '#fef2f2', borderRadius: 4 }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                            disabled={loading || !username || !password}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    {oidcUrl && (
                        <>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                margin: '16px 0', color: 'var(--text-faint)', fontSize: 12,
                            }}>
                                <hr className="divider" style={{ flex: 1 }} />
                                <span>or</span>
                                <hr className="divider" style={{ flex: 1 }} />
                            </div>
                            <a href={oidcUrl} style={{ textDecoration: 'none', display: 'block' }}>
                                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                        <path d="M2 17l10 5 10-5" />
                                        <path d="M2 12l10 5 10-5" />
                                    </svg>
                                    Sign in with Authentik
                                </button>
                            </a>
                        </>
                    )}
                </div>

                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 20 }}>
                    cvfs — CV File System
                </p>
            </div>
        </div>
    );
}
