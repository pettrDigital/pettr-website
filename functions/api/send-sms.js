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
    // `stage` splits voice notifications around the call lifecycle:
    //   "during_call" → customer SMS only (confirmation or ack), no email
    //   "call_ended"  → team email only, with the call transcript appended
    //   absent        → both at once (legacy callers)
    const { phone, message, booking, request: changeRequest, test, stage, transcript } = await request.json();

    // Change requests (cancel / reschedule / enquiry): email handoff to the
    // team + written ack to the customer for cancel/reschedule.
    if (changeRequest) {
      // Both the team email AND the customer ack fire at call end, so the ack
      // lands after the call (like a booking) — not mid-call. during_call = no-op.
      if (stage !== 'during_call') {
        await notifyTeamChangeRequest(env, { phone, request: changeRequest, transcript });
        const ack = composeChangeRequestAck(changeRequest);
        if (ack && phone) {
          try {
            await sendSMS(env, { phone, message: ack });
          } catch (smsError) {
            console.error('Change request ack SMS failed:', smsError.message);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, action: 'change_request_processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call-end replay of a booking: send the customer confirmation SMS now (so it
    // lands AFTER Jess said "I'll send you a text", not mid-call) AND the team
    // email with transcript.
    if (booking && stage === 'call_ended') {
      let smsText = composeBookingConfirmation(booking);
      if (test) smsText = `[TEST MODE - no job created] ${smsText}`;
      if (phone && smsText) await sendSMS(env, { phone, message: smsText });
      await notifyTeamBookingEmail(env, { phone, booking, test, transcript });
      return new Response(JSON.stringify({ success: true, action: 'booking_sms_and_emailed' }), {
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

    // Legacy/stage-less booking calls still email immediately.
    if (booking && stage !== 'during_call') {
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

function composeChangeRequestAck({ type, name, jobReference, address, suburb, postcode, issue, preferredDate, preferredTime }) {
  const first = (name || '').trim().split(/\s+/)[0] || 'there';
  if (type !== 'cancel' && type !== 'reschedule') return null; // enquiry: no ack

  const jobTop = jobReference ? `Job Number: ${jobReference}\n\n` : '';
  const suburbStr = suburb ? ` ${suburb}` : '';
  const addressLine = address ? `\nAddress: ${address}${suburbStr}${postcode ? ` ${postcode}` : ''}` : '';
  const issueLine = issue ? `\nIssue: ${issue}` : '';

  if (type === 'cancel') {
    // Client has cancelled; the team just removes the booking — no confirmation back.
    return `${jobTop}Hi ${first}, your cancellation request is in.${addressLine}${issueLine}\n\nThe team will remove the booking.`;
  }

  // reschedule — lead with the requested new time, then the unchanged job details.
  const day = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate || '')
    ? new Date(`${preferredDate}T00:00:00Z`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    : (preferredDate || '');
  const preferred = [day, preferredTime].filter(Boolean).join(' ');
  const timeLine = preferred ? `\nTime: ${preferred}` : '';
  // To the customer the new time is booked; the team actions the AroFlo change behind the scenes.
  return `${jobTop}Hi ${first}, you're booked in for your new time.\n\nNew booking:${timeLine}${addressLine}${issueLine}\n\nWe'll send a reminder before the visit.`;
}

const REQUEST_SUBJECTS = {
  cancel: 'Cancellation Request',
  reschedule: 'Reschedule Request',
  enquiry: 'Enquiry/Other',
};

// With a job number we lead the subject with the job, e.g. "Job Cancelled: 143545 - Name".
// Enquiries (and reschedule/cancel with no identified job) fall back to the plain label.
const REQUEST_SUBJECT_LABELS = {
  cancel: 'Job Cancelled',
  reschedule: 'Job Rescheduled',
};

function changeRequestSubject({ type, name, phone, jobReference }) {
  const who = name || phone || 'Unknown';
  const label = REQUEST_SUBJECT_LABELS[type];
  if (label && jobReference) return `${label}: ${jobReference} - ${who}`;
  return `${REQUEST_SUBJECTS[type] || REQUEST_SUBJECTS.enquiry} - ${who}`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function transcriptHtml(transcript) {
  if (!transcript) return '';
  return `
    <h3>Call transcript</h3>
    <pre style="white-space:pre-wrap;font-family:monospace;font-size:13px;background:#f5f5f5;padding:12px;border-radius:4px;">${escapeHtml(transcript)}</pre>
  `;
}

async function notifyTeamChangeRequest(env, { phone, request, transcript }) {
  const apiKey = env.SMTP2GO_API_KEY;
  if (!apiKey) {
    console.error('SMTP2GO_API_KEY not configured');
    return;
  }

  const { type, name, details, jobReference, address, suburb, postcode, issue, preferredDate, preferredTime, channel } = request;
  const subjectPrefix = REQUEST_SUBJECTS[type] || REQUEST_SUBJECTS.enquiry;
  const preferred = [preferredDate, preferredTime].filter(Boolean).join(' ');
  const addressStr = address ? `${address}${suburb ? ` ${suburb}` : ''}${postcode ? ` ${postcode}` : ''}` : '';

  const emailHtml = `
    <h2>${subjectPrefix}</h2>
    <p><strong>Name:</strong> ${name || 'Unknown'}</p>
    <p><strong>Phone:</strong> ${phone || 'Unknown'}</p>
    ${jobReference ? `<p><strong>Job number:</strong> ${jobReference}</p>` : ''}
    ${addressStr ? `<p><strong>Address:</strong> ${addressStr}</p>` : ''}
    ${issue ? `<p><strong>Issue:</strong> ${issue}</p>` : ''}
    <p><strong>Request:</strong> ${details || 'Not specified'}</p>
    ${preferred ? `<p><strong>Preferred new time:</strong> ${preferred} (NOT booked - team to confirm)</p>` : ''}
    <p><strong>Channel:</strong> ${channel || 'voice'}</p>
    <p><em>No change has been made in AroFlo - the team needs to action this and confirm with the customer.</em></p>
    ${transcriptHtml(transcript)}
  `;

  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      to: ['fergusg@mrwasher.com.au'],
      sender: 'webform@plumberandelectrician.com.au',
      subject: changeRequestSubject({ type, name, phone, jobReference }),
      html_body: emailHtml,
    }),
  });

  if (!response.ok) {
    console.error('Change request email failed:', response.status);
    throw new Error(`Change request email failed: ${response.status}`);
  }

  console.log('Change request email sent:', type);
}

async function notifyTeamBookingEmail(env, { phone, booking, test, transcript }) {
  try {
    const apiKey = env.SMTP2GO_API_KEY;
    if (!apiKey) {
      console.error('SMTP2GO_API_KEY not configured');
      return;
    }

    const { name, trade, address, suburb, postcode, issue, urgency, day, startTime, endTime, tech, jobNumber } = booking;
    const isAfterHours = urgency === 'emergency' || urgency === 'tonight';
    const timeStr = [day, startTime && endTime ? `${startTime}-${endTime}` : startTime].filter(Boolean).join(' ');
    // "Booked" (gets a job number) = a confirmed slot or an after-hours call-out.
    // A standard booking with no slot is still a "Job Request".
    const booked = !!timeStr || isAfterHours;

    const emailHtml = `
      <h2>${booked ? 'Booked Job' : 'Job Request'}${test ? ' (TEST MODE - no AroFlo job created)' : ''}</h2>
      ${jobNumber ? `<p><strong>Job number:</strong> ${jobNumber}</p>` : ''}
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${address}${suburb ? ` ${suburb}` : ''} ${postcode}</p>
      <p><strong>Issue:</strong> ${issue || 'Not specified'}</p>
      <p><strong>Service Type:</strong> ${trade}</p>
      <p><strong>Urgency:</strong> ${isAfterHours ? 'After Hours - $549 call out fee including first 1/2 hour labour' : 'Standard Business Hours'}</p>
      ${timeStr ? `<p><strong>Booked Slot:</strong> ${timeStr}</p>` : ''}
      ${tech ? `<p><strong>Tech:</strong> ${tech}</p>` : ''}
      <p><em>Booked via AI phone agent (Jess)</em></p>
      ${transcriptHtml(transcript)}
    `;

    const subjectLead = (booked && jobNumber) ? `Job Booked: ${jobNumber}` : 'Job Request';
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: ['fergusg@mrwasher.com.au'],
        sender: 'webform@plumberandelectrician.com.au',
        subject: `${test ? '[TEST MODE] ' : ''}${subjectLead} - ${name}${isAfterHours ? ' - AFTER HOURS' : ''}`,
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
