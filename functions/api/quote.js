
import { sendSMS as deliverSMS, normalizePhone, composeBookingConfirmation } from '../lib/sms.js';

const SYDNEY_POSTCODES = new Set([
  // Sydney CBD & Inner
  2000, 2001, 2002, 2003, 2004, 2006, 2007, 2008, 2009, 2010, 2011, 2015, 2016, 2017, 2018, 2019, 2020, 2021,
  // Inner West
  2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
  2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049, 2050,
  // North Shore / Northern Beaches
  2060, 2061, 2062, 2063, 2064, 2065, 2066, 2067, 2068, 2069, 2070, 2071, 2072, 2073, 2074, 2075, 2076, 2077,
  2079, 2080, 2081, 2082, 2083, 2084, 2085, 2086, 2087, 2088, 2089, 2090, 2092, 2093, 2094, 2095, 2096, 2097,
  2098, 2099, 2100, 2101, 2102, 2103, 2104, 2105, 2106, 2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114, 2115,
  2116, 2117, 2118, 2119, 2120, 2121, 2122, 2123,
  // Hills / Hawkesbury
  2124, 2125, 2126, 2127, 2128, 2129, 2130, 2131, 2132, 2133, 2134, 2135, 2136, 2137, 2138, 2139, 2140, 2141,
  2142, 2143, 2144, 2145, 2146, 2147, 2148, 2150, 2151, 2152, 2153, 2154, 2155, 2156, 2157, 2158, 2159, 2160,
  2161, 2162, 2163, 2164, 2165, 2166, 2167, 2168, 2170, 2171, 2172, 2173, 2174, 2175, 2176, 2177, 2178, 2179,
  // South / Sutherland Shire
  2190, 2191, 2192, 2193, 2194, 2195, 2196, 2197, 2198, 2199, 2200, 2203, 2204, 2205, 2206, 2207, 2208, 2209,
  2210, 2211, 2212, 2213, 2214, 2216, 2217, 2218, 2219, 2220, 2221, 2222, 2223, 2224, 2225, 2226, 2227, 2228,
  2229, 2230, 2231, 2232, 2233, 2234, 2560, 2563, 2564, 2565, 2566, 2567, 2568, 2569, 2570,
  // Western Sydney / Parramatta / Penrith
  2745, 2747, 2748, 2749, 2750, 2751, 2752, 2753, 2754, 2755, 2756, 2757, 2758, 2759, 2760, 2761, 2762, 2763,
  2765, 2766, 2767, 2768, 2769, 2770, 2773, 2774, 2775, 2776, 2777, 2778, 2779, 2780, 2782, 2783, 2784, 2785,
  2786, 2787, 2790,
  // South-West / Campbelltown / Liverpool
  2557, 2558, 2559, 2561, 2562, 2571, 2572, 2573, 2574, 2575, 2576,
]);

