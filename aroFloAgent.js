"use strict";

// ============================================================
// aroFloAgent.js
// Retell AI webhook handler for Jess — virtual receptionist
// Handles: inbound webhook lookup, slot availability, job creation
//
// ⚠️  PRODUCTION SAFETY FLAG
//     APPLY_UPDATES = false  →  ALL AroFlo POST calls are
//     BLOCKED and logged only. Set to true when ready to go live.
// ============================================================

const APPLY_UPDATES = false;

const CryptoJS = require("crypto-js");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) admin.initializeApp();
const db = getFirestore();
const secretClient = new SecretManagerServiceClient();

// ====================== SECRETS ======================

async function getSecret(name) {
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/pettrdashboards/secrets/${name}/versions/latest`,
  });
  return version.payload.data.toString("utf8").trim();
}

// ====================== AROFLO AUTH ======================

async function aroFloAuth(method, varString) {
  const [uEncoded, pEncoded, orgEncoded, secretKey] = await Promise.all([
    getSecret("AROFLO_UENCODED"),
    getSecret("AROFLO_PENCODED"),
    getSecret("AROFLO_ORGENCODED"),
    getSecret("AROFLO_SECRET_KEY"),
  ]);

  const isoTimestamp = new Date().toISOString();
  const accept = "application/json";
  const authorization =
    "uencoded=" + encodeURIComponent(uEncoded) +
    "&pencoded=" + encodeURIComponent(pEncoded) +
    "&orgEncoded=" + encodeURIComponent(orgEncoded);

  const payload = [method, "", accept, authorization, isoTimestamp, varString];
  const hash = CryptoJS.HmacSHA512(payload.join("+"), secretKey);

  return { hmac: hash.toString(), authorization, timestamp: isoTimestamp, accept };
}

const AROFLO_BASE = "https://api.aroflo.com/";

async function aroFloGet(varString) {
  const auth = await aroFloAuth("GET", varString);
  const res = await fetch(`${AROFLO_BASE}?${varString}`, {
    method: "GET",
    headers: {
      Authentication: `HMAC ${auth.hmac}`,
      Authorization: auth.authorization,
      Accept: auth.accept,
      afdatetimeutc: auth.timestamp,
    },
  });
  const rawText = await res.text();
  if (!res.ok) throw new Error(`AroFlo GET error ${res.status}: ${rawText}`);
  try {
    return JSON.parse(rawText);
  } catch (e) {
    throw new Error(`AroFlo response was not JSON: ${rawText.slice(0, 200)}`);
  }
}

async function aroFloPost(zone, payload) {
  const varString = `zone=${encodeURIComponent(zone)}`;

  if (!APPLY_UPDATES) {
    console.log(`[APPLY_UPDATES=false] BLOCKED POST zone=${zone}`, JSON.stringify(payload, null, 2));
    return { blocked: true, reason: "APPLY_UPDATES is false", zone, payload };
  }

  const auth = await aroFloAuth("POST", varString);
  const res = await fetch(`${AROFLO_BASE}?${varString}`, {
    method: "POST",
    headers: {
      Authentication: `HMAC ${auth.hmac}`,
      Authorization: auth.authorization,
      Accept: auth.accept,
      afdatetimeutc: auth.timestamp,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AroFlo POST error ${res.status}: ${text}`);
  }
  return res.json();
}

// ====================== PHONE NORMALISATION ======================

function normalisePhone(raw) {
  if (!raw) return "";
  let p = raw.toString().replace(/[^\d]/g, "");
  if (p.startsWith("61") && p.length >= 11) p = "0" + p.slice(2);
  if (p.length === 9 && !p.startsWith("0")) p = "0" + p;
  return p.length >= 9 ? p : "";
}

// ====================== SERVICE AREA ======================

