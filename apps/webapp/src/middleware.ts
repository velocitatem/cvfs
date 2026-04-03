import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';

async function verifySession(token: string): Promise<boolean> {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = token.slice(0, lastDot);
    const sigHex = token.slice(lastDot + 1);
    try {
        const key = await globalThis.crypto.subtle.importKey(
            'raw', new TextEncoder().encode(SECRET),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
        );
        const sigBytes = new Uint8Array((sigHex.match(/.{1,2}/g) ?? []).map(b => parseInt(b, 16)));
        return await globalThis.crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
    } catch { return false; }
}

export async function middleware(req: NextRequest) {
    if (!req.nextUrl.pathname.startsWith('/dashboard')) return NextResponse.next();
    const session = req.cookies.get('session')?.value;
    const oidc = req.cookies.get('oidc_token')?.value;
    if (oidc) return NextResponse.next();
    if (session && await verifySession(session)) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/dashboard/:path*'] };