function isInServiceArea(postcodeRaw) {
  const pc = parseInt(String(postcodeRaw).replace(/\D/g, ''), 10);
  return !isNaN(pc) && SYDNEY_POSTCODES.has(pc);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const requestType = formData.get('requestType');

    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      postcode: formData.get('postcode'),
      suburb: formData.get('suburb'),
      message: formData.get('message'),
      requestType,
    };

    if (!data.name || !data.phone || !data.address || !data.postcode || !data.suburb || !data.message || !requestType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if ((requestType === 'callback' || requestType === 'bookNow') && !data.email) {
      return new Response(JSON.stringify({ error: 'Email is required for this request type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (requestType === 'bookNow') {
      const serviceType = formData.get('bookNowServiceType');
      const urgency = formData.get('bookNowUrgency');
      const ownership = formData.get('bookNowOwnership');
      const appliance = formData.get('bookNowAppliance');
      const slot = formData.get('bookNowSlot');

      if (!serviceType || !urgency || !ownership) {
        return new Response(JSON.stringify({ error: 'Missing booking details' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Appliance is now an optional single checkbox (informational) — never
      // required. We capture it if ticked, but never block a booking on it.

      if (urgency === 'standard' && !slot) {
        return new Response(JSON.stringify({ error: 'Time slot is required for standard bookings' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      data.bookNowServiceType = serviceType;
      data.bookNowUrgency = urgency;
      data.bookNowOwnership = ownership;
      data.bookNowAppliance = appliance;
      if (slot) {
        data.bookNowSlot = JSON.parse(slot);
      }
    }

    if (!isInServiceArea(data.postcode)) {
      return new Response(JSON.stringify({ error: 'Sorry, we do not service that postcode. Please visit service-areas.html to view our service areas.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.requestType === 'callback') {
      const suburb = data.suburb ? `, ${escapeHtml(data.suburb)}` : '';
      const emailHtml = `
        <h2>New Quote Request - Call Back</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Address:</strong> ${escapeHtml(data.address)}${suburb} ${escapeHtml(data.postcode)}</p>
        <p><strong>Message:</strong> ${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
      `;

      await sendEmail(env, {
        from: 'webform@plumberandelectrician.com.au',
        to: env.QUOTE_EMAIL,
        subject: `New Quote Request from ${data.name}`,
        html: emailHtml,
      });

      console.log('Triggering Retell callback for:', data.phone);
      const trade = data.message.toLowerCase().includes('electrical') ? 'electrical' : 'plumbing';

      await triggerRetellCallback(env, {
        phone: data.phone,
        name: data.name,
        address: data.address,
        suburb: data.suburb,
        postcode: data.postcode,
        message: data.message,
        trade: trade,
      });
    } else if (data.requestType === 'bookNow') {
      console.log('=== INSTANT BOOKING INITIATED ===');
      const trade = data.bookNowServiceType;

      const slot = data.bookNowSlot || null;

      // Create the AroFlo job FIRST so the confirmation SMS can carry the job
      // number and be marked [TEST MODE] when writes are blocked — identical
      // message, marking and ordering to the voice flow.
      let arofloResult = null;
      try {
        const bookingPayload = {
          name:        data.name,
          phone:       data.phone,
          email:       data.email,
          address:     data.address,
          suburb:      data.suburb || '',
          postcode:    data.postcode,
          trade,
          urgency:     data.bookNowUrgency,
          description: data.message,
          ownership:   data.bookNowOwnership,
          appliance:   data.bookNowAppliance,
          slot,
        };
        const jobRes = await fetch(
          'https://us-central1-pettrdashboards.cloudfunctions.net/createWebBooking',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload),
          }
        );
        arofloResult = await jobRes.json();
        console.log('AroFlo job creation result:', JSON.stringify(arofloResult));
      } catch (jobErr) {
        // Non-fatal — still send the confirmation, just without a job number
        console.error('AroFlo job creation failed (non-fatal):', jobErr.message);
        arofloResult = { error: jobErr.message };
      }

      const jobNumber  = arofloResult?.jobNumber || null;
      const testPrefix = arofloResult?.blocked === true ? '[TEST MODE - no job created] ' : '';

      // Confirmation SMS — same template + test marking as the voice flow
      const smsMessage = (data.bookNowUrgency === 'tonight')
        ? composeBookingConfirmation({
            name: data.name, trade,
            address: data.address, suburb: data.suburb, postcode: data.postcode,
            urgency: 'emergency', jobNumber,
          })
        : composeBookingConfirmation({
            name: data.name, trade,
            address: data.address, suburb: data.suburb, postcode: data.postcode,
            issue: data.message,
            day: slot?.day, startTime: slot?.start_time, endTime: slot?.end_time, tech: slot?.tech,
            jobNumber,
          });
      try {
        await sendBookingSMS(env, { phone: data.phone, message: testPrefix + smsMessage });
        console.log('Booking confirmation SMS sent to:', data.phone, '| jobNumber:', jobNumber, '| test:', !!testPrefix);
      } catch (smsErr) {
        // Non-fatal — the booking already succeeded; never fail the request over SMS.
        console.error('Booking confirmation SMS failed (non-fatal):', smsErr.message);
      }

      // Send email to support with booking details
      const isAfterHours = data.bookNowUrgency === 'tonight';
      // "Booked" (gets a job number) = a confirmed slot or an after-hours call-out.
      const booked = !!slot || isAfterHours;
      const suburbDisplay = data.suburb ? `, ${escapeHtml(data.suburb)}` : '';
      let emailHtml = `
        <h2>${booked ? 'Booked Job' : 'Job Request'}</h2>
        ${jobNumber ? `<p><strong>Job number:</strong> ${escapeHtml(String(jobNumber))}</p>` : ''}
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Address:</strong> ${escapeHtml(data.address)}${suburbDisplay} ${escapeHtml(data.postcode)}</p>
        <p><strong>Issue:</strong> ${escapeHtml(data.message)}</p>
        <p><strong>Service Type:</strong> ${escapeHtml(trade)}</p>
        <p><strong>Urgency:</strong> ${isAfterHours ? 'After Hours - $549 call out fee including first 1/2 hour labour' : 'Standard Business Hours'}</p>
        <p><strong>Homeowner/Tenant:</strong> ${data.bookNowOwnership}</p>
        ${data.bookNowAppliance === 'yes' ? '<p><strong>Relates to an appliance:</strong> Yes</p>' : ''}
      `;

      if (slot) {
        emailHtml += `
        <p><strong>Booked Slot:</strong> ${slot.day} ${slot.start_time}-${slot.end_time}</p>
        `;
      }

      emailHtml += `</div>`;

      const subjectLead = (booked && jobNumber) ? `Job Booked: ${jobNumber}` : 'Job Request';
      try {
        await sendEmail(env, {
          from: 'webform@plumberandelectrician.com.au',
          to: 'fergusg@mrwasher.com.au',
          subject: `${subjectLead} - ${data.name}${isAfterHours ? ' - AFTER HOURS' : ''}`,
          html: emailHtml,
        });
        console.log('Booking email sent to support');
      } catch (emailErr) {
        // Non-fatal — the booking already succeeded; never fail the request over email.
        console.error('Booking notification email failed (non-fatal):', emailErr.message);
      }

      return new Response(JSON.stringify({ success: true, message: 'Quote request submitted. We will call you shortly!', arofloResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

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

async function sendSMS(env, { phone, name, address, postcode, problem }) {
  const message = `Hi ${name}, we received your service enquiry: ${problem} at ${address} ${postcode}. Would you like to go ahead and book that service?`;
  return deliverSMS(env, { phone, message });
}

async function triggerRetellCallback(env, { phone, name, address, suburb, postcode, message, trade }) {
  console.log('=== RETELL CALLBACK ===');
  console.log('Phone:', phone);
  console.log('Name:', name);
  console.log('Address:', address);
  console.log('Suburb:', suburb);
  console.log('Postcode:', postcode);
  console.log('Message:', message);
  console.log('Trade:', trade);

  const retellApiKey = env.RETELL_API_KEY;
  const retellAgentId = env.RETELL_AGENT_ID;
  const retellFromNumber = env.RETELL_FROM_NUMBER;

  console.log('Env check:', {
    hasApiKey: !!retellApiKey,
    hasAgentId: !!retellAgentId,
    hasFromNumber: !!retellFromNumber,
    fromNumberValue: retellFromNumber,
  });

  if (!retellApiKey || !retellAgentId || !retellFromNumber) {
    throw new Error(`Retell config missing: apiKey=${!!retellApiKey}, agentId=${!!retellAgentId}, fromNumber=${!!retellFromNumber}, fromNumberValue="${retellFromNumber}"`);
  }

  let toNumber = phone.replace(/\D/g, '');
  let fromNumber = retellFromNumber;

  console.log('Raw phone input:', phone);
  console.log('toNumber after removing non-digits:', toNumber);

  // Convert to_number to international format if needed
  if (toNumber.startsWith('0')) {
    toNumber = '61' + toNumber.slice(1);
  }

  // Ensure to_number has + prefix
  if (!toNumber.startsWith('+')) {
    toNumber = '+' + toNumber;
  }

  // Ensure from_number has + prefix
  if (!fromNumber.startsWith('+')) {
    fromNumber = '+' + fromNumber;
  }

  console.log('Calling from:', fromNumber, 'to:', toNumber);

  const payload = {
    agent_id: retellAgentId,
    from_number: fromNumber,
    to_number: toNumber,
    retell_llm_dynamic_variables: {
      first_name: name ? name.split(' ')[0] : '',
      last_name: name ? name.split(' ').slice(1).join(' ') : '',
      // Explicit flag the agent can read — Retell substitutes {{last_name}} to ""
      // before the model sees it, so an "is the surname empty?" check can't work
      // off the variable itself.
      surname_provided: (name && name.trim().split(/\s+/).length > 1) ? 'true' : 'false',
      phone: phone,
      street_address: address || '',
      suburb: suburb || '',
      postcode: postcode || '',
      description: message || '',
      trade: trade || '',
    },
  };
  console.log('Payload:', JSON.stringify(payload));

  const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${retellApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log('Retell response status:', response.status);
  console.log('Retell response text:', responseText);

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    console.log('Failed to parse Retell response as JSON');
    throw new Error(`Retell API error: ${response.status} - ${responseText}`);
  }

  if (!response.ok) {
    throw new Error(`Retell API error: ${response.status} - payload: ${JSON.stringify(payload)} - response: ${JSON.stringify(result)}`);
  }

  return result;
}

async function storeQuoteInFirestore(env, { phone, name, address, postcode, problem }) {
  try {
    if (!env.FIREBASE_API_KEY || !env.FIREBASE_PROJECT_ID) {
      console.error('Firebase configuration incomplete');
      throw new Error('Firebase not configured');
    }

    const apiKey = env.FIREBASE_API_KEY;
    const projectId = env.FIREBASE_PROJECT_ID;
    const phoneKey = normalizePhone(phone) || phone;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/conversations/${phoneKey}?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          name: { stringValue: name },
          address: { stringValue: address },
          postcode: { stringValue: postcode },
          problem: { stringValue: problem },
          messages: { arrayValue: { values: [] } },
          createdAt: { stringValue: new Date().toISOString() },
          lastUpdated: { stringValue: new Date().toISOString() },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firestore error:', response.status, errorText);
      throw new Error(`Failed to store quote: ${response.status}`);
    }

    console.log('Quote stored in Firestore for:', phone);
  } catch (error) {
    console.error('Error storing quote in Firestore:', error);
  }
}

async function claudeInterpret(env, { problem, trade }) {
  const apiKey = env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Briefly summarize this ${trade} issue in one short sentence (under 15 words): "${problem}"`,
      }],
    }),
  });

  if (!response.ok) {
    console.error('Claude error:', response.status);
    return problem.substring(0, 50);
  }

  const result = await response.json();
  return result.content[0].text;
}

async function storeBookingFlowState(env, data) {
  try {
    if (!env.FIREBASE_API_KEY || !env.FIREBASE_PROJECT_ID) {
      console.error('Firebase configuration incomplete');
      return;
    }

    const apiKey = env.FIREBASE_API_KEY;
    const projectId = env.FIREBASE_PROJECT_ID;
    const phoneKey = normalizePhone(data.phone) || data.phone;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/booking_flows/${phoneKey}?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          phone: { stringValue: phoneKey },
          name: { stringValue: data.name },
          address: { stringValue: data.address },
          postcode: { stringValue: data.postcode },
          problem: { stringValue: data.problem },
          trade: { stringValue: data.trade },
          step: { stringValue: data.step },
          createdAt: { stringValue: data.createdAt },
          lastUpdated: { stringValue: new Date().toISOString() },
        },
      }),
    });

    if (!response.ok) {
      console.error('Firestore error:', response.status);
    }
  } catch (error) {
    console.error('Error storing booking flow state:', error);
  }
}

async function sendBookingSMS(env, { phone, message }) {
  console.log('=== SENDING BOOKING SMS ===');
  console.log('To:', phone);
  console.log('Message length:', message.length);
  return deliverSMS(env, { phone, message });
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
