export async function onRequest(context) {
  const { request } = context;

  console.log('=== SLOTS API REQUEST ===');
  console.log('Method:', request.method);

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { trade } = await request.json();
    console.log('Trade:', trade);

    if (!trade || !['plumbing', 'electrical'].includes(trade)) {
      return new Response(JSON.stringify({ error: 'Invalid trade' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching slots from AroFlo for trade:', trade);
    const response = await fetch('https://us-central1-pettrdashboards.cloudfunctions.net/aroFloAgent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'get_available_slots',
        arguments: { trade }
      })
    });

    console.log('AroFlo response status:', response.status);
    const responseText = await response.text();
    console.log('AroFlo response body:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('AroFlo API error:', response.status, responseText);
      return new Response(JSON.stringify({ slots: [], error: 'Unable to fetch available slots' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(responseText);
    console.log('Slots found:', data.slots?.length || 0);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== SLOTS API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ slots: [], error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
