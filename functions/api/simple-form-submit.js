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
My Problem is ${message}
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
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px; border-bottom:3px solid #077bab;">
              <p style="margin:0; font-size:20px; font-weight:bold; color:#033d56; font-family:Arial, Helvetica, sans-serif;">${escapeHtml(subject)}</p>
            </td>
          </tr>

          <!-- Fields -->
          <tr><td>${row("My name is", name)}</td></tr>
          <tr><td>${row("My problem is", message || "-")}</td></tr>
          <tr><td>${row("My phone number is", phone)}</td></tr>
          <tr><td>${row("My email is", email || "-")}</td></tr>
          <tr><td>${row("My address is", address || "-")}</td></tr>
          <tr><td>${row("My postcode is", postcode || "-")}</td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #e8e8e8;">
              <p style="margin:0; font-size:11px; color:#999; font-family:Arial, Helvetica, sans-serif;">
                <a href="${escapeHtml(pageUrl)}" style="color:#999;">Sent from Plumber and Electrician to the Rescue</a>
              </p>
            </td>
          </tr>

          <!-- Attribution (hidden) -->
          <tr>
            <td style="padding:0 32px 12px 32px;">
              <p style="margin:0; font-size:6px; color:#f9f9f9; font-family:Arial, Helvetica, sans-serif;">
                ${escapeHtml(suburb)} | ${escapeHtml(service)} | ${escapeHtml(variant || 'a')} | ${escapeHtml(utmSource)} | ${escapeHtml(utmMedium)} | ${escapeHtml(utmCampaign)} | ${escapeHtml(utmTerm)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const res = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key:   env.SMTP2GO_API_KEY,
        sender:    "service@plumberandelectrician.com.au",
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
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #e8e8e8;">
      <tr>
        <td style="padding:20px 32px; background:#ffffff;">
          <p style="margin:0 0 6px 0; font-size:15px; font-weight:bold; color:#000; font-family:Arial, Helvetica, sans-serif;">${escapeHtml(label)}</p>
          <p style="margin:0; font-size:15px; color:#222; font-family:Arial, Helvetica, sans-serif;">${escapeHtml(value).replace(/\n/g, "<br>")}</p>
        </td>
      </tr>
    </table>
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