import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const backend = process.env.API_BASE_URL ?? "http://localhost:9812";
  
  try {
    const res = await fetch(`${backend}/api/v1/public/${slug}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return new NextResponse('CV not found', { status: 404 });
    }
    
    const data = await res.json();
    if (!data.asset || !data.asset.artifact_key) {
      return new NextResponse('CV not found', { status: 404 });
    }
    
    // Construct MinIO public URL
    const storageHost = process.env.MINIO_ENDPOINT || (process.env.NODE_ENV === 'production' 
      ? 'https://storage.cv.alves.world' 
      : 'http://localhost:9900');
      
    const bucket = process.env.MINIO_BUCKET || 'resume-branches';
    const downloadUrl = `${storageHost}/${bucket}/${data.asset.artifact_key}`;
    
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('Error fetching public CV:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
