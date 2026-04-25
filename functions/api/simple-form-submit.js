export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const body = await request.json();

    const name        = body.name        || "";
    const email       = body.email       || "";
    const phone       = body.phone       || "";
    const address     = body.address     || "";
    const postcode    = body.postcode    || "";
    const message     = body.message     || "";
    const utmSource   = body.utm_source  || "";
    const utmMedium   = body.utm_medium  || "";
    const utmCampaign = body.utm_campaign|| "";
    const utmTerm     = body.utm_term    || "";
    const gclid       = body.gclid       || "";
    const suburb      = body.suburb      || "";
    const service     = body.service     || "";
    const variant     = body.variant     || "";

    if (!name || !phone) {
      return json({ success: false, error: "Name and phone are required" }, 400);
    }

    const trade = ['electrical', 'electrical-emergency', 'switchboard'].includes((service || '').toLowerCase()) ? 'Electrical' : 'Plumbing';
    const subject = `PETTR Website - New Lead - ${trade} - ${service || "TBC"} - ${suburb || "TBC"}`;
    const pageUrl = request.headers.get('referer') || request.headers.get('origin') || '';

    const textBody = `
New PETTR Lead

My name is ${name}
My Probem is ${message}
My phone number is ${phone}
My email is ${email}
My address is ${address}
My postcode is ${postcode}

--- Attribution ---
Suburb: ${suburb}
Service: ${service}
Variant: ${variant}
UTM Source: ${utmSource}
UTM Medium: ${utmMedium}
UTM Campaign: ${utmCampaign}
UTM Term: ${utmTerm}
GCLID: ${gclid}
`;

  const htmlBody = `
  <!doctype html>
  <html>
    <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff;">

        <div style="padding:16px 24px; background:#ffffff; border-bottom:2px solid #077bab;">
          <div style="font-size:18px; font-weight:bold; color:#033d56;">${escapeHtml(subject)}</div>
        </div>

        <div style="background:#ffffff;">
          ${row("My name is", name)}
          ${row("My problem is", message || "-")}
          ${row("My phone number is", phone)}
          ${row("My email is", email || "-")}
          ${row("My address is", address || "-")}
          ${row("My postcode is", postcode || "-")}
          
        </div>

        <div style="padding:12px 24px; text-align:left; font-size:11px; color:#999;">
          <a href="${escapeHtml(pageUrl)}" style="color:#999; text-decoration:underline;">Sent from Plumber and Electrician to the Rescue</a>
        </div>

        <div style="padding:12px 24px; background:#ffffff; border-top:1px solid #e8e8e8;">
          <div style="font-size:6px; color:#f9f9f9;">
            ${escapeHtml(suburb)} | ${escapeHtml(service)} | ${escapeHtml(variant || 'a')} | ${escapeHtml(utmSource)} | ${escapeHtml(utmMedium)} | ${escapeHtml(utmCampaign)} | ${escapeHtml(utmTerm)}
          </div>
        </div>

      </div>
    </body>
  </html>
  `;

  const res = await fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key:   env.SMTP2GO_API_KEY,
      sender:    "gordo@mrwasher.com.au",
      to:        ["jobs@mrwasher.com.au"],
      subject,
      text_body: textBody,
      html_body: htmlBody,
      reply_to:  email || "jobs@plumbertotherescue.com.au"
    })
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("SMTP2GO error:", data);
    return json({ success: false, error: "Email failed" }, 500);
  }

  return json({ success: true });

  } catch (err) {
    console.error(err);
    return json({ success: false, error: "Server error" }, 500);
  }
}

function row(label, value) {
  return `
    <div style="padding:14px 24px; border-bottom:1px solid #e8e8e8; background:#ffffff;">
      <div style="font-size:13px; font-weight:bold; letter-spacing:0.5px; color:#000; margin-bottom:4px;">${escapeHtml(label)}</div>
      <div style="font-size:12px; color:#111; min-he  ight:20px;">${escapeHtml(value).replace(/\n/g, "<br>")}</div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}