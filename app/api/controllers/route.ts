import { NextResponse } from 'next/server';
import { cachedUpstream } from '@/lib/server-cache';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const result = await cachedUpstream<unknown[]>('controllers', 'https://24data.ptfs.app/controllers', 6);
    return NextResponse.json({ controllers: result.data ?? [], source: result.configured ? 'live' : 'offline' });
  } catch { return NextResponse.json({ controllers: [], source: 'offline' }, { status: 502 }); }
}
