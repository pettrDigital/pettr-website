export async function onRequest(context) {
  const { env } = context;

  return new Response(JSON.stringify({
    googleMapsApiKey: env.GOOGLE_MAPS_API_KEY
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
