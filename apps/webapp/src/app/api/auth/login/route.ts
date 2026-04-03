import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';
const LOGIN_USER = process.env.LOGIN_USER ?? 'admin';
const LOGIN_PASS = process.env.LOGIN_PASS ?? 'admin';

function sign(value: string) {
    return createHmac('sha256', SECRET).update(value).digest('hex');
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body as Record<string, string>;
    if (!username || !password || username !== LOGIN_USER || password !== LOGIN_PASS) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const payload = `${username}:${Date.now()}`;
    const token = `${payload}.${sign(payload)}`;
    const res = NextResponse.json({ ok: true });
    res.cookies.set('session', token, {
        httpOnly: true, sameSite: 'lax', path: '/',
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
    });
    return res;
}
