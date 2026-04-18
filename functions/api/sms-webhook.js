export async function onRequest(context) {
  const { request, env } = context;

  console.log('=== SMS WEBHOOK RECEIVED ===');
  console.log('Method:', request.method);

  if (request.method !== 'POST') {
    console.log('Not POST, rejecting');
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const json = await request.json();
    console.log('Webhook payload:', JSON.stringify(json));

    // Kudosity sends SMS_INBOUND events with mo.message and mo.sender
    let message, phone;

    if (json.event_type === 'SMS_INBOUND' && json.mo) {
      message = json.mo.message;
      phone = json.mo.sender;
    } else {
      message = json.message || json.mo?.message;
      phone = json.phone || json.sender || json.mo?.sender;
    }

    console.log('Parsed - Phone:', phone, 'Message:', message);

    if (!message || !phone) {
      console.log('Missing message or phone');
      return new Response(JSON.stringify({ error: 'Missing message or phone' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`SMS received from ${phone}: ${message}`);

    // Check Firebase configuration
    if (!env.FIREBASE_API_KEY || !env.FIREBASE_PROJECT_ID) {
      console.error('Firebase configuration incomplete');
      return new Response(JSON.stringify({ error: 'Firebase not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if this is part of an outbound booking flow
    console.log('Checking for active booking flow...');
    const bookingFlow = await getFirestoreDoc(env, 'booking_flows', phone);
    if (bookingFlow && bookingFlow.step) {
      console.log('Found active booking flow, step:', bookingFlow.step);
      return handleOutboundBookingFlow(env, phone, message, bookingFlow);
    }

    // Fetch conversation from Firestore using REST API
    console.log('Fetching conversation for phone:', phone);
    const conversationData = await getFirestoreDoc(env, 'conversations', phone);
    console.log('Conversation data:', conversationData);
    const messages = conversationData?.messages || [];

    // Add customer message to history
    messages.push({
      role: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    });

    // Get available slots from AroFlo
    console.log('Fetching available slots...');
    const trade = conversationData?.problem?.toLowerCase().includes('electrical') ? 'electrical' : 'plumbing';
    const availableSlots = await getAvailableSlots(trade);
    console.log('Available slots:', availableSlots.length);

    // Call Claude API to generate response
    console.log('Calling Claude API...');
    const claudeResponse = await callClaude(env, {
      name: conversationData?.name || 'Customer',
      problem: conversationData?.problem || 'Not specified',
      address: conversationData?.address || '',
      postcode: conversationData?.postcode || '',
      trade,
      availableSlots: availableSlots.slice(0, 3), // Top 3 slots
      messages: messages.map(m => ({ role: m.role, content: m.text })),
    });
    console.log('Claude response:', claudeResponse);

    // Add Claude response to history
    messages.push({
      role: 'assistant',
      text: claudeResponse,
      timestamp: new Date().toISOString(),
    });

    // Store updated conversation in Firestore
    await updateFirestoreDoc(env, 'conversations', phone, {
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

async function handleOutboundBookingFlow(env, phone, message, bookingFlow) {
  const step = bookingFlow.step;
  const isYes = message.toLowerCase().trim() === 'yes';

  try {
    if (step === 'message_1_sent') {
      // Waiting for YES/corrections to Message 1
      if (isYes) {
        // Confirmed, send Message 2 (urgency options)
        await sendOutboundSMS(env, {
          phone,
          message: `Got it. Two options: (1) TONIGHT - $549 emergency call-out, or (2) STANDARD - Free call-out and quote. Reply TONIGHT or STANDARD`,
        });
        await updateBookingFlowStep(env, phone, 'message_2_sent');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        // They gave corrections - ask them to contact support
        await sendOutboundSMS(env, {
          phone,
          message: `Thanks for the correction. Please reply with the correct details and we'll update your booking.`,
        });
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else if (step === 'message_2_sent') {
      // Waiting for TONIGHT or STANDARD
      const choice = message.toLowerCase().trim();
      if (choice === 'tonight') {
        await sendOutboundSMS(env, {
          phone,
          message: `After-hours booking confirmed. Tech will call back within 5-10 mins. Call-out fee $549. Confirm? YES/NO`,
        });
        await updateBookingFlowStep(env, phone, 'emergency_confirm_sent');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else if (choice === 'standard') {
        // Get available slots
        const slots = await getAvailableSlots(bookingFlow.trade);
        if (slots.length === 0) {
          await sendOutboundSMS(env, {
            phone,
            message: `No slots available right now. The team will call you between 7-9:30am tomorrow to lock in a time.`,
          });
          await updateBookingFlowStep(env, phone, 'standard_confirm_sent');
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const slot = slots[0];
        await sendOutboundSMS(env, {
          phone,
          message: `${slot.day} ${slot.start_time}-${slot.end_time} with ${slot.tech} - available? Reply YES or give alternate time`,
        });
        await updateBookingFlowStep(env, phone, 'standard_slots_offered', { selectedSlot: JSON.stringify(slot) });
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else if (step === 'emergency_confirm_sent') {
      if (isYes) {
        // Create emergency job
        await createEmergencyJob(env, bookingFlow);
        await updateBookingFlowStep(env, phone, 'emergency_booked');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else if (step === 'standard_slots_offered') {
      if (isYes) {
        // Create standard job with offered slot
        const slot = JSON.parse(bookingFlow.selectedSlot || '{}');
        await createStandardJob(env, bookingFlow, slot);
        await sendOutboundSMS(env, {
          phone,
          message: `Booked for ${slot.day} ${slot.start_time}-${slot.end_time}. Tech calls 30min before.`,
        });
        await updateBookingFlowStep(env, phone, 'standard_booked');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        // They want different time - show next slot or offer coordination
        await sendOutboundSMS(env, {
          phone,
          message: `Got it. The team will call between 7-9:30am tomorrow to find a time that suits you.`,
        });
        await updateBookingFlowStep(env, phone, 'standard_confirm_sent');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else if (step === 'standard_confirm_sent') {
      // Already confirmed, no more messages needed
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown booking flow step' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Booking flow error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Booking flow error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function updateBookingFlowStep(env, phone, step, extras = {}) {
  const apiKey = env.FIREBASE_API_KEY;
  const projectId = env.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/booking_flows/${phone}?key=${apiKey}`;

  const updateData = {
    step: { stringValue: step },
    lastUpdated: { stringValue: new Date().toISOString() },
    ...Object.entries(extras).reduce((acc, [key, val]) => {
      acc[key] = typeof val === 'string' ? { stringValue: val } : val;
      return acc;
    }, {}),
  };

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updateData }),
    });
  } catch (error) {
    console.error('Error updating booking flow step:', error);
  }
}

async function createEmergencyJob(env, bookingFlow) {
  // Call AroFlo to create emergency job
  console.log('Creating emergency job for:', bookingFlow.phone);
  // Implementation would call AroFlo API
}

async function createStandardJob(env, bookingFlow, slot) {
  // Call AroFlo to create standard job with specific slot
  console.log('Creating standard job for:', bookingFlow.phone, 'slot:', slot);
  // Implementation would call AroFlo API
}

async function sendOutboundSMS(env, { phone, message }) {
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

  if (!response.ok) {
    console.error('SMS error:', response.status);
  }
}

async function getFirestoreDoc(env, collection, docId) {
  const apiKey = env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('FIREBASE_API_KEY not configured');
    return null;
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?key=${apiKey}`;

  const response = await fetch(url);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    console.error('Firestore fetch error:', response.status);
    return null;
  }

  const data = await response.json();
  return firestoreToObject(data.fields);
}

async function updateFirestoreDoc(env, collection, docId, data) {
  const apiKey = env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('FIREBASE_API_KEY not configured');
    throw new Error('Firebase API key not configured');
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: objectToFirestore(data),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Firestore update error:', response.status, errorText);
    throw new Error(`Failed to update Firestore: ${response.status}`);
  }

  return response.json();
}

function objectToFirestore(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = valueToFirestore(value);
  }
  return fields;
}

function valueToFirestore(value) {
  if (value === null) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(v => valueToFirestore(v)),
      },
    };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: objectToFirestore(value),
      },
    };
  }
  return { stringValue: String(value) };
}

function firestoreToObject(fields) {
  const obj = {};
  for (const [key, field] of Object.entries(fields)) {
    obj[key] = firestoreValueToJs(field);
  }
  return obj;
}

function firestoreValueToJs(field) {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.nullValue !== undefined) return null;
  if (field.arrayValue) {
    return field.arrayValue.values.map(v => firestoreValueToJs(v));
  }
  if (field.mapValue) {
    return firestoreToObject(field.mapValue.fields);
  }
  return null;
}

async function getAvailableSlots(trade) {
  try {
    const response = await fetch('https://us-central1-pettrdashboards.cloudfunctions.net/aroFloAgent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'get_available_slots',
        arguments: {
          trade,
        },
      }),
    });

    if (!response.ok) {
      console.error('AroFlo API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.slots || [];
  } catch (error) {
    console.error('Error fetching available slots:', error.message);
    return [];
  }
}

async function callClaude(env, { name, problem, address, postcode, trade, availableSlots, messages }) {
  const apiKey = env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY not configured');
  }

  const slotsText = availableSlots && availableSlots.length > 0
    ? `\n\nAvailable appointment slots:\n${availableSlots
        .map(slot => `- ${slot.day}, ${slot.start_time}-${slot.end_time} (${slot.tech})`)
        .join('\n')}`
    : '';

  const systemPrompt = `You are a helpful booking assistant for Plumber & Electrician to the Rescue.

Customer Details:
- Name: ${name}
- Address: ${address} ${postcode}
- Issue: ${problem}
- Service: ${trade}

You already have their contact details and address. Help them confirm the booking and offer the available appointment slots below. Be friendly, professional, and brief. Keep responses to 1-2 sentences for SMS.${slotsText}`;

  console.log('Claude request - Name:', name, 'Problem:', problem, 'Messages:', messages.length);

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

  console.log('Claude response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude error:', errorText);
    throw new Error(`Claude API error: ${response.status} ${errorText}`);
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