const SYDNEY_POSTCODES = new Set([
  // Sydney CBD & Inner
  2000, 2001, 2002, 2003, 2004, 2006, 2007, 2008, 2009, 2010, 2011, 2015, 2016, 2017, 2018, 2019, 2020, 2021,
  // Inner West
  2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039,
  2040, 2041, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049, 2050,
  // North Shore / Northern Beaches
  2060, 2061, 2062, 2063, 2064, 2065, 2066, 2067, 2068, 2069, 2070, 2071, 2072, 2073, 2074, 2075, 2076, 2077,
  2079, 2080, 2081, 2082, 2083, 2084, 2085, 2086, 2087, 2088, 2089, 2090, 2092, 2093, 2094, 2095, 2096, 2097,
  2098, 2099, 2100, 2101, 2102, 2103, 2104, 2105, 2106, 2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114, 2115,
  2116, 2117, 2118, 2119, 2120, 2121, 2122, 2123,
  // Hills / Hawkesbury
  2124, 2125, 2126, 2127, 2128, 2129, 2130, 2131, 2132, 2133, 2134, 2135, 2136, 2137, 2138, 2139, 2140, 2141,
  2142, 2143, 2144, 2145, 2146, 2147, 2148, 2150, 2151, 2152, 2153, 2154, 2155, 2156, 2157, 2158, 2159, 2160,
  2161, 2162, 2163, 2164, 2165, 2166, 2167, 2168, 2170, 2171, 2172, 2173, 2174, 2175, 2176, 2177, 2178, 2179,
  // South / Sutherland Shire
  2190, 2191, 2192, 2193, 2194, 2195, 2196, 2197, 2198, 2199, 2200, 2203, 2204, 2205, 2206, 2207, 2208, 2209,
  2210, 2211, 2212, 2213, 2214, 2216, 2217, 2218, 2219, 2220, 2221, 2222, 2223, 2224, 2225, 2226, 2227, 2228,
  2229, 2230, 2231, 2232, 2233, 2234, 2560, 2563, 2564, 2565, 2566, 2567, 2568, 2569, 2570,
  // Western Sydney / Parramatta / Penrith
  2745, 2747, 2748, 2749, 2750, 2751, 2752, 2753, 2754, 2755, 2756, 2757, 2758, 2759, 2760, 2761, 2762, 2763,
  2765, 2766, 2767, 2768, 2769, 2770, 2773, 2774, 2775, 2776, 2777, 2778, 2779, 2780, 2782, 2783, 2784, 2785,
  2786, 2787, 2790,
  // South-West / Campbelltown / Liverpool
  2557, 2558, 2559, 2561, 2562, 2571, 2572, 2573, 2574, 2575, 2576,
]);

function isInServiceArea(postcodeRaw) {
  const pc = parseInt(String(postcodeRaw).replace(/\D/g, ""), 10);
  return !isNaN(pc) && SYDNEY_POSTCODES.has(pc);
}

// ====================== TECH CONFIG ======================

const TECHS = {
  plumbing: [
    { userId: "JSZKLyRRLEQgCg==", name: "Nick" },
    { userId: "IyQ6SywK",         name: "Jason" },
    { userId: "IyQ6QyYK",         name: "Rohan" },
  ],
  electrical: [
    { userId: "JSZKKydQPEQgCg==", name: "Simon" },
    { userId: "JSZaSyNQPDQgCg==", name: "Kent" },
  ],
};

// ====================== FIRESTORE CLIENT LOOKUP ======================

async function lookupClientByPhone(rawPhone) {
  const phone = normalisePhone(rawPhone);
  if (!phone) return null;
  const last8 = phone.slice(-8);
  if (!last8) return null;

  try {
    console.log(`[lookupClientByPhone] querying for mobile_digits="${last8}"`);
    let snap = await db.collection("aroflo_clients")
      .where("mobile_digits", "==", last8)
      .where("archived", "==", false)
      .limit(1)
      .get();

    if (snap.empty) {
      snap = await db.collection("aroflo_clients")
        .where("phone_digits", "==", last8)
        .where("archived", "==", false)
        .limit(1)
        .get();
    }

    if (snap.empty) return null;
    return snap.docs[0].data();
  } catch (err) {
    console.error("[lookupClientByPhone] Firestore error:", err.message);
    return null;
  }
}

// ====================== AVAILABILITY ======================

const SLOT_TIMES = [
  ["07:00:00", "09:00:00"],
  ["09:00:00", "11:00:00"],
  ["11:00:00", "13:00:00"],
  ["13:00:00", "15:00:00"],
];

function subtractBlock(freeBlocks, busyBlock) {
  const result = [];
  for (const f of freeBlocks) {
    if (busyBlock.end <= f.start || busyBlock.start >= f.end) {
      result.push(f);
      continue;
    }
    if (busyBlock.start > f.start) result.push({ start: f.start, end: busyBlock.start });
    if (busyBlock.end < f.end)   result.push({ start: busyBlock.end, end: f.end });
  }
  return result;
}

function normaliseAroFloDate(raw) {
  if (!raw) return null;
  return raw.split("/").join("-");
}

