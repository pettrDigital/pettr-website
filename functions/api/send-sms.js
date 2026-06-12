// Internal outbound-SMS endpoint for trusted backend callers (e.g. the
// aroFloAgent Cloud Function confirming voice bookings). Requires the same
// shared-secret header as the inbound webhook. Not for browser use.
import { sendSMS, composeBookingConfirmation } from '../lib/sms.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!env.SMS_WEBHOOK_TOKEN || request.headers.get('X-Webhook-Token') !== env.SMS_WEBHOOK_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { phone, message, booking, test } = await request.json();

    // Callers either pass a raw message, or booking fields which are
    // composed with the same template the web booking flow uses.
    let text = message || (booking ? composeBookingConfirmation(booking) : null);

    if (!phone || !text) {
      return new Response(JSON.stringify({ error: 'Missing phone or message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (test) {
      text = `[TEST MODE - no job created] ${text}`;
    }

    await sendSMS(env, { phone, message: text });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-sms error:', error);
    return new Response(JSON.stringify({ error: error.message || 'SMS send failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
