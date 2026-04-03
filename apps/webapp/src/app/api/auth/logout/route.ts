import { NextResponse } from 'next/server';

export async function POST() {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete('session');
    res.cookies.delete('oidc_token');
    return res;
}
