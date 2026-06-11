# SMS & AI Voice Booking — MVP 1 Design & Test Matrix

**Date:** 2026-06-11
**Status:** Draft for review
**Scope:** Test use cases + build/gap plan for new / modify / cancel booking across SMS and AI voice, for new and existing customers.

---

## 1. Overview

PETTR ("Plumber & Electrician To The Rescue") takes bookings via website form, SMS, and AI phone agents (Retell — inbound agent + outbound "Jess" callback agent). Bookings flow into AroFlo (field service management) via API.

This spec defines (a) the set of test use cases that prove the system works, and (b) the functionality that must be built/changed to satisfy them for **MVP 1**.

### Customer types
- **New** — phone not found in the `aroflo_clients` Firestore collection.
- **Existing** — matched by last-8-digits of phone in `aroflo_clients` (carries name, address, and a `last_jobs` summary of the last 3 jobs).

### Channels
- **Web form** — new booking only.
- **SMS** — new booking (outbound callback flow) + modify/cancel (reply to confirmation).
- **AI voice (inbound Retell agent)** — new booking + modify/cancel.

---

## 2. MVP 1 scope

### In scope
- **New booking → automated into AroFlo.** Existing behaviour retained and tested: `createClient()` (or reuse existing `clientid`), `createTask()` (COD Plumbing/Electrical), and `createScheduleEntry()` for standard slots. Gated by `APPLY_UPDATES` until production.
- **Modify / Cancel → capture + hand off to the existing team.** The agent / SMS flow detects intent, identifies the booking, captures the request, notifies the team, and acks the customer. **No automated AroFlo update/cancel write** — the team makes the change in AroFlo.
- **SMS platform migration: Kudosity/TransmitSMS → Sinch**, full replacement (send + receive), run as a **parallel** workstream.

### Out of scope (explicitly deferred)
- Automated AroFlo reschedule / cancel write path (update schedule entry, cancel task). Requires confirmed AroFlo update/delete API formats + schedulable IDs (`taskid`, `schedule_id`) not currently in `last_jobs`. **Deferred to a later MVP.**
- Customer self-serve web "manage booking" link.
- Full job-history lookup (beyond the last 3 jobs in `last_jobs`).

---

## 3. Handoff routing (modify / cancel)

The handoff mechanism is chosen by the **nature of the booking** being changed:

| Booking type | Handoff action | Customer ack |
|---|---|---|
| Standard / business-hours | **Email the team** (SMTP2GO) — actioned during business hours | "Got your request — we'll call you directly to handle it." |
| Emergency call-out ("tonight" / $549) | **Trigger an outbound call** immediately (Jess outbound or team) | "Got your request — we'll call you directly to handle it." |

In all cases a `change_requests` record is written to Firestore for tracking, and the customer receives the ack SMS.

---

## 4. Use-case test matrix

**Legend:** Customer = New / Existing. Channel = Voice (inbound AI) / SMS / Web.

### A. New booking — Inbound voice
| ID | Customer | Scenario | Expected |
|----|----------|----------|----------|
| NB-V1 | New | Standard, in-area, slot available | Books standard job, confirmation SMS, tech name included |
| NB-V2 | New | Emergency "tonight", accepts $549 | After-hours job created, "tech calls back 5–10 min", receipt SMS |
| NB-V3 | Existing | Standard | Greeted by name, address pre-filled from lookup, books |
| NB-V4 | Any | Out-of-area postcode | Politely declines, no booking |
| NB-V5 | Any | Tenant **or** appliance-specific | Team handoff (existing routing), no on-call book |
| NB-V6 | Any | No slots in next 3 business days | Falls back to team callback |
| NB-V7 | Any | Safety emergency (gas/fire/sparks) | `log_safety_emergency`, safety advice given |
| NB-V8 | Any | Declines offered slot, no alternate | Team-callback path ("we'll call 7–9:30am") |

### B. New booking — SMS (outbound callback flow)
| ID | Customer | Scenario | Expected |
|----|----------|----------|----------|
| NB-S1 | Any | STANDARD → slot offered → YES | `standard_booked`, confirmation SMS |
| NB-S2 | Any | TONIGHT → $549 confirm → YES | `emergency_booked` |
| NB-S3 | Any | STANDARD → slot offered → NO | "team will call 7–9:30am" (`standard_confirm_sent`) |
| NB-S4 | Any | TONIGHT → $549 → NO | No job created |
| NB-S5 | Any | Correction reply (wrong details) | Re-prompt for correct details |
| NB-S6 | Any | Ambiguous / unrelated reply | Clarify (Claude free-form) and re-prompt |
| NB-S7 | Existing | Recognized callback | Personalized opening |

