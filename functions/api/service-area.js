// Lightweight pre-submit check: is a postcode inside the Sydney service area?
// GET /api/service-area?postcode=2044  ->  { postcode: "2044", serviced: true }
// Reuses the shared postcode list (one source of truth with /api/quote). No side
// effects — safe to call on every keystroke/blur.
import { isInServiceArea } from '../lib/serviceArea.js';
import { applyCors, preflightResponse } from '../lib/cors.js';

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return preflightResponse(request, 'GET, OPTIONS');

  const url = new URL(request.url);
  const postcode = (url.searchParams.get('postcode') || '').trim();
  const serviced = isInServiceArea(postcode);

  return applyCors(request, new Response(
    JSON.stringify({ postcode, serviced }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } },
  ));
}
