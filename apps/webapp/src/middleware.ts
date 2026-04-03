import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';

function verifySession(token: string): boolean {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    return sig === expected;
}

export function middleware(req: NextRequest) {
    if (!req.nextUrl.pathname.startsWith('/dashboard')) return NextResponse.next();
    const session = req.cookies.get('session')?.value;
    const oidc = req.cookies.get('oidc_token')?.value;
    if ((session && verifySession(session)) || oidc) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/dashboard/:path*'] };
