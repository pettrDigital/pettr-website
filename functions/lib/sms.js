// Shared SMS adapter. Sends via Sinch MessageMedia when MESSAGEMEDIA_* env vars
// are set; falls back to Kudosity/TransmitSMS during the parallel-run cutover.

// Canonical local format (04xxxxxxxx) — matches normalisePhone in the
// aroFloAgent Cloud Function so phone-keyed Firestore docs stay consistent
// across systems.
export function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).replace(/\D/g, '');
  if (p.startsWith('0061')) p = p.slice(2);
  if (p.startsWith('61') && p.length >= 11) p = '0' + p.slice(2);
  if (p.length === 9 && !p.startsWith('0')) p = '0' + p;
  return p.length >= 9 ? p : '';
}

// E.164 (+61xxxxxxxxx) — the format MessageMedia expects for destinations.
export function toE164(raw) {
  const local = normalizePhone(raw);
  if (!local) return '';
  return local.startsWith('0') ? `+61${local.slice(1)}` : `+${local}`;
}

// Single booking-confirmation template shared by web (quote.js) and voice
// (aroFloAgent via /api/send-sms) so both channels send identical messages.
export function composeBookingConfirmation({ name, trade, address, suburb, postcode, issue, urgency, day, startTime, endTime, tech, jobNumber }) {
  const suburbStr = suburb ? ` ${suburb}` : '';
  const jobStr = jobNumber ? `\nJob #${jobNumber}` : '';
  if (urgency === 'emergency' || urgency === 'tonight') {
    return `Hi ${name}, emergency ${trade} booking received at ${address}${suburbStr} ${postcode}.${jobStr}\n\nA tech will call you back within 5-10 minutes. Thanks!`;
  }
  const timeStr = [day, startTime && endTime ? `${startTime}-${endTime}` : startTime].filter(Boolean).join(' ');
  const techStr = tech ? `\nTech: ${tech}` : '';
  const issueStr = issue ? `\nIssue: ${issue}` : '';
  return `Hi ${name}, your ${trade} booking is confirmed!${jobStr}\n\nTime: ${timeStr || 'to be confirmed - the team will call between 7-9:30am'}${techStr}\nAddress: ${address}${suburbStr} ${postcode}${issueStr}\n\nTech will call 30min before arrival.`;
}

export async function sendSMS(env, { phone, message }) {
  if (env.MESSAGEMEDIA_API_KEY && env.MESSAGEMEDIA_API_SECRET) {
    return sendViaMessageMedia(env, { phone, message });
  }
  return sendViaTransmitSMS(env, { phone, message });
}

async function sendViaMessageMedia(env, { phone, message }) {
  const destination = toE164(phone);
  console.log('=== SENDING SMS (MessageMedia) ===');
  console.log('To:', destination);

  if (!destination) {
    throw new Error(`SMS error: could not normalise phone "${phone}"`);
  }

  const credentials = btoa(`${env.MESSAGEMEDIA_API_KEY}:${env.MESSAGEMEDIA_API_SECRET}`);

  const sms = {
    content: message,
    destination_number: destination,
    format: 'SMS',
  };
  // Sender ID: defaults to our dedicated AU number (consistent + two-way).
  // Override via MESSAGEMEDIA_SENDER env var:
  //   "+614xxxxxxxx" → dedicated number   |   "PETTR" → alpha tag (one-way,
  //   auto do-not-reply footer)           |   "pool" → shared pool (rotates)
  const sender = env.MESSAGEMEDIA_SENDER || '+61437964618';
  if (sender.toLowerCase() !== 'pool') {
    const isNumber = /^\+?\d+$/.test(sender);
    sms.source_number = sender;
    sms.source_number_type = isNumber ? 'INTERNATIONAL' : 'ALPHANUMERIC';
    if (!isNumber) {
      sms.content = `${message}\n\nDO NOT REPLY TO THIS MESSAGE`;
    }
  }

  console.log('Sender:', sms.source_number ? `${sms.source_number} (${sms.source_number_type})` : 'shared pool (MESSAGEMEDIA_SENDER not set)');

  const response = await fetch('https://api.messagemedia.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ messages: [sms] }),
  });

  const responseText = await response.text();
  console.log('MessageMedia response status:', response.status);
  console.log('MessageMedia response:', responseText.substring(0, 300));

  if (!response.ok) {
    throw new Error(`SMS error (MessageMedia): ${response.status} ${responseText}`);
  }

  return responseText;
}

async function sendViaTransmitSMS(env, { phone, message }) {
  console.log('=== SENDING SMS (TransmitSMS legacy) ===');
  console.log('To:', phone);

  const apiKey = env.TRANSMITSMS_API_KEY;
  const apiSecret = env.TRANSMITSMS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('SMS credentials not configured');
  }

  const credentials = btoa(`${apiKey}:${apiSecret}`);

  const formData = new URLSearchParams();
  formData.append('to', phone);
  formData.append('message', message);
  formData.append('from', 'PETTR');
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
  console.log('SMS response status:', response.status);
  console.log('SMS response:', responseText.substring(0, 200));

  if (!response.ok) {
    throw new Error(`SMS error: ${response.status} ${responseText}`);
  }

  return responseText;
}
