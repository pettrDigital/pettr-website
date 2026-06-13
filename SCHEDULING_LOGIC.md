# Scheduling Logic Summary

## Overview
The PETTR booking system orchestrates job scheduling across two pathways: **instant web bookings** and **outbound SMS callback flows**. All scheduling data flows through **AroFlo** (field service management system) which maintains technician availability.

---

## Core Components

### 1. **Slot Availability** (`aroFloAgent.js:getAvailableSlots`)
- **Input**: Trade type (`plumbing` or `electrical`)
- **Process**:
  - Fetches next 3 business days from AroFlo
  - Queries each technician's schedules and timesheets (non-productive time/leave)
  - Builds 4 pre-defined time slots per day: 7-9am, 9-11am, 11am-1pm, 1-3pm
  - Subtracts busy blocks to find free slots
  - Deduplicates by time (shows only 1 slot per time, picks least busy tech)
  - Filters out slots within 30min of current time
  - Returns slots sorted by earliest time first, then by tech workload
- **Output**: Array of slots with day, start_time, end_time, start_time_12, end_time_12, time_period

### 2. **Instant Web Bookings** (`quote.js:onRequest`)
**Triggered by**: Web form with service type, urgency, appliance, ownership

**Two urgency paths**:

#### a) **Emergency "Tonight" Booking**
- No time slot required
- $549 call-out fee (includes 30min labour)
- Tech calls customer back within 5-10 minutes
- SMS receipt sent immediately
- Support email notifies internal team
- Job tagged as "emergency"

#### b) **Standard Business Hours Booking**
- Requires selecting a time slot from available options
- FREE call-out and quote
- Tech calls 30min before arrival
- SMS confirmation sent with slot details
- Support email notifies internal team with slot info
- Job tagged with scheduled date/time

**Validation**:
- Postcode must be in Sydney service area
- Email required for all bookings
- Time slot mandatory for standard urgency

---

## 3. **Outbound Callback Flow** (`quote.js` + `sms-webhook.js`)

### Trigger
When customer submits "callback" request form:
1. Retell AI agent is triggered via phone call
2. Initiates multi-step SMS conversation flow
3. System manages state via Firebase `booking_flows` collection

### Flow Steps

```
Initial Callback Request
    ↓
Retell Outbound Call Triggered
    ↓
[message_1_sent]
    Customer receives: "Is it TONIGHT (emergency) or STANDARD business hours?"
    Customer replies with one of: TONIGHT, STANDARD, or corrections
    ↓
    IF TONIGHT:
        [emergency_confirm_sent]
        → "After-hours booking confirmed. Tech will call back within 5-10 mins. Call-out fee $549. Confirm? YES/NO"
        → IF YES: Job created, transition to [emergency_booked]
        → IF NO: No action
    ↓
    IF STANDARD:
        [standard_slots_offered]
        → Fetch available slots
        → Send first slot: "${day} ${start_time}-${end_time} - available? Reply YES or give alternate time"
        → IF YES: Job created with selected slot, transition to [standard_booked]
        → IF NO: Send "The team will call between 7-9:30am tomorrow to find a time that suits you"
    ↓
    IF corrections/other:
        → "Thanks for letting us know. Please reply with the correct details and reply TONIGHT or STANDARD when ready."
```

### State Management
- Each phone number has a `booking_flows` document in Firebase tracking current step
- Steps: `message_1_sent`, `emergency_confirm_sent`, `standard_slots_offered`, `emergency_booked`, `standard_booked`, `standard_confirm_sent`
- Each step can store metadata (e.g., `selectedSlot` JSON for standard bookings)

---

## 4. **Job Creation in AroFlo**

### After-Hours Job (`aroFloAgent.js:createTask`)
- Client lookup or creation
- Task type: "COD Emergency" (Callout of Duty)
- Notes include:
  - Caller name/phone
  - After-hours flag and $549 fee acceptance
  - Issue description
- No scheduled date/time (immediate dispatch)

### Standard Job (`aroFloAgent.js:createTask`)
- Client lookup or creation
- Task type: "COD Plumbing" or "COD Electrical"
- Notes with caller/phone/issue
- **Scheduled date and time** set from booking
- System expects team to call 7-9:30am if no time locked

### Client Lookup
- Queries Firestore `aroflo_clients` collection
- Matches by last 8 digits of phone (mobile or home)
- Returns existing client data or creates new client

---

## 5. **Service Area Validation**
- Hardcoded Sydney postcode set (SYDNEY_POSTCODES)
- Covers: CBD, Inner West, North Shore, Hills, South, South-West, Western Sydney
- Total ~200+ postcodes
- Used in both web form and Retell agent checks

