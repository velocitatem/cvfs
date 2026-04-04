import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const backend = process.env.API_BASE_URL ?? 'http://localhost:9812';

  try {
    const res = await fetch(`${backend}/api/v1/public/${encodeURIComponent(slug)}/pdf`, {
      cache: 'no-store',
    });

    if (res.status === 404) return new NextResponse('CV not found', { status: 404 });
    if (!res.ok) return new NextResponse('Failed to fetch CV', { status: res.status });

    const pdf = await res.arrayBuffer();
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${slug}.pdf"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error fetching public CV:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
