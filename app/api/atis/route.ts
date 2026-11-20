import { NextResponse } from 'next/server';
import { cachedUpstream } from '@/lib/server-cache';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const result = await cachedUpstream<unknown[]>('atis', 'https://24data.ptfs.app/atis', 6);
    return NextResponse.json({ atis: result.data ?? [], source: result.configured ? 'live' : 'offline' });
  } catch { return NextResponse.json({ atis: [], source: 'offline' }, { status: 502 }); }
}