---

## 6. **Communication Channels**

### SMS (Transmit SMS API)
- **Sender ID**: "PETTR"
- **Instant booking receipts**: Sent immediately after booking submission
- **Outbound flow**: Multi-message conversation for callbacks
- **Format**: Brief, SMS-friendly text (1-2 sentences)

### Email (SMTP2GO)
- **To**: fergusg@mrwasher.com.au (internal team)
- **Sent for**: 
  - Instant bookings (with slot details if standard)
  - Booking confirmations after SMS flow completion
- **Content**: Customer details, issue, service type, slot info, SMS conversation transcript

### Voice (Retell AI)
- **Outbound calls** for quote callbacks
- **Inbound webhook** lookup (pre-call) to populate agent context
- **Dynamic variables** passed: name, address, postcode, phone, existing customer flag
- **Functions available to agent**:
  - `get_available_slots` - fetch slots for trade
  - `create_afterhours_job` - emergency booking
  - `create_standard_job` - standard booking
  - `check_service_area` - validate postcode

---

## 7. **Key Data Flows**

### Web Booking → Job Creation
```
Web Form Submit (quote.js)
    → Validate service area postcode
    → IF instant booking:
        → Determine urgency (tonight vs standard)
        → IF standard: ensure slot selected
        → Send SMS receipt/confirmation
        → Send email to internal team
        → ✓ Done (job created separately in manual process or callback)
    → IF callback: Trigger Retell outbound call
```

### SMS Inbound → State Management
```
SMS Webhook (sms-webhook.js:handleOutboundBookingFlow)
    → Get current booking_flows step from Firebase
    → Process response based on step
    → Update step to next stage
    → Send next SMS prompt or job creation
```

### Slot Fetching → Display
```
Frontend calls /api/slots POST with {trade}
    → Cloudflare Worker calls aroFloAgent function
    → Fetches AroFlo schedules + timesheets
    → Deduplicates by time slot
    → Returns slots array
    → Frontend displays in picker UI
```

---

## 8. **Tech Assignment & Workload**

### Technician Pool
```javascript
plumbing: [
  { userId: "JSZKLyRRLEQgCg==", name: "Nick" },
  { userId: "IyQ6SywK", name: "Jason" },
  { userId: "IyQ6QyYK", name: "Rohan" }
]
electrical: [
  { userId: "JSZKKydQPEQgCg==", name: "Simon" },
  { userId: "JSZaSyNQPDQgCg==", name: "Kent" }
]
```

### Slot Selection Logic
1. Get all techs' schedules + leave
2. For each tech, calculate free blocks per day
3. For each time slot, check if fully free
4. Build availability per tech
5. Flatten all slots, sort by:
   - Earliest time first
   - Then least busy tech (fewest scheduled jobs)
6. Deduplicate: keep first occurrence of each time slot (best tech)

---

## 9. **Safety & Guardrails**

### APPLY_UPDATES Flag
- `aroFloAgent.js` has `APPLY_UPDATES = false` by default
- When false: all AroFlo POST operations (client/task creation) are **blocked and logged only**
- Prevents accidental production writes during testing
- Set to `true` to go live

### Timezone Handling
- Australia/Sydney timezone used throughout
- Offset: AEDT (+11:00) hardcoded (change to +10:00 for AEST Apr-Oct)
- Filters today+30min future slots

### Error Handling
- All fetch errors return graceful responses (no job created)
- SMS failures logged but don't block flow
- Firebase failures don't prevent job creation attempts
- Firestore 404 handled as "no previous booking"

---

## 10. **Firebase Collections**

### `conversations/{phone}`
- Message history (role, text, timestamp)
- Customer details (name, address, problem, trade)
- Used for SMS-based booking conversations

### `booking_flows/{phone}`
- Current step in outbound callback flow
- Selected slot (for standard bookings)
- lastUpdated timestamp

### `aroflo_clients`
- Firestore cache of AroFlo clients
- Fields: clientid, firstname, surname, mobile_digits, phone_digits, address, archived
- Used for fast phone lookups before outbound calls

---

## 11. **Future Considerations**

- **Rebooking**: Customers can modify slots via SMS reply (not fully implemented)
- **Manual timezone override**: Currently hardcoded to AEDT
- **Multiple techs per slot**: Deduplication shows only best tech; could show alternatives
- **Cancellation**: No built-in SMS cancellation flow yet
- **Integration testing**: APPLY_UPDATES=false prevents end-to-end testing

