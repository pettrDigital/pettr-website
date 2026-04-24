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

    const subject = `New Lead — ${service || "plumbing"} — ${suburb || "Sydney"}`;

    const textBody = `
New PTTR Lead

Name: ${name}
Email: ${email}
Phone: ${phone}
Address: ${address}
Postcode: ${postcode}
Message: ${message}

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
          ${row("Name", name)}
          ${row("Email", email || "-")}
          ${row("Phone", phone)}
          ${row("Address", address || "-")}
          ${row("Postcode", postcode || "-")}
          ${row("Message", message || "-")}
        </div>

        <div style="padding:12px 24px; background:#f9f9f9; border-top:1px solid #eee;">
          <div style="font-size:11px; color:#999; line-height:1.6;">
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
      to:        ["digital.plumbertotherescue@gmail.com"],
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
      <div style="font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; color:#888; margin-bottom:4px;">${escapeHtml(label)}</div>
      <div style="font-size:15px; color:#111; min-height:20px;">${escapeHtml(value).replace(/\n/g, "<br>")}</div>
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