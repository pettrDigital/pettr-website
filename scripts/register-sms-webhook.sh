#!/usr/bin/env bash
# Registers the Sinch MessageMedia inbound-SMS webhook pointing at /api/sms-webhook.
#
# Variable names match the Cloudflare Pages secrets exactly. Usage:
#   MESSAGEMEDIA_API_KEY=xxx MESSAGEMEDIA_API_SECRET=xxx SMS_WEBHOOK_TOKEN=xxx \
#   SITE_URL=https://plumberandelectrician.com.au \
#   ./scripts/register-sms-webhook.sh
#
# SMS_WEBHOOK_TOKEN must match the value stored in Cloudflare Pages.
# List existing webhooks:   curl -u "$MESSAGEMEDIA_API_KEY:$MESSAGEMEDIA_API_SECRET" https://api.messagemedia.com/v1/webhooks/messages
# Delete a webhook:         curl -u "$MESSAGEMEDIA_API_KEY:$MESSAGEMEDIA_API_SECRET" -X DELETE https://api.messagemedia.com/v1/webhooks/messages/<id>
set -euo pipefail
: "${MESSAGEMEDIA_API_KEY:?Set MESSAGEMEDIA_API_KEY}" "${MESSAGEMEDIA_API_SECRET:?Set MESSAGEMEDIA_API_SECRET}"
: "${SMS_WEBHOOK_TOKEN:?Set SMS_WEBHOOK_TOKEN}" "${SITE_URL:?Set SITE_URL}"

curl -sS -X POST "https://api.messagemedia.com/v1/webhooks/messages" \
  -u "${MESSAGEMEDIA_API_KEY}:${MESSAGEMEDIA_API_SECRET}" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "url": "${SITE_URL}/api/sms-webhook",
  "method": "POST",
  "encoding": "JSON",
  "headers": { "X-Webhook-Token": "${SMS_WEBHOOK_TOKEN}" },
  "events": ["RECEIVED_SMS"],
  "template": "{\"provider\":\"messagemedia\",\"message\":\"\$moContent\",\"phone\":\"\$sourceAddress\",\"to\":\"\$destinationAddress\",\"reply_id\":\"\$moId\"}"
}
EOF
echo
