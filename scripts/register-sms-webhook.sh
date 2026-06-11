#!/usr/bin/env bash
# Registers the Sinch MessageMedia inbound-SMS webhook pointing at /api/sms-webhook.
#
# Usage:
#   MM_API_KEY=xxx MM_API_SECRET=xxx WEBHOOK_TOKEN=xxx \
#   SITE_URL=https://plumberandelectrician.com.au \
#   ./scripts/register-sms-webhook.sh
#
# WEBHOOK_TOKEN must match the SMS_WEBHOOK_TOKEN env var set in Cloudflare Pages.
# List existing webhooks:   curl -u "$MM_API_KEY:$MM_API_SECRET" https://api.messagemedia.com/v1/webhooks/messages
# Delete a webhook:         curl -u "$MM_API_KEY:$MM_API_SECRET" -X DELETE https://api.messagemedia.com/v1/webhooks/messages/<id>
set -euo pipefail
: "${MM_API_KEY:?Set MM_API_KEY}" "${MM_API_SECRET:?Set MM_API_SECRET}"
: "${WEBHOOK_TOKEN:?Set WEBHOOK_TOKEN}" "${SITE_URL:?Set SITE_URL}"

curl -sS -X POST "https://api.messagemedia.com/v1/webhooks/messages" \
  -u "${MM_API_KEY}:${MM_API_SECRET}" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "url": "${SITE_URL}/api/sms-webhook",
  "method": "POST",
  "encoding": "JSON",
  "headers": { "X-Webhook-Token": "${WEBHOOK_TOKEN}" },
  "events": ["RECEIVED_SMS"],
  "template": "{\"provider\":\"messagemedia\",\"message\":\"\$moContent\",\"phone\":\"\$sourceAddress\",\"to\":\"\$destinationAddress\",\"reply_id\":\"\$moId\"}"
}
EOF
echo
