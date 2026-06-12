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

    // Booking confirmations also notify the team by email, mirroring what
    // quote.js does for web bookings.
    if (booking) {
      await notifyTeamBookingEmail(env, { phone, booking, test });
    }

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

async function notifyTeamBookingEmail(env, { phone, booking, test }) {
  try {
    const apiKey = env.SMTP2GO_API_KEY;
    if (!apiKey) {
      console.error('SMTP2GO_API_KEY not configured');
      return;
    }

    const { name, trade, address, suburb, postcode, issue, urgency, day, startTime, endTime, tech } = booking;
    const timeStr = [day, startTime && endTime ? `${startTime}-${endTime}` : startTime].filter(Boolean).join(' ');

    const emailHtml = `
      <h2>New Phone Booking${test ? ' (TEST MODE - no AroFlo job created)' : ''}</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${address}${suburb ? ` ${suburb}` : ''} ${postcode}</p>
      <p><strong>Issue:</strong> ${issue || 'Not specified'}</p>
      <p><strong>Service Type:</strong> ${trade}</p>
      <p><strong>Urgency:</strong> ${urgency === 'emergency' ? 'Emergency - $549 call out fee including first 1/2 hour labour' : 'Standard Business Hours'}</p>
      ${timeStr ? `<p><strong>Booked Slot:</strong> ${timeStr}</p>` : ''}
      ${tech ? `<p><strong>Tech:</strong> ${tech}</p>` : ''}
      <p><em>Booked via AI phone agent (Jess)</em></p>
    `;

    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: ['fergusg@mrwasher.com.au'],
        sender: 'webform@plumberandelectrician.com.au',
        subject: `${test ? '[TEST MODE] ' : ''}New Phone Booking - ${name}`,
        html_body: emailHtml,
      }),
    });

    if (!response.ok) {
      console.error('Booking notification email failed:', response.status);
      return;
    }

    console.log('Team booking notification email sent');
  } catch (error) {
    // Non-fatal — the SMS already went out; never fail the request over email.
    console.error('Error sending booking notification email:', error);
  }
}
