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
    const { phone, message, booking, request: changeRequest, test } = await request.json();

    // Change requests (cancel / reschedule / enquiry) are email-only handoffs
    // to the team — no AroFlo change, no customer SMS (Jess acks on the call).
    if (changeRequest) {
      await notifyTeamChangeRequest(env, { phone, request: changeRequest });

      // Cancellations and reschedules also ack the customer in writing;
      // enquiries stay verbal-only. SMS failure never fails the handoff.
      const ack = composeChangeRequestAck(changeRequest);
      if (ack && phone) {
        try {
          await sendSMS(env, { phone, message: ack });
        } catch (smsError) {
          console.error('Change request ack SMS failed:', smsError.message);
        }
      }

      return new Response(JSON.stringify({ success: true, action: 'change_request_emailed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Otherwise: either a raw message, or booking fields which are composed
    // with the same template the web booking flow uses.
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

function composeChangeRequestAck({ type, name, preferredDate, preferredTime }) {
  const first = (name || '').trim().split(/\s+/)[0] || 'there';
  if (type === 'cancel') {
    return `Hi ${first}, we've received your request to cancel your booking. The team will confirm the cancellation with you shortly.`;
  }
  if (type === 'reschedule') {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate || '')
      ? new Date(`${preferredDate}T00:00:00Z`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
      : (preferredDate || '');
    const preferred = [day, preferredTime].filter(Boolean).join(' ');
    return `Hi ${first}, we've received your request to reschedule your booking${preferred ? ` to ${preferred}` : ''}. Your current booking stands until the team confirms the new time with you.`;
  }
  return null;
}

const REQUEST_SUBJECTS = {
  cancel: 'Cancellation Request',
  reschedule: 'Reschedule Request',
  enquiry: 'Enquiry/Other',
};

async function notifyTeamChangeRequest(env, { phone, request }) {
  const apiKey = env.SMTP2GO_API_KEY;
  if (!apiKey) {
    console.error('SMTP2GO_API_KEY not configured');
    return;
  }

  const { type, name, details, jobReference, preferredDate, preferredTime, channel } = request;
  const subjectPrefix = REQUEST_SUBJECTS[type] || REQUEST_SUBJECTS.enquiry;
  const preferred = [preferredDate, preferredTime].filter(Boolean).join(' ');

  const emailHtml = `
    <h2>${subjectPrefix}</h2>
    <p><strong>Name:</strong> ${name || 'Unknown'}</p>
    <p><strong>Phone:</strong> ${phone || 'Unknown'}</p>
    ${jobReference ? `<p><strong>Job reference:</strong> ${jobReference}</p>` : ''}
    <p><strong>Request:</strong> ${details || 'Not specified'}</p>
    ${preferred ? `<p><strong>Preferred new time:</strong> ${preferred} (NOT booked - team to confirm)</p>` : ''}
    <p><strong>Channel:</strong> ${channel || 'voice'}</p>
    <p><em>No change has been made in AroFlo - the team needs to action this and confirm with the customer.</em></p>
  `;

  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      to: ['fergusg@mrwasher.com.au'],
      sender: 'webform@plumberandelectrician.com.au',
      subject: `${subjectPrefix} - ${name || phone || 'Unknown'}`,
      html_body: emailHtml,
    }),
  });

  if (!response.ok) {
    console.error('Change request email failed:', response.status);
    throw new Error(`Change request email failed: ${response.status}`);
  }

  console.log('Change request email sent:', type);
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
      <h2>New Booking Request${test ? ' (TEST MODE - no AroFlo job created)' : ''}</h2>
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
        subject: `${test ? '[TEST MODE] ' : ''}New Booking Request${urgency === 'emergency' ? ' - EMERGENCY' : ''} - ${name}`,
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
