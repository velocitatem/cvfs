import { NextRequest, NextResponse } from 'next/server';

function authentikBase(url?: string | null) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return parsed.origin.replace(/\/$/, '');
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`);

    const issuerRaw = process.env.AUTHENTIK_ISSUER;
    const clientId = process.env.AUTHENTIK_CLIENT_ID;
    const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET;
    const publicBase = process.env.NEXT_PUBLIC_BASE_URL ?? origin;
    const redirectUri = `${publicBase}/api/auth/callback`;

    const authentikHost = authentikBase(issuerRaw);

    if (!authentikHost || !clientId || !clientSecret) {
        return NextResponse.redirect(`${publicBase}/login?error=oidc_not_configured`);
    }

    const tokenRes = await fetch(`${authentikHost}/application/o/token/`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code', code,
            redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret,
        }),
    }).catch(() => null);

    if (!tokenRes?.ok) return NextResponse.redirect(`${origin}/login?error=token_exchange`);

    const tokens = await tokenRes.json();
    const res = NextResponse.redirect(`${publicBase}/dashboard`);
    res.cookies.set('oidc_token', tokens.access_token, {
        httpOnly: true, sameSite: 'lax', path: '/',
        maxAge: tokens.expires_in ?? 3600,
        secure: process.env.NODE_ENV === 'production',
    });
    // non-httpOnly copy for client-side API bearer usage
    res.cookies.set('oidc_token_pub', tokens.access_token, {
        httpOnly: false, sameSite: 'lax', path: '/',
        maxAge: tokens.expires_in ?? 3600,
        secure: process.env.NODE_ENV === 'production',
    });
    return res;
}
