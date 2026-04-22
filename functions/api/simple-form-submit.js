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
  <body style="margin:0; padding:0; background:#efefef; font-family:Arial, Helvetica, sans-serif;">
    <div style="max-width:1000px; margin:0 auto;">

      <div style="padding:20px; font-size:14px; color:#111;">
        <div><strong>From:</strong> PTTR website &lt;jobs@plumbertotherescue.com.au&gt;</div>
        <div><strong>To:</strong> PTTR Leads &lt;jobs@mrwasher.com.au&gt;</div>
        <div><strong>Subject:</strong> ${escapeHtml(subject)}</div>
      </div>

      <div style="background:#ffffff; border-top:1px solid #ddd; border-bottom:1px solid #ddd;">
        ${row("My name is", name)}
        ${row("My email is", email || "-")}
        ${row("My phone number is", phone)}
        ${row("My address is", address || "-")}
        ${row("My postcode is", postcode || "-")}
        ${row("My problem is", message || "-")}
      </div>

      <div style="padding:12px 30px; background:#ffffff; border-top:1px solid #f0f0f0;">
        <div style="font-size:9px; color:#eeeeee; line-height:1.4;">
          ${escapeHtml(suburb)} | ${escapeHtml(service)} | ${escapeHtml(variant || 'a')} | ${escapeHtml(utmSource)} | ${escapeHtml(utmMedium)} | ${escapeHtml(utmCampaign)} | ${escapeHtml(utmTerm)} | ${escapeHtml(gclid)}
        </div>
      </div>

      <div style="padding:24px; text-align:right; font-size:12px; color:#777;">
        Sent from <a href="https://plumbertotherescue.com.au" style="color:#666;">Plumber To The Rescue</a>
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
        sender:    "jobs@mrwasher.com.au",
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
    <div style="padding:26px 30px; border-bottom:1px solid #eee;">
      <div style="font-size:16px; font-weight:bold; margin-bottom:10px;">${escapeHtml(label)}</div>
      <div style="font-size:16px;">${escapeHtml(value).replace(/\n/g, "<br>")}</div>
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