function buildAvailabilityFromBusy(busyBlocks, dates) {
  const days = [];
  for (const dayStr of dates) {
    const d = new Date(dayStr + "T00:00:00");
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    let freeBlocks = [{ start: `${dayStr} 07:00:00`, end: `${dayStr} 15:00:00` }];
    const dayBusy = busyBlocks.filter(b => b.start && b.start.startsWith(dayStr));
    for (const b of dayBusy) freeBlocks = subtractBlock(freeBlocks, b);

    const tzOffset = "+11:00"; // AEDT. Change to +10:00 for AEST (Apr–Oct).
    const availableSlots = [];
    for (const [slotStart, slotEnd] of SLOT_TIMES) {
      const slotKey = { start: `${dayStr} ${slotStart}`, end: `${dayStr} ${slotEnd}` };
      const isFree = freeBlocks.some(f => f.start <= slotKey.start && f.end >= slotKey.end);
      if (isFree) availableSlots.push({
        start: `${dayStr}T${slotStart}${tzOffset}`,
        end:   `${dayStr}T${slotEnd}${tzOffset}`,
        start_sydney: `${dayStr} ${slotStart}`,
        end_sydney:   `${dayStr} ${slotEnd}`,
      });
    }
    days.push({ date: dayStr, slots: availableSlots });
  }
  return days;
}

async function getAvailableSlots(trade) {
  const techList = (TECHS[trade] || []).filter(t => t.userId !== "PLACEHOLDER");
  if (techList.length === 0) {
    console.warn(`[getAvailableSlots] No techs for trade: ${trade}`);
    return [];
  }

  const now = new Date();
  const nowPlus30 = new Date(now.getTime() + 30 * 60 * 1000);
  const todaySydneyStr = now.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  const sydneyMidnightUTC = new Date(todaySydneyStr + "T00:00:00Z");

  const dates = [];
  for (let i = 0; dates.length < 3; i++) {
    const d = new Date(sydneyMidnightUTC);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
    const dow = d.toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "short" });
    if (dow !== "Sat" && dow !== "Sun") dates.push(dateStr);
  }

  const aroDateFrom = dates[0].split("-").join("/");
  const aroDateTo   = dates[dates.length - 1].split("-").join("/");

  // Fetch schedules and timesheets in parallel
  const schedulesVar = [
    "zone=" + encodeURIComponent("schedules"),
    "where=" + encodeURIComponent(`and|startdate|>=|${aroDateFrom}`),
    "where=" + encodeURIComponent(`and|startdate|<=|${aroDateTo}`),
    "orderby=" + encodeURIComponent("startdatetime asc"),
  ].join("&");

  const timesheetsVar = [
    "zone=" + encodeURIComponent("timesheets"),
    "where=" + encodeURIComponent(`and|workdate|>=|${aroDateFrom}`),
    "where=" + encodeURIComponent(`and|workdate|<=|${aroDateTo}`),
  ].join("&");

  let allSchedules = [];
  let allTimesheets = [];

  try {
    const [schedData, tsData] = await Promise.all([
      aroFloGet(schedulesVar),
      aroFloGet(timesheetsVar).catch(err => {
        console.warn(`[getAvailableSlots] timesheets fetch failed (continuing):`, err.message);
        return null;
      }),
    ]);

    allSchedules = schedData?.zoneresponse?.schedules || [];
    if (!Array.isArray(allSchedules)) allSchedules = [allSchedules];

    if (tsData) {
      allTimesheets = tsData?.zoneresponse?.timesheets || [];
      if (!Array.isArray(allTimesheets)) allTimesheets = [allTimesheets];
    }
  } catch (err) {
    console.error(`[getAvailableSlots] Error fetching schedules:`, err.message);
    return [];
  }

  const results = [];

  for (const tech of techList) {
    const techSchedules = allSchedules.filter(
      s => s?.scheduledto?.scheduledtoid === tech.userId
    );
    const scheduleBusy = techSchedules
      .map(s => ({ start: normaliseAroFloDate(s.startdatetime), end: normaliseAroFloDate(s.enddatetime) }))
      .filter(b => b.start && b.end);

    const techTimesheets = allTimesheets.filter(
      t => t?.user?.userid === tech.userId && t?.type === "Non-Productive"
    );
    const leaveBusy = techTimesheets
      .map(t => ({ start: normaliseAroFloDate(t?.startdatetime), end: normaliseAroFloDate(t?.finishdatetime) }))
      .filter(b => b.start && b.end);

    const busyBlocks = [...scheduleBusy, ...leaveBusy];
    const availability = buildAvailabilityFromBusy(busyBlocks, dates);

    results.push({ tech: tech.name, userId: tech.userId, workload: techSchedules.length, availability });
  }

  // Flatten, sort by earliest time then least busy tech
  const allSlots = results.flatMap(r =>
    r.availability.flatMap(d =>
      d.slots.map(s => ({ ...s, tech: r.tech, userId: r.userId, workload: r.workload }))
    )
  );

  const sorted = allSlots.sort((a, b) => {
    const timeDiff = new Date(a.start) - new Date(b.start);
    return timeDiff !== 0 ? timeDiff : a.workload - b.workload;
  });

  const tomorrowD = new Date(sydneyMidnightUTC);
  tomorrowD.setUTCDate(tomorrowD.getUTCDate() + 1);
  const tomorrowSyd = tomorrowD.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });

  return sorted
    .filter(s => s.start_sydney && s.end_sydney)
    .filter(s => new Date(s.start) > nowPlus30)
    .map(s => {
      const slotDate = s.start_sydney.split(" ")[0];
      let day;
      if (slotDate === todaySydneyStr) day = "today";
      else if (slotDate === tomorrowSyd) day = "tomorrow";
      else day = new Date(slotDate + "T12:00:00")
        .toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "long" });

      return {
        ...s,
        day,
        start_time: s.start_sydney.split(" ")[1].slice(0, 5),
        end_time:   s.end_sydney.split(" ")[1].slice(0, 5),
        date:       slotDate,
      };
    });
}

