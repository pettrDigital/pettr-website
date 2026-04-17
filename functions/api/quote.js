export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      postcode: formData.get('postcode'),
      message: formData.get('message'),
    };

    if (!data.name || !data.email || !data.phone || !data.address || !data.postcode || !data.message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailHtml = `
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
      <p><strong>Address:</strong> ${escapeHtml(data.address)}</p>
      <p><strong>Postcode:</strong> ${escapeHtml(data.postcode)}</p>
      <p><strong>Message:</strong> ${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
    `;

    await sendEmail(env, {
      from: 'webform@plumberandelectrician.com.au',
      to: env.QUOTE_EMAIL,
      subject: `New Quote Request from ${data.name}`,
      html: emailHtml,
    });

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
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function sendEmail(env, { from, to, subject, html }) {
  const apiKey = env.SMTP2GO_API_KEY;

  console.log('=== EMAIL DEBUG ===');
  console.log('To address:', to);
  console.log('From address:', from);
  console.log('Subject:', subject);

  const requestBody = {
    api_key: apiKey,
    to: [to],
    sender: from,
    subject,
    html_body: html,
  };

  console.log('Request body:', JSON.stringify(requestBody));

  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log('SMTP2Go response:', responseText);

  if (!response.ok) {
    throw new Error(`SMTP2Go error: ${response.status} ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function triggerRetellCall(env, { phone, customerName }) {
  console.log('=== RETELL CALL ===');
  console.log('Phone:', phone);
  console.log('Customer:', customerName);
  console.log('Agent ID:', env.RETELL_AGENT_ID ? 'present' : 'MISSING');

  const requestBody = {
    agent_id: env.RETELL_AGENT_ID,
    phone_number: phone,
    metadata: {
      customer_name: customerName,
    },
  };

  console.log('Request:', JSON.stringify(requestBody));

  const response = await fetch('https://api.retellai.com/v2/create-web-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log('Retell response:', responseText);

  if (!response.ok) {
    throw new Error(`Retell error: ${response.status} ${responseText}`);
  }

  return JSON.parse(responseText);
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
