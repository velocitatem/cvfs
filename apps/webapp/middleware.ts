import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Set NEXT_PUBLIC_REQUIRE_AUTH=true in .env to enable Supabase auth gating
  if (process.env.NEXT_PUBLIC_REQUIRE_AUTH !== 'true') {
    return NextResponse.next({ request })
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}