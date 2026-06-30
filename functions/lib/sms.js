// Shared SMS adapter. Sends via Sinch MessageMedia when MESSAGEMEDIA_* env vars
// are set; falls back to Kudosity/TransmitSMS during the parallel-run cutover.
import { isNotifyTest, TEST_SMS } from './recipients.js';

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
  const isAfterHours = urgency === 'emergency' || urgency === 'tonight';
  const timeStr = [day, startTime && endTime ? `${startTime}-${endTime}` : startTime].filter(Boolean).join(' ');
  const hasSlot = !!timeStr;
  // Job number leads the message, but only for a committed job: a confirmed
  // slot, or an after-hours call-out (tech calling back now). A standard
  // booking with no slot is still being arranged by the team, so no number.
  const jobTop = (jobNumber && (hasSlot || isAfterHours)) ? `Job Number: ${jobNumber}\n\n` : '';
  if (isAfterHours) {
    return `${jobTop}Hi ${name}, after-hours ${trade} booking received at ${address}${suburbStr} ${postcode}.\n\nA tech will call you back within 5-10 minutes. Thanks!`;
  }
  // Deliberately NOT shown to the customer: the assigned tech name. For an
  // overflow booking the "tech" is the overflow placeholder (Jess AI), so we
  // never put a tech name in the customer's confirmation.
  const issueStr = issue ? `\nIssue: ${issue}` : '';
  return `${jobTop}Hi ${name}, your ${trade} booking is confirmed!\n\nTime: ${timeStr || 'to be confirmed - the team will call between 7-9:30am'}\nAddress: ${address}${suburbStr} ${postcode}${issueStr}\n\nTech will call 30min before arrival.`;
}

export async function sendSMS(env, { phone, message, mediaUrl, subject }) {
  // Test/production gate: while finalising, redirect every SMS to the tester
  // (number kept in the prefix so we can see who it was actually for).
  if (isNotifyTest(env)) {
    message = `[TEST→${phone}] ${message}`;
    phone = TEST_SMS;
    mediaUrl = undefined;
  }
  if (env.MESSAGEMEDIA_API_KEY && env.MESSAGEMEDIA_API_SECRET) {
    if (mediaUrl) {
      // Try MMS (with the team photo) first; if it's rejected — e.g. the account
      // isn't MMS-enabled (402), or the media can't be fetched — fall back to a
      // plain SMS so the customer still gets their confirmation text. Once MMS is
      // enabled on the account this first attempt just succeeds and no retry runs.
      try {
        return await sendViaMessageMedia(env, { phone, message, mediaUrl, subject });
      } catch (err) {
        console.warn('MMS send failed, falling back to plain SMS:', err.message);
        return sendViaMessageMedia(env, { phone, message });
      }
    }
    return sendViaMessageMedia(env, { phone, message });
  }
  // Legacy TransmitSMS path is SMS-only — media is dropped.
  return sendViaTransmitSMS(env, { phone, message });
}

async function sendViaMessageMedia(env, { phone, message, mediaUrl, subject }) {
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

  // MMS: attach an image when a media URL is supplied AND the sender is a real
  // number that can carry it. Alpha tags and the shared pool can't send MMS, so
  // we silently stay SMS in that case. Media must be a public JPEG/PNG — handsets
  // don't reliably render WebP over MMS.
  if (mediaUrl && sms.source_number && /^\+?\d+$/.test(sms.source_number)) {
    sms.format = 'MMS';
    sms.media = [mediaUrl];
    if (subject) sms.subject = subject;
  }

  console.log('Sender:', sms.source_number ? `${sms.source_number} (${sms.source_number_type})` : 'shared pool (MESSAGEMEDIA_SENDER not set)', '| format:', sms.format);

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
