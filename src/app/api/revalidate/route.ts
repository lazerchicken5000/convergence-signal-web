import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint.
 * Call after trenddistill pipeline finishes to refresh dashboard data.
 *
 * Usage: curl -X POST https://<host>/api/revalidate?secret=<REVALIDATION_SECRET>
 *
 * Or from a cron: POST /api/revalidate with the secret.
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  // Revalidate all pages
  revalidatePath('/', 'layout');
  revalidatePath('/pattern/[id]', 'page');
  revalidatePath('/leader/[id]', 'page');

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
  });
}
