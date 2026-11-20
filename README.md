# ATLAS RADAR

An independent community PTFS flight-tracking companion built with Next.js for deployment on Vercel.

## What's included

- Dark, responsive radar dashboard with aircraft selection, labels, filters and aircraft inspector.
- Main-server and event-server switch.
- Aircraft directory with search and emergency filtering.
- Server-side 24data REST integration for `/acft-data` and `/acft-data/event`.
- Shared Upstash Redis cache + lock so browser clients do not call 24data directly and concurrent Vercel instances share a cache.
- Controllers and ATIS API route stubs with six-second shared-cache intervals.
- Clearly labelled local demo data when live credentials are not configured.

## Deploy to Vercel

1. Create a GitHub repository and upload this folder.
2. Import that repository into Vercel.
3. Create a free Redis database at https://upstash.com/ and copy its REST URL and REST token.
4. In Vercel → Project → Settings → Environment Variables, add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Redeploy. The dashboard will switch from demo mode to live data when the 24data endpoint is reachable.

For local development, copy `.env.example` to `.env.local`, fill in the two Upstash values, then run `npm install` and `npm run dev`.

## Data handling / 24data integration notes

- The browser only calls this application's `/api/*` routes. It never calls `24data.ptfs.app` directly.
- The shared cache uses a three-second lock for each aircraft feed and six-second locks for controllers and ATIS, matching the polling guidance supplied with the project brief.
- Cached API responses expire after 20 seconds. Do not add persistent flight-history storage unless you anonymise identifying fields and remain within the API's 14-day retention rule.
- Keep API polling server-side and do not increase polling frequency beyond the documented limits.
- The 24data API is unstable and may change without notice. Handle failures as normal.
- Flight-plan events are not wired in this starter: the documented WebSocket is intended for a long-lived server process and Vercel serverless functions are not a suitable always-on WebSocket worker. Add a separate always-on worker only if you choose an appropriate host and comply with the API connection limit.

## Important map note

This first build plots aircraft using their raw PTFS world X/Y coordinates on a radar-style scope. It is not yet an accurately georeferenced island basemap. The 24RC project README documents its own SVG mapping convention (origin aligned to game 0,0 and 1 SVG pixel per 100 studs); this project does not copy 24RC source or assets. To add a true PTFS basemap, provide an original map asset or one you have permission to use, with its coordinate origin and scale.

## Project identity

ATLAS RADAR is an independent community project and is not affiliated with Roblox, ATC 24 management, or the 24RC maintainers. It is not intended to replace official ATC 24 services. The 24data terms supplied by the project owner govern any API use. This application is for non-commercial use only under the supplied 24data terms.

## ATLAS VOICE — talking ATIS

The ATIS page includes a browser-native speech player (`app/atis-voice.tsx`). It reads the current `/api/atis` response, lets visitors choose an airport and an installed English speech voice, adjusts speaking rate, and provides play/stop controls. Enable **Auto-announce updates** to speak when an airport's ATIS letter or content changes after the initial feed has loaded.

- Speech is generated locally with the browser Web Speech API; no audio service key or additional package is required.
- The visitor must press Play (or enable auto-announce with a user gesture) because browsers restrict unsolicited audio. Some browsers/OS combinations expose different voices.
- Voice availability and pronunciation vary by browser and operating system. The text normalizer expands common aviation abbreviations and phonetic letters, but it is a convenience reader, not certified aviation audio or operational ATIS.
- The feature does not change or submit ATIS. It only reads the content supplied by 24data.
