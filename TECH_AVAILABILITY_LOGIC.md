# Tech Availability & Workload Logic

## Overview
System calculates which technicians are available for specific time slots and selects the least-busy tech when multiple options exist for the same slot.

---

## Data Sources

### 1. Technician Pool (`aroFloAgent.js:TECHS`)
```javascript
plumbing: [
  { userId: "JSZKLyRRLEQgCg==", name: "Nick" },
  { userId: "IyQ6SywK",         name: "Jason" },
  { userId: "IyQ6QyYK",         name: "Rohan" }
]
electrical: [
  { userId: "JSZKKydQPEQgCg==", name: "Simon" },
  { userId: "JSZaSyNQPDQgCg==", name: "Kent" }
]
```

### 2. AroFlo Data (2 API queries)
For each tech, fetch their busy time blocks:

**Schedules Query** (`zone=schedules`)
- Scheduled jobs assigned to tech
- Fields: `startdatetime`, `enddatetime` per job
- Used to determine: **workload** (count) and **busy blocks**

**Timesheets Query** (`zone=timesheets`)
- Non-productive time entries for tech
- Filters: `type === "Non-Productive"` (leave, training, etc)
- Fields: `startdatetime`, `finishdatetime`
- Used to determine: **unavailable time blocks**

---

## Availability Calculation Algorithm

### Step 1: Fetch AroFlo Data
```javascript
// For date range (next 3 business days):
// Get all schedules where startdate >= from AND startdate <= to
// Get all timesheets where workdate >= from AND workdate <= to
```

### Step 2: For Each Technician
```javascript
const techSchedules = allSchedules.filter(
  s => s.scheduledto.scheduledtoid === tech.userId
);
// Result: list of all jobs assigned to this tech

const scheduleBusy = techSchedules.map(s => ({
  start: normaliseAroFloDate(s.startdatetime),
  end: normaliseAroFloDate(s.enddatetime)
}));
// Result: time blocks when tech is working

const techTimesheets = allTimesheets.filter(
  t => t.user.userid === tech.userId && t.type === "Non-Productive"
);
// Result: all leave/training entries

const leaveBusy = techTimesheets.map(t => ({
  start: normaliseAroFloDate(t.startdatetime),
  end: normaliseAroFloDate(t.finishdatetime)
}));
// Result: time blocks when tech is unavailable

const busyBlocks = [...scheduleBusy, ...leaveBusy];
// Combined: all time when tech cannot take new work
```

### Step 3: Calculate Free Slots for Each Tech

For each business day (skip weekends):
```javascript
// Start with full day: 7:00am - 3:00pm
let freeBlocks = [{ start: "2025-06-02 07:00:00", end: "2025-06-02 15:00:00" }];

// Get all busy blocks for THIS day
const dayBusy = busyBlocks.filter(b => b.start.startsWith("2025-06-02"));

// Subtract each busy block from free time
for (const busyBlock of dayBusy) {
  freeBlocks = subtractBlock(freeBlocks, busyBlock);
}
// Result: fragmented free time blocks for the day
```

### Step 4: Match Pre-defined Slots to Free Blocks

Predefined time slots (every day):
```javascript
const SLOT_TIMES = [
  ["07:00:00", "09:00:00"],   // 7-9am
  ["09:00:00", "11:00:00"],   // 9-11am
  ["11:00:00", "13:00:00"],   // 11am-1pm
  ["13:00:00", "15:00:00"],   // 1-3pm
];
```

For each slot:
```javascript
const slotKey = { start: "2025-06-02 07:00:00", end: "2025-06-02 09:00:00" };
const isFree = freeBlocks.some(f => 
  f.start <= slotKey.start && f.end >= slotKey.end
);
// Check if slot fits entirely within any free block
```

If slot is free, add to tech's available slots:
```javascript
availableSlots.push({
  start: "2025-06-02T07:00:00+11:00",  // ISO with timezone
  start_sydney: "2025-06-02 07:00:00",
  // ... time_period, etc
});
```

### Step 5: Collect All Techs' Slots

```javascript
const results = [];
for (const tech of techList) {
  results.push({
    tech: tech.name,
    userId: tech.userId,
    workload: techSchedules.length,  // NUMBER OF EXISTING JOBS
    availability: [
      { date: "2025-06-02", slots: [...] },
      { date: "2025-06-03", slots: [...] },
      ...
    ]
  });
}
```

---

## Slot Deduplication & Selection

### Step 6: Flatten & Sort All Slots

