# SMS & AI Voice Booking — Test Use Cases

**Date:** 2026-06-11
**Companion doc:** `SMS_VOICE_BOOKING_MVP1.md` (design & build plan)
**Purpose:** Executable test matrix to verify new / modify / cancel booking across SMS and AI voice, for new and existing customers.

## How to use this doc
- Run each case against the **sandbox** first (`APPLY_UPDATES=false` — writes are logged, not committed), then re-run the critical paths live.
- **Customer:** New = phone NOT in `aroflo_clients`. Existing = phone matched in `aroflo_clients` (has name/address + `last_jobs`).
- Fill the **Status** column: ✅ pass / ❌ fail / ⏭️ skipped / 🚧 blocked. Note the actual result and any defect ID.
- Test phone numbers: use dedicated test mobiles so `aroflo_clients` lookups behave as intended (one "new", one "existing").

**Scope reminder (MVP 1):** New booking = automated into AroFlo. Modify/Cancel = capture + handoff to team (NO automated AroFlo change). See design doc §2.

---

## A. New booking — Inbound AI voice

| ID | Customer | Preconditions | Steps / input | Expected result | Status |
|----|----------|---------------|---------------|-----------------|--------|
| NB-V1 | New | In-area postcode; tech slot available | Call agent → plumbing issue → standard hours → accept first offered slot → confirm name spelling | AroFlo client + task + schedule created; confirmation SMS sent incl. tech name | |
| NB-V2 | New | In-area | Call → urgent issue → "tonight" → accept $549 fee → confirm name | After-hours task created (no slot); agent says tech calls back 5–10 min; receipt SMS sent | |
| NB-V3 | Existing | Phone in `aroflo_clients` | Call from known number → standard booking | Agent greets by name, address pre-filled from lookup; reuses existing `clientid`; books | |
| NB-V4 | Any | — | Call → give out-of-area postcode | Agent politely declines / explains out of area; NO booking created | |
| NB-V5 | Any | In-area | Call → say "I'm a tenant" OR appliance-specific issue | Routed to team handoff (per existing routing); no on-call slot booked | |
| NB-V6 | Any | In-area; all techs full next 3 business days | Call → standard → request slot | Agent reports no slots; falls back to team callback path | |
| NB-V7 | Any | — | Call → mention gas smell / fire / sparks | `log_safety_emergency` fires; agent gives safety advice (e.g. evacuate / call 000) | |
| NB-V8 | Any | In-area; slot offered | Call → standard → decline offered slot, give no alternate | Team-callback path ("we'll call 7–9:30am tomorrow") | |

## B. New booking — SMS (outbound callback flow)

| ID | Customer | Preconditions | Steps / input | Expected result | Status |
|----|----------|---------------|---------------|-----------------|--------|
| NB-S1 | Any | Callback submitted; `message_1_sent` | Reply "STANDARD" → receive slot → reply "YES" | Standard job created with slot; state → `standard_booked`; confirmation SMS | |
| NB-S2 | Any | `message_1_sent` | Reply "TONIGHT" → receive $549 confirm → reply "YES" | Emergency job created; state → `emergency_booked` | |
| NB-S3 | Any | Slot offered (`standard_slots_offered`) | Reply "NO" | "Team will call 7–9:30am" message; state → `standard_confirm_sent`; no locked slot | |
| NB-S4 | Any | `emergency_confirm_sent` | Reply "NO" to $549 fee | No job created | |
| NB-S5 | Any | `message_1_sent` | Reply with corrected details (e.g. different address) | Re-prompt to confirm correct details, then continue | |
| NB-S6 | Any | Any flow step | Reply with unrelated / ambiguous text | Claude free-form clarifies and re-prompts for TONIGHT/STANDARD | |
| NB-S7 | Existing | Phone in `aroflo_clients` | Trigger callback for known customer | Opening SMS is personalized (name) | |

## C. New booking — Web form

| ID | Preconditions | Steps / input | Expected result | Status |
|----|---------------|---------------|-----------------|--------|
| NB-W1 | In-area | Submit bookNow, standard urgency, slot selected | AroFlo task + schedule created; confirmation SMS with slot | |
| NB-W2 | In-area | Submit bookNow, "tonight" urgency | Emergency task created; receipt SMS | |
| NB-W3 | In-area | Submit standard urgency with NO slot selected | Validation error; submission blocked | |
| NB-W4 | — | Submit with out-of-area postcode | Blocked at service-area validation | |
| NB-W5 | In-area | Submit "callback" request | Retell outbound call triggered + SMS flow starts | |

## D. Modify booking — capture + handoff (MVP 1: no AroFlo change)

