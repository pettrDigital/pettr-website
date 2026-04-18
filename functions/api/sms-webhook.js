import * as admin from 'firebase-admin';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const message = formData.get('message');
    const phone = formData.get('from');

    if (!message || !phone) {
      return new Response(JSON.stringify({ error: 'Missing message or phone' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`SMS received from ${phone}: ${message}`);

    // Initialize Firebase
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    const db = admin.firestore();
    const conversationRef = db.collection('conversations').doc(phone);

    // Fetch conversation history
    const snapshot = await conversationRef.get();
    const conversationData = snapshot.data() || { messages: [], name: 'Customer' };
    const messages = conversationData.messages || [];

    // Add customer message to history
    messages.push({
      role: 'customer',
      text: message,
      timestamp: new Date().toISOString(),
    });

    // Call Claude API to generate response
    const claudeResponse = await callClaude(env, {
      name: conversationData.name,
      problem: conversationData.problem || 'Not specified',
      messages: messages.map(m => ({ role: m.role, content: m.text })),
    });

    // Add Claude response to history
    messages.push({
      role: 'assistant',
      text: claudeResponse,
      timestamp: new Date().toISOString(),
    });

    // Store updated conversation in Firestore
    await conversationRef.update({
      messages,
      lastUpdated: new Date().toISOString(),
    });

    // Send response via Kudosity SMS
    await sendSMS(env, {
      phone,
      message: claudeResponse,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function callClaude(env, { name, problem, messages }) {
  const apiKey = env.CLAUDE_API_KEY;

  const systemPrompt = `You are a helpful booking assistant for Plumber & Electrician to the Rescue.
The customer ${name} reported this issue: ${problem}

You are helping them book a plumbing or electrical service. Be friendly, professional, and brief.
Help confirm details and schedule the appointment.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const result = await response.json();
  return result.content[0].text;
}

async function sendSMS(env, { phone, message }) {
  const apiKey = env.TRANSMITSMS_API_KEY;
  const apiSecret = env.TRANSMITSMS_API_SECRET;
  const credentials = btoa(`${apiKey}:${apiSecret}`);

  const formData = new URLSearchParams();
  formData.append('message', message);
  formData.append('list_id', '10962457');
  formData.append('countrycode', 'au');

  const response = await fetch('https://api.transmitsms.com/send-sms.json', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/plain',
    },
    body: formData.toString(),
  });

  const responseText = await response.text();
  console.log('SMS response:', responseText);

  if (!response.ok) {
    throw new Error(`SMS error: ${response.status} ${responseText}`);
  }

  return responseText;
}
