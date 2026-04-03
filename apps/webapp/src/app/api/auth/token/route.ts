import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('oidc_token')?.value ?? null;
    return NextResponse.json({ token });
}
