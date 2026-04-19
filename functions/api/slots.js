export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { trade } = await request.json();

    if (!trade || !['plumbing', 'electrical'].includes(trade)) {
      return new Response(JSON.stringify({ error: 'Invalid trade' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://us-central1-pettrdashboards.cloudfunctions.net/aroFloAgent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'get_available_slots',
        arguments: { trade }
      })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch slots from AroFlo' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