// ====================== AROFLO WRITE OPERATIONS ======================

async function createClient({ firstName, lastName, phone, email, address, suburb, postcode, state }) {
  const payload = {
    firstname: firstName,
    lastname:  lastName,
    phone:     normalisePhone(phone),
    email:     email || "",
    address1:  address || "",
    city:      suburb || "",
    postcode:  postcode || "",
    state:     state || "NSW",
  };
  console.log("[createClient] Payload:", JSON.stringify(payload));
  return aroFloPost("clients", payload);
}

async function createTask({
  clientId, trade, isAfterHours, description,
  address, suburb, postcode,
  scheduledDate, scheduledTime,
  callerName, callerPhone,
}) {
  const taskType = trade === "electrical" ? "COD Electrical" : "COD Plumbing";

  const payload = {
    client: { id: clientId },
    tasktype: taskType,
    description: description || "",
    location: {
      address1: address || "",
      city:     suburb || "",
      postcode: postcode || "",
      state:    "NSW",
    },
    notes: [
      `Caller: ${callerName}`,
      `Phone: ${callerPhone}`,
      `After-hours: ${isAfterHours ? "Yes ($549 call-out fee accepted)" : "No"}`,
      `Issue: ${description}`,
    ].join("\n"),
    ...(scheduledDate ? { scheduleddate: scheduledDate } : {}),
    ...(scheduledTime ? { scheduledtime: scheduledTime } : {}),
  };

  console.log("[createTask] Payload:", JSON.stringify(payload, null, 2));
  return aroFloPost("tasks", payload);
}

// ====================== SHARED JOB CREATION LOGIC ======================

async function handleCreateJob(args, isAfterHours, res) {
  const {
    caller_phone, first_name, last_name, trade,
    description, street_address, suburb, postcode,
    client_id,
    scheduled_date, scheduled_time,
  } = args;

  let resolvedClientId = client_id || null;

  // Create client in AroFlo if not already known
  if (!resolvedClientId) {
    const newClient = await createClient({
      firstName: first_name,
      lastName:  last_name,
      phone:     caller_phone,
      address:   street_address,
      suburb,
      postcode,
      state:     "NSW",
    });

    if (newClient?.blocked) {
      // APPLY_UPDATES is false — log and return gracefully
      return res.json({
        success: false,
        blocked: true,
        message: "Test mode: client creation logged but not committed.",
        logged_payload: newClient,
      });
    }

    resolvedClientId = newClient?.zoneresponse?.id || newClient?.id || null;
  }

  const task = await createTask({
    clientId:      resolvedClientId,
    trade,
    isAfterHours,
    description,
    address:       street_address,
    suburb,
    postcode,
    callerName:    `${first_name} ${last_name}`,
    callerPhone:   caller_phone,
    scheduledDate: scheduled_date || null,
    scheduledTime: scheduled_time || null,
  });

  if (task?.blocked) {
    return res.json({
      success: false,
      blocked: true,
      message: "Test mode: task creation logged but not committed.",
      logged_payload: task,
    });
  }

  return res.json({
    success:  true,
    message:  isAfterHours
      ? "After-hours job created. Tech will call back shortly."
      : "Standard job created. Team will call between 7:00am and 9:30am.",
    task_id:  task?.zoneresponse?.id || null,
  });
}

// ====================== INBOUND WEBHOOK ======================
// Called by Retell BEFORE the call connects.
// Looks up the caller and returns dynamic variables so Jess
// has name/address ready before saying a word.

