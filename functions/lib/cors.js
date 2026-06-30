// Cross-origin access for the public booking endpoints.
//
// Browsers loading one of the ALLOWED_DOMAINS below (apex OR any subdomain) are
// permitted to call these endpoints; every other browser origin is blocked by
// the browser. Same-origin requests don't carry an Origin header and aren't
// affected at all.
//
// IMPORTANT: this is NOT an access-control / auth mechanism. CORS is enforced by
// browsers only — a script/curl/server ignores it entirely and can still call
// these endpoints. Real abuse protection (rate limiting / token / Turnstile) is
// separate. We therefore never REJECT a request on Origin here; we only decide
// whether to grant the browser permission by echoing Access-Control-Allow-Origin.
const ALLOWED_DOMAINS = [
  'plumbertotherescue.com.au',
  'electriciantotherescue.com.au',
];

// The CORS headers to add to a response, given the incoming request. Returns {}
// when there's no Origin (same-origin) or the Origin isn't on the allowlist — in
// which case we add nothing and the browser does the blocking.
export function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const host = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  const allowed = ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  return allowed ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {};
}

// Preflight (OPTIONS) response. `methods` e.g. 'POST, OPTIONS' or 'GET, OPTIONS'.
export function preflightResponse(request, methods) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request),
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Stamp CORS headers onto an already-built Response (mutates and returns it).
export function applyCors(request, response) {
  for (const [k, v] of Object.entries(corsHeaders(request))) response.headers.set(k, v);
  return response;
}
