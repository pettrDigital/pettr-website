// Unit tests for send-sms.js pure helpers (ESM). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  twoHourWindow, composeChangeRequestAck, changeRequestSubject, customerEmailSubject,
  escapeHtml, transcriptHtml,
} from "../../functions/api/send-sms.js";

test("twoHourWindow", () => {
  assert.equal(twoHourWindow("07:00"), "07:00-09:00");
  assert.equal(twoHourWindow("9:00"), "09:00-11:00");
  assert.equal(twoHourWindow("23:00"), "23:00-01:00"); // wrap
  assert.equal(twoHourWindow(""), "");
  assert.equal(twoHourWindow("abc"), "abc");
});

test("composeChangeRequestAck — enquiry returns null", () => {
  assert.equal(composeChangeRequestAck({ type: "enquiry", name: "Sam" }), null);
});

test("composeChangeRequestAck — cancel", () => {
  const m = composeChangeRequestAck({ type: "cancel", name: "Sam Smith", jobReference: "143" });
  assert.match(m, /^Job Number: 143/);
  assert.match(m, /Hi Sam, your cancellation request is in/);
  assert.match(m, /The team will remove the booking/);
});

test("composeChangeRequestAck — reschedule leads with requested time", () => {
  const m = composeChangeRequestAck({ type: "reschedule", name: "Sam", jobReference: "143", preferredDate: "2026-06-16", preferredTime: "09:00" });
  assert.match(m, /your reschedule request is in/);
  assert.match(m, /Time: .*09:00-11:00/);
  assert.match(m, /confirm your new time shortly/);
});

test("composeChangeRequestAck — missing name → 'there'", () => {
  assert.match(composeChangeRequestAck({ type: "cancel" }), /Hi there,/);
});

test("changeRequestSubject", () => {
  assert.equal(changeRequestSubject({ type: "cancel", jobReference: "143", name: "Sam" }), "Job Cancelled: 143 - Sam");
  assert.equal(changeRequestSubject({ type: "reschedule", jobReference: "143", name: "Sam" }), "Job Rescheduled: 143 - Sam");
  assert.equal(changeRequestSubject({ type: "cancel", name: "Sam" }), "Cancellation Request - Sam");
  assert.equal(changeRequestSubject({ type: "enquiry", phone: "0420994836" }), "Enquiry/Other - 0420994836");
  assert.equal(changeRequestSubject({ type: "enquiry" }), "Enquiry/Other - Unknown");
});

test("customerEmailSubject", () => {
  assert.match(customerEmailSubject({ type: "reschedule" }), /reschedule request/);
  assert.match(customerEmailSubject({ type: "cancel" }), /cancellation/);
  assert.match(customerEmailSubject({ type: "enquiry" }), /enquiry/);
});

test("escapeHtml / transcriptHtml", () => {
  assert.equal(escapeHtml(`a&b<c>"d'`), "a&amp;b&lt;c&gt;&quot;d&#039;");
  assert.equal(transcriptHtml(""), "");
  const h = transcriptHtml("hi <script>");
  assert.match(h, /Call transcript/);
  assert.match(h, /&lt;script&gt;/);
});