exports.retellInboundWebhook = onRequest(
  { minInstances: 1, timeoutSeconds: 10, memory: "256MiB", cpu: 1 },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    console.log("[retellInboundWebhook] payload:", JSON.stringify(body));

    const fromNumber = body?.call_inbound?.from_number || "";
    const normalisedPhone = normalisePhone(fromNumber);
    const client = fromNumber ? await lookupClientByPhone(fromNumber) : null;

    console.log(`[retellInboundWebhook] ${client ? "FOUND " + client.clientid : "NOT FOUND"} for ${fromNumber}`);

    return res.json({
      call_inbound: {
        dynamic_variables: {
          caller_phone:   normalisedPhone,
          first_name:     client?.firstname             || "",
          last_name:      client?.surname               || "",
          client_id:      client?.clientid              || "",
          street_address: client?.address?.addressline1 || "",
          suburb:         client?.address?.suburb       || "",
          postcode:       client?.address?.postcode     || "",
          client_found:   client ? "true" : "false",
          lookup_source:  "inbound_webhook",
        },
      },
    });
  }
);

// ====================== RETELL FUNCTION HANDLER ======================
// Retell calls this endpoint during the call to execute tool functions.
//
// Request body shape:
// { "call_id": "...", "name": "function_name", "arguments": { ... } }

exports.aroFloAgent = onRequest(
  { minInstances: 1, timeoutSeconds: 60, memory: "512MiB", cpu: 1 },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    console.log("[aroFloAgent] raw body:", JSON.stringify(body));

    // ── Inbound webhook (if routed through same function) ─────────────────────
    if (body.call_inbound) {
      const fromNumber = body.call_inbound.from_number || "";
      const normalisedPhone = normalisePhone(fromNumber);
      const client = fromNumber ? await lookupClientByPhone(fromNumber) : null;
      return res.json({
        call_inbound: {
          dynamic_variables: {
            caller_phone:   normalisedPhone,
            first_name:     client?.firstname             || "",
            last_name:      client?.surname               || "",
            client_id:      client?.clientid              || "",
            street_address: client?.address?.addressline1 || "",
            suburb:         client?.address?.suburb       || "",
            postcode:       client?.address?.postcode     || "",
            client_found:   client ? "true" : "false",
            lookup_source:  "inbound_webhook",
          },
        },
      });
    }

    // ── Lifecycle events — acknowledge and ignore ─────────────────────────────
    if (["call_started", "call_ended", "call_analyzed"].includes(body.event)) {
      console.log(`[aroFloAgent] lifecycle event: ${body.event}`);
      return res.json({ received: true });
    }

    // ── Function calls ────────────────────────────────────────────────────────
    const name    = body.name || body.function_name || "";
    const args    = body.args || body.arguments || body.parameters || {};
    const call_id = body.call_id || body.call?.call_id || "";

    console.log(`[aroFloAgent] call_id=${call_id} function=${name}`, JSON.stringify(args));

    try {
      switch (name) {

        // ── Service area check ─────────────────────────────────────────────
        case "check_service_area": {
          const { postcode } = args;
          const inArea = isInServiceArea(postcode);
          return res.json({
            in_service_area: inArea,
            message: inArea
              ? "That postcode is within our Sydney service area."
              : "That postcode is outside our standard Sydney service area. I'll pass the details to the team for review.",
          });
        }

        // ── Slot availability ──────────────────────────────────────────────
        case "get_available_slots": {
          const { trade } = args;
          const slots = await getAvailableSlots(trade);
          return res.json({ slots });
        }

        // ── After-hours job creation ───────────────────────────────────────
        case "create_afterhours_job": {
          return handleCreateJob(args, true, res);
        }

        // ── Standard hours job creation ────────────────────────────────────
        case "create_standard_job": {
          return handleCreateJob(args, false, res);
        }

        // ── Safety emergency — log only, no AroFlo write ───────────────────
        case "log_safety_emergency": {
          const { caller_phone, description } = args;
          console.warn(`[SAFETY] Phone: ${caller_phone} | Issue: ${description}`);
          return res.json({
            success: true,
            message: "Safety emergency logged. Caller directed to 000.",
          });
        }

        default:
          console.warn(`[aroFloAgent] Unknown function: "${name}"`);
          return res.status(400).json({ error: `Unknown function: ${name}` });
      }

    } catch (err) {
      console.error(`[aroFloAgent] Error in function "${name}":`, err.message, err.stack);
      // Return 200 with error detail so Retell doesn't retry — Jess handles gracefully
      return res.status(200).json({
        success: false,
        error:   err.message,
        message: "Something went wrong. The team will follow up shortly.",
      });
    }
  }
);