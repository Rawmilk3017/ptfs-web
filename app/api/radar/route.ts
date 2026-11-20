import { NextRequest, NextResponse } from 'next/server';
import { cachedUpstream } from '@/lib/server-cache';
import type { Aircraft } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const server = request.nextUrl.searchParams.get('server') === 'event' ? 'event' : 'main';
  const path = server === 'event' ? '/acft-data/event' : '/acft-data';
  try {
    const result = await cachedUpstream<Record<string, Omit<Aircraft, 'callsign'>>>(`aircraft:${server}`, `https://24data.ptfs.app${path}`, 3);
    if (!result.configured) return NextResponse.json({ aircraft: [], updatedAt: null, source: 'offline', message: 'Add Upstash Redis environment variables to enable live API data.' });
    const aircraft = Object.entries(result.data ?? {}).map(([callsign, data]) => ({ callsign, ...data }));
    return NextResponse.json({ aircraft, updatedAt: new Date().toISOString(), source: 'live', stale: Boolean(result.stale) });
  } catch (error) {
    return NextResponse.json({ aircraft: [], updatedAt: null, source: 'offline', message: error instanceof Error ? error.message : 'Unable to reach 24data.' }, { status: 502 });
  }
}