```javascript
// Flatten: convert from tech-organized to flat list
const allSlots = results.flatMap(r =>
  r.availability.flatMap(d =>
    d.slots.map(s => ({
      ...s,
      tech: r.tech,
      userId: r.userId,
      workload: r.workload  // Each slot carries tech's total workload
    }))
  )
);

// Sort by:
// 1. Earliest time first
// 2. Among same time, least busy tech (lowest workload)
const sorted = allSlots.sort((a, b) => {
  const timeDiff = new Date(a.start) - new Date(b.start);
  return timeDiff !== 0 ? timeDiff : a.workload - b.workload;
});
```

### Step 7: Deduplicate - Keep Only 1 Tech Per Time Slot

```javascript
const seenTimes = new Set();
const deduped = sorted.filter(s => {
  const timeKey = `${s.date}${s.start_time}${s.end_time}`;
  // Unique key: date + start time + end time
  
  if (seenTimes.has(timeKey)) {
    return false;  // Skip this slot (already have another tech for it)
  }
  
  seenTimes.add(timeKey);
  return true;  // Keep this slot (it's the first/best tech for this time)
});
```

**Result**: One slot per time window, assigned to the tech with lowest workload

---

## Example Walkthrough

**Scenario**: 3 plumbers (Nick, Jason, Rohan), June 2-4, 2025

### AroFlo Data
```
Nick:    4 scheduled jobs, 1 leave block (Wed 11am-12pm)
Jason:   2 scheduled jobs, no leave
Rohan:   3 scheduled jobs, no leave
```

### Availability Output
```
June 2 (Mon):
  7-9am:   Nick (workload=4), Jason (workload=2), Rohan (workload=3)
             → After sort: Jason, Rohan, Nick
             → Deduped: JASON ✓
  9-11am:  Nick (workload=4), Rohan (workload=3)
             → After sort: Rohan, Nick
             → Deduped: ROHAN ✓
  11am-1pm: All 3 available
             → After sort: Jason, Rohan, Nick
             → Deduped: JASON ✓
  1-3pm:   All 3 available
             → After sort: Jason, Rohan, Nick
             → Deduped: JASON ✓

June 3 (Tue):  [same logic]

June 4 (Wed):
  11am-1pm: BLOCKED for Nick (leave)
             → Available: Jason, Rohan
             → Deduped: JASON ✓
```

### Final Output to Customer
```
Available slots (1 per time, best tech):
- Monday 7-9am   (Jason)
- Monday 9-11am  (Rohan)
- Monday 11am-1pm (Jason)
- Monday 1-3pm   (Jason)
- Tuesday ...
- Wednesday ...
```

---

## Key Selection Rules

1. **Workload = Total scheduled jobs count** (not duration)
2. **Free block calculation**: Full day minus all busy blocks (jobs + leave)
3. **Slot matching**: Slot must fit entirely within a free block
4. **Sorting priority**: 
   - Time (earliest first)
   - Workload (lowest first)
5. **Deduplication**: 
   - One tech per time slot (the least-busy one)
   - Happens after sorting (so first occurrence is best)
6. **Filtering**: 
   - Exclude past times (>30min in future)
   - Exclude weekends
   - Exclude times outside 7am-3pm window

---

## Timezone Handling

- All AroFlo dates normalized to `YYYY-MM-DD HH:MM:SS` format (Sydney local)
- Timezone offset: `+11:00` (AEDT) hardcoded in output slots
- Current time check: uses `nowPlus30` (current UTC + 30min, then converted to Sydney)
- Date iteration: uses Sydney midnight as reference

---

## Data Normalization

```javascript
// AroFlo returns: "2025/06/02 14:30:00"
function normaliseAroFloDate(raw) {
  return raw.split("/").join("-");  
  // Output: "2025-06-02 14:30:00"
}

// Phone normalization
function normalisePhone(raw) {
  let p = raw.toString().replace(/[^\d]/g, "");
  if (p.startsWith("61") && p.length >= 11) p = "0" + p.slice(2);
  if (p.length === 9 && !p.startsWith("0")) p = "0" + p;
  return p;
}

// Time formatting (24hr to 12hr)
const to12hr = (hour, min) => {
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${display}${ampm}`;  // e.g., "7am", "2pm"
};
```

---

## Performance Notes

- Parallel fetch: schedules + timesheets fetched simultaneously
- Date range: hardcoded to next 3 business days only
- Memory: slots can be ~12-24 per request (4 slots × ~3 days × ~2-3 techs pre-dedup)
- No caching: fresh AroFlo data on every call

