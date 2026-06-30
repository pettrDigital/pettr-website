import { corsHeaders, preflightResponse } from '../lib/cors.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return preflightResponse(request, 'GET, OPTIONS');

  return new Response(JSON.stringify({
    googleMapsApiKey: env.GOOGLE_MAPS_API_KEY
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
  });
}
