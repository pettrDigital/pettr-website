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
  // MESSAGEMEDIA_SENDER controls the sender ID:
  //   unset          → shared pool (two-way, but number rotates per message)
  //   "PETTR"        → alpha tag (consistent branding, replies impossible —
  //                    a do-not-reply footer is appended automatically)
  //   "+614xxxxxxxx" → dedicated number (consistent and two-way)
  if (env.MESSAGEMEDIA_SENDER) {
    const isNumber = /^\+?\d+$/.test(env.MESSAGEMEDIA_SENDER);
    sms.source_number = env.MESSAGEMEDIA_SENDER;
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