### C. New booking — Web form
| ID | Scenario | Expected |
|----|----------|----------|
| NB-W1 | bookNow standard with slot | Task + schedule created, confirmation SMS |
| NB-W2 | bookNow tonight | Emergency task, receipt SMS |
| NB-W3 | Standard without slot selected | Validation error, blocked |
| NB-W4 | Out-of-area postcode | Blocked |
| NB-W5 | Callback request | Triggers Retell outbound + SMS flow |

### D. Modify booking — capture + handoff
| ID | Customer | Channel | Scenario | Expected |
|----|----------|---------|----------|----------|
| MB-V1 | Existing | Voice | Identified by phone, one upcoming job, wants new time | Confirms which booking, captures desired change, writes `change_requests`, routes handoff per §3, voice + SMS ack |
| MB-V2 | Existing | Voice | Multiple recent jobs | Agent disambiguates which booking, then captures |
| MB-V3 | Existing (diff number) | Voice | Not matched by phone | Captures name + booking ref, handoff |
| MB-V4 | Any | Voice | No upcoming job found | Explains, offers new booking or handoff |
| MB-S1 | Existing | SMS | Replies "can I move to Thursday?" | Intent = modify → capture + ack ("we'll call you directly") + handoff per §3 |
| MB-S2 | Existing | SMS | Reply arrives *after* booking completed | Recognized as modify (not new booking), handled |
| MB-S3 | Any | SMS | Ambiguous modify reply | Clarify before handoff |

### E. Cancel booking — capture + handoff
| ID | Customer | Channel | Scenario | Expected |
|----|----------|---------|----------|----------|
| CB-V1 | Existing | Voice | Identified, one upcoming job, wants cancel | Confirms booking, captures (optional reason), writes `change_requests`, handoff per §3, voice + SMS ack |
| CB-V2 | Existing | Voice | Multiple jobs | Disambiguate, then cancel-capture |
| CB-V3 | Existing (diff number) | Voice | Different number | Capture details, handoff |
| CB-V4 | Any | Voice | No upcoming job | Explains |
| CB-S1 | Existing | SMS | "cancel my booking" | Intent = cancel → capture + ack + handoff per §3 |
| CB-S2 | Any | SMS | Ambiguous | Clarify |

### F. Cross-cutting / non-functional
| ID | Scenario | Expected |
|----|----------|----------|
| X1 | Outbound call hits voicemail | Detected; don't book to voicemail; leave message |
| X2 | Identity = phone match; mismatched number | Capture-and-handoff path, no auto-action |
| X3 | **Sinch inbound** webhook parses (replaces Kudosity shape) | `{from, body}` mapped correctly, routes |
| X4 | **Sinch outbound** send delivers (replaces TransmitSMS) | Message sent from correct sender/number |
| X5 | `APPLY_UPDATES` sandbox vs live | Writes (incl. handoff record) gated when false |
| X6 | Timezone AEDT/AEST | Slots + confirmations show correct local time year-round |
| X7 | Duplicate/echoed inbound SMS | De-duplicated, processed once |
| X8 | Stale `booking_flows` state | Expires / handled gracefully |
| X9 | Customer texts while outbound call in progress | No double-handling / race |
| X10 | Handoff notification reaches team | Team receives the change/cancel request (email or outbound call per §3) |

---

## 5. Build / gap plan

For each workstream: what exists vs. what is net-new for MVP 1.

### WS1 — Sinch SMS migration (parallel, P0)
- Outbound send adapter: replace TransmitSMS `send-sms.json` with Sinch send API. Wrap behind a single `sendSMS()` interface so flow code stays platform-agnostic.
- Inbound webhook: new parser for Sinch's payload shape → map to `{from, body}` (today's handler expects Kudosity `SMS_INBOUND` / `mo.message` / `mo.sender`).
- Secrets/config: Sinch service plan ID, API token, sender number in Secret Manager + `wrangler.toml`.
- Number alignment: the Sinch number used to *send* confirmations must be the one customers *reply* to, so replies route into the inbound webhook.
- Cutover: parallel-run + switch.

