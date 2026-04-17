export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        postcode: formData.get('postcode'),
        message: formData.get('message'),
      };

      // Validate required fields
      if (!data.name || !data.phone || !data.address || !data.postcode || !data.message) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Send email via SMTP2Go
      const emailHtml = `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Address:</strong> ${escapeHtml(data.address)}</p>
        <p><strong>Postcode:</strong> ${escapeHtml(data.postcode)}</p>
        <p><strong>Message:</strong> ${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
      `;

      await sendEmail(env, {
        to: env.QUOTE_EMAIL,
        subject: `New Quote Request from ${data.name}`,
        html: emailHtml,
      });

      // Trigger Retell outbound call
      await triggerRetellCall(env, {
        phone: data.phone,
        customerName: data.name,
      });

      return new Response(JSON.stringify({ success: true, message: 'Quote request submitted. We will call you shortly!' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

async function sendEmail(env, { to, subject, html }) {
  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: env.SMTP2GO_API_KEY,
      to: [{ email: to }],
      from: 'noreply@pettr-website.com',
      subject,
      html_body: html,
    }),
  });

  if (!response.ok) {
    throw new Error(`SMTP2Go error: ${response.statusText}`);
  }

  return response.json();
}

async function triggerRetellCall(env, { phone, customerName }) {
  const response = await fetch('https://api.retellai.com/v2/create-web-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: env.RETELL_AGENT_ID,
      phone_number: phone,
      metadata: {
        customer_name: customerName,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Retell error: ${response.statusText}`);
  }

  return response.json();
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
