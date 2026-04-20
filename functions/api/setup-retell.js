// Setup Retell outbound agent functions
// Call this endpoint once after deployment to configure function definitions

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('POST required', { status: 405 });
    }

    try {
      const apiKey = env.RETELL_API_KEY;
      const outboundAgentId = 'agent_ae39eceb83f12b6a4fcdfd4c89';

      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'RETELL_API_KEY not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const functions = [
        {
          name: 'get_available_slots',
          description: 'Get available appointment slots for a given trade (plumbing or electrical)',
          parameters: {
            type: 'object',
            properties: {
              trade: {
                type: 'string',
                description: 'Type of service: plumbing or electrical',
                enum: ['plumbing', 'electrical'],
              },
            },
            required: ['trade'],
          },
        },
        {
          name: 'create_afterhours_job',
          description: 'Create an emergency after-hours job',
          parameters: {
            type: 'object',
            properties: {
              caller_phone: { type: 'string', description: 'Customer phone number' },
              first_name: { type: 'string', description: 'Customer first name' },
              last_name: { type: 'string', description: 'Customer last name' },
              trade: { type: 'string', description: 'plumbing or electrical', enum: ['plumbing', 'electrical'] },
              description: { type: 'string', description: 'Job description/issue' },
              street_address: { type: 'string', description: 'Street address' },
              suburb: { type: 'string', description: 'Suburb/city' },
              postcode: { type: 'string', description: 'Postcode' },
              client_id: { type: 'string', description: 'AroFlo client ID (optional)', nullable: true },
            },
            required: ['caller_phone', 'first_name', 'last_name', 'trade', 'description', 'street_address', 'suburb', 'postcode'],
          },
        },
        {
          name: 'create_standard_job',
          description: 'Create a standard business hours job with optional appointment slot',
          parameters: {
            type: 'object',
            properties: {
              caller_phone: { type: 'string', description: 'Customer phone number' },
              first_name: { type: 'string', description: 'Customer first name' },
              last_name: { type: 'string', description: 'Customer last name' },
              trade: { type: 'string', description: 'plumbing or electrical', enum: ['plumbing', 'electrical'] },
              description: { type: 'string', description: 'Job description/issue' },
              street_address: { type: 'string', description: 'Street address' },
              suburb: { type: 'string', description: 'Suburb/city' },
              postcode: { type: 'string', description: 'Postcode' },
              client_id: { type: 'string', description: 'AroFlo client ID (optional)', nullable: true },
              scheduled_date: { type: 'string', description: 'Scheduled date YYYY-MM-DD (optional)', nullable: true },
              scheduled_time: { type: 'string', description: 'Scheduled time HH:MM (optional)', nullable: true },
            },
            required: ['caller_phone', 'first_name', 'last_name', 'trade', 'description', 'street_address', 'suburb', 'postcode'],
          },
        },
      ];

      // Update agent with function definitions
      const updateResponse = await fetch(`https://api.retellai.com/v2/agents/${outboundAgentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functions: functions,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        console.error('Retell API error:', updateResponse.status, error);
        return new Response(JSON.stringify({ error: 'Failed to update Retell agent', details: error }), {
          status: updateResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await updateResponse.json();
      return new Response(JSON.stringify({ success: true, message: 'Retell functions configured', agent: result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Setup error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