### WS2 — Intent detection / router (P0)
- **SMS:** add an intent classifier for inbound messages **not** in a known `booking_flows` step — classify `{new_booking, modify, cancel, question}`. Replies arriving *after* a booking completed (`standard_booked`/`emergency_booked`) must route to modify/cancel, not fall through to free-form.
- **Voice:** add modify/cancel intent branches to the inbound Jess agent.

### WS3 — Existing-booking lookup (read-only, P0)
- Reuse `aroflo_clients.last_jobs` (jobnumber, description, status, date, tasktype) for "your recent bookings by phone."
- Add disambiguation when >1 recent job; filter by status to "upcoming/open."
- **Risk:** `last_jobs` is capped at 3 and lacks scheduled date/time — fine for *identifying* a booking to hand off; insufficient for any future auto-reschedule (would need sync enrichment or on-demand AroFlo GET). Out of MVP 1.

### WS4 — Capture + handoff (P0)
- New Firestore collection `change_requests`: `{phone, name, clientid, jobnumber, type: modify|cancel, requestedChange, channel, bookingType: standard|emergency, status: pending, createdAt}`.
- Routing per §3: standard → email team (SMTP2GO); emergency → trigger outbound call.
- Customer ack SMS: "Got your request — we'll call you directly to handle it."

### WS5 — Voice agent: modify/cancel (P0)
- Update inbound Jess prompt (`Jess_Prompt.md` / `setup_retell.js`) with modify/cancel flows: identify caller (`lookup_caller` exists) → confirm which booking → capture change → call new tool → confirm handoff.
- New Retell tools: `capture_modify_request`, `capture_cancel_request` (and possibly `lookup_customer_bookings`).

### WS6 — SMS modify → outbound callback (P1)
- When SMS intent = modify/cancel on an emergency booking, trigger an outbound Jess call (reuse `triggerRetellCallback`) with a "handle a change request" prompt variant, plus capture/ack.

### WS7 — Cross-cutting fixes (P1)
- **Timezone:** replace hardcoded `+11:00` with proper AEDT/AEST handling (affects X6 and many slot/confirmation cases).
- **Voicemail detection** on outbound (X1) — still not built.
- **Inbound dedup / idempotency** (X7) and `booking_flows` expiry (X8).

### WS8 — Test harness / sandbox (P1)
- Keep `APPLY_UPDATES=false` gating; extend to gate handoff writes.
- Build canned webhook payloads (Sinch inbound, Retell function-call) + Retell test calls to execute the matrix; later promote to automated scripts.

### Suggested MVP 1 priority
WS1, WS2, WS3, WS4, WS5 are the must-haves to make the matrix pass. WS6–WS8 are fast-follow.

---

## 6. Key references (current code)

- `aroFloAgent.js` — AroFlo auth/create/lookup, slot availability, Retell function handler, inbound webhook. (Mirrored in both repos; `APPLY_UPDATES` flag.)
- `functions/api/quote.js` — web form handler (bookNow + callback), triggers Retell outbound.
- `functions/api/sms-webhook.js` — inbound SMS handler, `booking_flows` state machine, TransmitSMS sender.
- `pettrDashboards/functions/aroFloClientSync.js` — 5-min sync of AroFlo clients + last 3 tasks → `aroflo_clients`.
- `pettrDashboards/functions/Jess_Prompt.md`, `data/setup_retell.js` — inbound agent prompt + tool config.
- `RETELL_OUTBOUND_PROMPT.md` — outbound Jess callback prompt.
- `SCHEDULING_LOGIC.md`, `TECH_AVAILABILITY_LOGIC.md` — slot/availability algorithm.

---

## 7. Open items / risks

- **`last_jobs` sufficiency** for identifying the right booking when a customer has multiple recent jobs (only 3 retained, no scheduled date). May need disambiguation prompts.
- **Sinch payload shapes** (send + inbound webhook) need to be confirmed against Sinch docs/account.
- **Timezone** bug is latent across all slot/confirmation flows — should be fixed alongside this work.
- **Voicemail detection** on outbound calls still unbuilt — affects emergency-handoff reliability (X1, WS6).
