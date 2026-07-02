// Unit tests for pettrWebsite/functions/lib/sms.js (ESM). No network — global fetch is stubbed.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, toE164, composeBookingConfirmation, sendSMS } from "../../functions/lib/sms.js";

test("normalizePhone", () => {
  assert.equal(normalizePhone("0420994836"), "0420994836");
  assert.equal(normalizePhone("+61420994836"), "0420994836");
  assert.equal(normalizePhone("61420994836"), "0420994836");
  assert.equal(normalizePhone("0061420994836"), "0420994836");
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone("123"), "");
});

test("toE164", () => {
  assert.equal(toE164("0420994836"), "+61420994836");
  assert.equal(toE164("0420 994 836"), "+61420994836");
  assert.equal(toE164(""), "");
});

test("composeBookingConfirmation — after-hours", () => {
  const msg = composeBookingConfirmation({ name: "Sam", trade: "plumbing", address: "1 St", suburb: "Bondi", postcode: "2026", urgency: "emergency", jobNumber: "143055" });
  assert.match(msg, /Job Number: 143055/);
  assert.match(msg, /after-hours plumbing booking/);
  assert.match(msg, /call you back within 5-10 minutes/);
});

test("composeBookingConfirmation — standard with slot", () => {
  const msg = composeBookingConfirmation({ name: "Sam", trade: "electrical", address: "1 St", suburb: "Bondi", postcode: "2026", issue: "no power", day: "Tuesday", startTime: "07:00", endTime: "09:00", tech: "Nick", jobNumber: "143056" });
  assert.match(msg, /your electrical booking is confirmed/);
  assert.match(msg, /Tuesday 07:00-09:00/);
  // The tech name is intentionally NOT shown to the customer (overflow safety —
  // the "tech" may be the Jess AI placeholder). Passing tech is ignored.
  assert.doesNotMatch(msg, /Nick/);
  assert.match(msg, /Tech will call 30min before arrival/);
});

test("composeBookingConfirmation — standard, no slot → team will call, no job number lead", () => {
  const msg = composeBookingConfirmation({ name: "Sam", trade: "plumbing", address: "1 St", suburb: "Bondi", postcode: "2026", issue: "leak" });
  assert.match(msg, /to be confirmed - the team will call between 7-9:30am/);
  assert.doesNotMatch(msg, /^Job Number:/);
});

test("sendSMS — sends a plain SMS via MessageMedia (SMS-only; MMS removed)", async () => {
  const calls = [];
  mock.method(globalThis, "fetch", async (url, opts) => {
    calls.push(JSON.parse(opts.body).messages[0]);
    return { ok: true, status: 200, text: async () => '{"ok":true}' };
  });
  const env = { MESSAGEMEDIA_API_KEY: "k", MESSAGEMEDIA_API_SECRET: "s", NOTIFY_TEST_MODE: "false" };
  await sendSMS(env, { phone: "0420994836", message: "hi" });
  mock.restoreAll();
  assert.equal(calls.length, 1, "one SMS send, no MMS attempt");
  assert.equal(calls[0].format, "SMS");
  assert.equal(calls[0].media, undefined);
});