| ID | Customer | Channel | Preconditions | Steps / input | Expected result | Status |
|----|----------|---------|---------------|---------------|-----------------|--------|
| MB-V1 | Existing | Voice | One upcoming job in `last_jobs` | Call → "I need to move my booking" → give new preferred time | Agent confirms which booking, captures change; `change_requests` written; handoff per design §3; voice + SMS ack | |
| MB-V2 | Existing | Voice | >1 recent job | Call → "change my booking" | Agent disambiguates which job, then captures | |
| MB-V3 | Existing (calling from different number) | Voice | Phone not matched | Call → "change my booking" | Agent captures name + booking ref; handoff (no auto-action) | |
| MB-V4 | Any | Voice | No upcoming job found | Call → "change my booking" | Agent explains none found; offers new booking or handoff | |
| MB-S1 | Existing | SMS | Standard booking confirmed | Reply "can I move to Thursday?" | Intent = modify; `change_requests` written; ack "we'll call you directly"; email to team (standard booking) | |
| MB-S1e | Existing | SMS | **Emergency** booking confirmed | Reply "can you push back the visit?" | Intent = modify; ack; **outbound call triggered** (emergency routing) | |
| MB-S2 | Existing | SMS | Booking already completed (`standard_booked`) | Reply about changing | Recognized as modify (NOT new booking); captured | |
| MB-S3 | Any | SMS | — | Reply with ambiguous modify text | Clarify before handoff | |

## E. Cancel booking — capture + handoff (MVP 1: no AroFlo change)

| ID | Customer | Channel | Preconditions | Steps / input | Expected result | Status |
|----|----------|---------|---------------|---------------|-----------------|--------|
| CB-V1 | Existing | Voice | One upcoming job | Call → "cancel my booking" | Agent confirms booking, captures (optional reason); `change_requests` written; handoff per §3; voice + SMS ack | |
| CB-V2 | Existing | Voice | >1 recent job | Call → "cancel my booking" | Disambiguate, then capture cancel | |
| CB-V3 | Existing (different number) | Voice | Phone not matched | Call → "cancel" | Capture details; handoff | |
| CB-V4 | Any | Voice | No upcoming job | Call → "cancel" | Agent explains none found | |
| CB-S1 | Existing | SMS | Standard booking | Reply "cancel my booking" | Intent = cancel; ack; email to team | |
| CB-S1e | Existing | SMS | **Emergency** booking | Reply "cancel the callout" | Intent = cancel; ack; **outbound call triggered** | |
| CB-S2 | Any | SMS | — | Reply with ambiguous cancel text | Clarify before handoff | |

## F. Cross-cutting / non-functional

| ID | Scenario | Steps / input | Expected result | Status |
|----|----------|---------------|-----------------|--------|
| X1 | Outbound call → voicemail | Trigger outbound call to a number that goes to voicemail | Voicemail detected; does NOT book to voicemail; leaves message | |
| X2 | Identity via phone match | Modify/cancel from a number not matching the booking | Capture-and-handoff path only; no auto-action | |
| X3 | Sinch inbound webhook | Send a Sinch-formatted inbound payload | Parsed to `{from, body}`; routed correctly (replaces Kudosity shape) | |
| X4 | Sinch outbound send | Trigger any outbound SMS | Delivered from correct Sinch sender/number | |
| X5 | APPLY_UPDATES gating | Run a booking with `APPLY_UPDATES=false` | All AroFlo writes AND handoff writes logged only, not committed | |
| X6 | Timezone AEDT/AEST | Fetch slots / send confirmation across the DST boundary | Times shown in correct Sydney local time year-round | |
| X7 | Duplicate inbound SMS | Deliver the same inbound message twice | Processed once (de-duplicated) | |
| X8 | Stale booking_flows | Reply to a very old/expired flow | Handled gracefully (expired / restart) | |
| X9 | Concurrent text + call | Customer texts while outbound call is in progress | No double-handling / race | |
| X10 | Handoff reaches team | Complete a modify/cancel handoff | Team actually receives it: email (standard) or outbound call (emergency); `change_requests` record present | |

---

## Coverage summary

| Area | Cases |
|------|-------|
| New booking — voice | NB-V1…NB-V8 |
| New booking — SMS | NB-S1…NB-S7 |
| New booking — web | NB-W1…NB-W5 |
| Modify — voice/SMS | MB-V1…MB-V4, MB-S1, MB-S1e, MB-S2, MB-S3 |
| Cancel — voice/SMS | CB-V1…CB-V4, CB-S1, CB-S1e, CB-S2 |
| Cross-cutting | X1…X10 |
