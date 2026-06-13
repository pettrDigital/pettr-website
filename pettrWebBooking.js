"use strict";

// ============================================================
// pettrWebBooking.js
// Handles AroFlo job creation triggered by website bookings.
// Called by Cloudflare Pages quote.js after SMS/email confirmation.
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

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const secretClient = new SecretManagerServiceClient();

const { hmacPhone, encryptName, decryptName } = require("./clientCrypto");

async function decodeClientDoc(c) {
  if (!c) return null;
  let firstname = c.firstname || "", surname = c.surname || "";
  if (c.name_enc) { const n = await decryptName(c.name_enc); firstname = n.firstname; surname = n.surname; }
  return { clientid: c.clientid, firstname, surname, archived: c.archived };
}

// ====================== CONSTANTS ======================

const AROFLO_BASE   = "https://api.aroflo.com/";
const AROFLO_ORG_ID = "IidKUCAK";
const TASK_TYPE_IDS = {
  plumbing:   "IidKRCAK",
  electrical: "IidKUCAK",
};

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
  const accept       = "application/json";
  const authorization =
    "uencoded="   + encodeURIComponent(uEncoded) +
    "&pencoded="  + encodeURIComponent(pEncoded) +
    "&orgEncoded=" + encodeURIComponent(orgEncoded);

  const payload = [method, "", accept, authorization, isoTimestamp, varString];
  const hash = CryptoJS.HmacSHA512(payload.join("+"), secretKey);

  return { hmac: hash.toString(), authorization, timestamp: isoTimestamp, accept };
}

// ====================== AROFLO API ======================

async function aroFloGet(varString) {
  const auth = await aroFloAuth("GET", varString);
  const res = await fetch(`${AROFLO_BASE}?${varString}`, {
    method: "GET",
    headers: {
      Authentication:  `HMAC ${auth.hmac}`,
      Authorization:   auth.authorization,
      Accept:          auth.accept,
      afdatetimeutc:   auth.timestamp,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`AroFlo GET error ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { throw new Error(`AroFlo GET non-JSON: ${text.slice(0, 300)}`); }
}

async function aroFloPost(zone, xmlBody) {
  // formBody is BOTH the request body AND the varString used for HMAC auth (confirmed via Postman)
  const formBody = `zone=${encodeURIComponent(zone)}&postxml=${encodeURIComponent(xmlBody)}`;

  if (!APPLY_UPDATES) {
    console.log(`[APPLY_UPDATES=false] BLOCKED POST zone=${zone}\n${xmlBody}`);
    return { blocked: true, zone, payload: xmlBody };
  }

  const auth = await aroFloAuth("POST", formBody);
  const res = await fetch(AROFLO_BASE, {
    method: "POST",
    headers: {
      Authentication:  `HMAC ${auth.hmac}`,
      Authorization:   auth.authorization,
      Accept:          auth.accept,
      afdatetimeutc:   auth.timestamp,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: formBody,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`AroFlo POST error ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { throw new Error(`AroFlo POST non-JSON: ${text.slice(0, 300)}`); }
}

// ====================== HELPERS ======================

function normalisePhone(raw) {
  if (!raw) return "";
  let p = raw.toString().replace(/[^\d]/g, "");
  if (p.startsWith("61") && p.length >= 11) p = "0" + p.slice(2);
  if (p.length === 9 && !p.startsWith("0")) p = "0" + p;
  return p.length >= 9 ? p : "";
}

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parsePostErrors(result) {
  return result?.zoneresponse?.postresults?.errors || [];
}

function isClientIdInvalid(errors) {
  return errors.some(e => (e.detail || "").includes("ClientID is invalid"));
}

// ====================== FIRESTORE CLIENT LOOKUP ======================

// Looks up by last-8 phone digits. When multiple clients share the number
// (couples, landlord/tenant, legacy duplicates), the confirmed surname picks
// between them; a name mismatch on a SINGLE match still returns that match
// (spouse on the account number beats creating a duplicate client).
async function lookupClientByPhone(rawPhone, confirmedSurname) {
  if (!normalisePhone(rawPhone)) return null;

  try {
    const ph = await hmacPhone(rawPhone);
    if (!ph) return null;
    let snap = await db.collection("aroflo_clients")
      .where("mobile_hmac", "==", ph).where("archived", "==", false).limit(5).get();
    if (snap.empty) {
      snap = await db.collection("aroflo_clients")
        .where("phone_hmac", "==", ph).where("archived", "==", false).limit(5).get();
    }
    if (snap.empty) return null;

    const candidates = await Promise.all(snap.docs.map(d => decodeClientDoc(d.data())));
    if (candidates.length === 1) return candidates[0];

    console.warn(`[lookupClientByPhone] ${candidates.length} clients share this number`);
    if (confirmedSurname) {
      const surname = String(confirmedSurname).trim().toLowerCase();
      const match = candidates.find(c => (c.surname || "").trim().toLowerCase() === surname);
      if (match) {
        console.log(`[lookupClientByPhone] surname match: ${match.clientid}`);
        return match;
      }
    }
    return candidates[0];
  } catch (err) {
    console.error("[lookupClientByPhone] Firestore error:", err.message);
    return null;
  }
}

// Write a freshly created AroFlo client straight into aroflo_clients so
// lookups see it immediately instead of waiting for the next sync cycle
// (which would otherwise create duplicate clients for quick repeat contact).
async function upsertClientToFirestore({ clientId, firstName, lastName, phone }) {
  if (!clientId) return;
  try {
    const ph = await hmacPhone(phone);
    await db.collection("aroflo_clients").doc(String(clientId)).set({
      clientid:    String(clientId),
      name_enc:    await encryptName(firstName, lastName),
      mobile_hmac: ph,
      phone_hmac:  ph,
      archived:    false,
      created_by_booking_flow: true,
    }, { merge: true });
    console.log("[upsertClientToFirestore] wrote", clientId);
  } catch (err) {
    console.error("[upsertClientToFirestore] failed:", err.message);
  }
}

// When AroFlo rejects a clientid as invalid, the Firestore record is stale —
// archive it so it stops winning lookups (and creating duplicates on every
// subsequent booking).
async function archiveStaleClient(clientId) {
  if (!clientId) return;
  try {
    await db.collection("aroflo_clients").doc(String(clientId)).set({ archived: true }, { merge: true });
    console.warn(`[archiveStaleClient] archived stale client ${clientId}`);
  } catch (err) {
    console.error("[archiveStaleClient] failed:", err.message);
  }
}

// ====================== AROFLO WRITE OPERATIONS ======================

async function createClient({ firstName, lastName, phone, email, address, suburb, postcode }) {
  const fullName  = [firstName, lastName].filter(Boolean).join(" ");
  const shortname = `${(lastName || firstName).slice(0, 4).toLowerCase()}_${normalisePhone(phone).slice(-4)}`;

  const xml =
    `<clients><client>` +
    `<clientname><![CDATA[${fullName}]]></clientname>` +
    `<firstname><![CDATA[${firstName || ""}]]></firstname>` +
    `<surname><![CDATA[${lastName || ""}]]></surname>` +
    `<shortname><![CDATA[${shortname}]]></shortname>` +
    `<mobile>${normalisePhone(phone)}</mobile>` +
    `<email><![CDATA[${email || ""}]]></email>` +
    `<orgs><org><orgid>${AROFLO_ORG_ID}</orgid></org></orgs>` +
    `<address>` +
    `<addressline1><![CDATA[${address || ""}]]></addressline1>` +
    `<suburb><![CDATA[${suburb || ""}]]></suburb>` +
    `<state><![CDATA[NSW]]></state>` +
    `<postcode><![CDATA[${postcode || ""}]]></postcode>` +
    `<country><![CDATA[Australia]]></country>` +
    `</address>` +
    `</client></clients>`;

  console.log("[createClient] XML:", xml);
  const result = await aroFloPost("clients", xml);
  const clientId = result?.zoneresponse?.postresults?.inserts?.clients?.[0]?.clientid || null;
  console.log("[createClient] clientId:", clientId);
  return { result, clientId };
}

async function createTask({
  clientId, trade, isAfterHours, description,
  address, suburb, postcode,
  scheduledDate, scheduledTime,
  callerName, callerPhone,
}) {
  const tasktypeid = TASK_TYPE_IDS[trade] || TASK_TYPE_IDS.plumbing;
  const dueDateStr = scheduledDate ? scheduledDate.replace(/-/g, "/") : "";
  const fullDesc = [
    description || "",
    `Address: ${[address, suburb, postcode].filter(Boolean).join(", ")}`,
    `After-hours: ${isAfterHours ? "Yes ($549 call-out fee)" : "No"}`,
    `Booked via website`,
  ].join("\n");

  const xml =
    `<tasks><task>` +
    `<org><orgid>${AROFLO_ORG_ID}</orgid></org>` +
    `<client><clientid>${escapeXml(clientId)}</clientid></client>` +
    `<tasktype><tasktypeid>${tasktypeid}</tasktypeid></tasktype>` +
    `<taskname><![CDATA[${callerName} - ${trade} booking]]></taskname>` +
    (dueDateStr ? `<duedate>${dueDateStr}</duedate>` : "") +
    `<description><![CDATA[${fullDesc}]]></description>` +
    `<contactname><![CDATA[${callerName}]]></contactname>` +
    `<contactphone><![CDATA[${callerPhone}]]></contactphone>` +
    `</task></tasks>`;

  console.log("[createTask] XML:", xml);
  const result = await aroFloPost("Tasks", xml);
  const errors = parsePostErrors(result);
  const taskId = result?.zoneresponse?.postresults?.inserts?.tasks?.[0]?.taskid || null;
  console.log("[createTask] taskId:", taskId, "errors:", JSON.stringify(errors));
  return { result, taskId, errors };
}

async function getJobNumber(taskId) {
  try {
    const varString = "zone=" + encodeURIComponent("tasks") +
      "&where=" + encodeURIComponent(`and|taskid|=|${taskId}`);
    const r = await aroFloGet(varString);
    const tasks = r?.zoneresponse?.tasks;
    const task  = Array.isArray(tasks) ? tasks[0] : tasks;
    return task?.jobnumber || null;
  } catch (err) {
    console.warn("[getJobNumber] failed:", err.message);
    return null;
  }
}

async function createScheduleEntry({ taskId, userId, date, startTime, endTime }) {
  const dateStr  = date.replace(/-/g, "/");
  const startDT  = `${dateStr} ${startTime}:00`;
  const endDT    = `${dateStr} ${endTime}:00`;

  const xml =
    `<schedules><schedule>` +
    `<scheduletype>` +
    `<typeid>${escapeXml(taskId)}</typeid>` +
    `<type>task</type>` +
    `</scheduletype>` +
    `<startdate>${dateStr}</startdate>` +
    `<enddate>${dateStr}</enddate>` +
    `<startdatetime>${startDT}</startdatetime>` +
    `<enddatetime>${endDT}</enddatetime>` +
    `<insertedby><userid>${escapeXml(userId)}</userid></insertedby>` +
    `<scheduledto>` +
    `<scheduledtoid>${escapeXml(userId)}</scheduledtoid>` +
    `<scheduledtotype>user</scheduledtotype>` +
    `</scheduledto>` +
    `<note></note>` +
    `</schedule></schedules>`;

  console.log("[createScheduleEntry] XML:", xml);
  const result     = await aroFloPost("schedules", xml);
  const scheduleId = result?.zoneresponse?.postresults?.inserts?.schedules?.[0]?.schedule_id || null;
  const errors     = parsePostErrors(result);
  console.log("[createScheduleEntry] scheduleId:", scheduleId, "errors:", JSON.stringify(errors));
  return { result, scheduleId, errors };
}

// ====================== WEB BOOKING ======================

exports.createWebBooking = onRequest(
  { minInstances: 0, timeoutSeconds: 60, memory: "512MiB", invoker: "public" },
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

    console.log("[createWebBooking] payload:", JSON.stringify(body));

    const {
      name, phone, email,
      address, suburb, postcode,
      trade, urgency,
      slot,
      description,
      ownership, appliance,
    } = body;

    if (!name || !phone || !address || !postcode || !trade || !urgency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const nameParts = (name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || name;
      const lastName  = nameParts.slice(1).join(" ") || "";
      const isAfterHours = urgency === "tonight";
      const blockedPayloads = {};

      // ── Step 1: Resolve client ID ─────────────────────────────────────────
      const existingClient = await lookupClientByPhone(phone, lastName);
      let clientId = existingClient?.clientid || null;
      if (clientId) {
        console.log("[createWebBooking] existing client found:", clientId);
      }

      // ── Step 2: Create task ───────────────────────────────────────────────
      const taskParams = {
        clientId:      clientId || "NEW",
        trade, isAfterHours,
        description:   description || "",
        address, suburb, postcode,
        callerName:    name,
        callerPhone:   phone,
        scheduledDate: slot?.date || null,
        scheduledTime: slot?.start_time || null,
      };

      let taskResult = await createTask(taskParams);

      // If clientId was stale/invalid, create a new AroFlo client and retry
      if (!taskResult.blocked && isClientIdInvalid(taskResult.errors)) {
        console.log("[createWebBooking] clientId invalid — creating new AroFlo client");
        await archiveStaleClient(clientId);
        const { result: clientResult, clientId: newClientId } = await createClient({
          firstName, lastName, phone, email, address, suburb, postcode,
        });

        if (clientResult?.blocked) {
          blockedPayloads.client = clientResult.payload;
          clientId = "BLOCKED";
        } else {
          clientId = newClientId;
          await upsertClientToFirestore({ clientId, firstName, lastName, phone, email, address, suburb, postcode });
        }

        taskResult = await createTask({ ...taskParams, clientId });
      }

      // If no clientId at all (not in Firebase), create new client
      if (!clientId || clientId === "NEW") {
        console.log("[createWebBooking] no client found — creating new AroFlo client");
        const { result: clientResult, clientId: newClientId } = await createClient({
          firstName, lastName, phone, email, address, suburb, postcode,
        });

        if (clientResult?.blocked) {
          blockedPayloads.client = clientResult.payload;
          clientId = "BLOCKED";
        } else {
          clientId = newClientId;
          await upsertClientToFirestore({ clientId, firstName, lastName, phone, email, address, suburb, postcode });
          taskResult = await createTask({ ...taskParams, clientId });
        }
      }

      if (taskResult?.blocked) {
        blockedPayloads.task = taskResult.payload;
      }

      const taskId = taskResult.taskId || null;

      // ── Step 3: Get job number ────────────────────────────────────────────
      let jobNumber = null;
      if (taskId && !taskResult.blocked) {
        jobNumber = await getJobNumber(taskId);
      }

      // ── Step 4: Create schedule (standard bookings with slot only) ────────
      if (!isAfterHours && slot?.userId && taskId) {
        const { result: schedResult, scheduleId, errors: schedErrors } = await createScheduleEntry({
          taskId,
          userId:    slot.userId,
          date:      slot.date,
          startTime: slot.start_time,
          endTime:   slot.end_time,
        });

        if (schedResult?.blocked) {
          blockedPayloads.schedule = schedResult.payload;
        } else if (schedErrors.length > 0) {
          console.warn("[createWebBooking] schedule errors:", JSON.stringify(schedErrors));
        } else {
          console.log("[createWebBooking] schedule created:", scheduleId, "tech:", slot.tech);
        }
      }

      // ── Return ────────────────────────────────────────────────────────────
      if (Object.keys(blockedPayloads).length > 0) {
        return res.json({
          success: false,
          blocked: true,
          message: "Test mode: all steps logged but not committed.",
          logged_payloads: blockedPayloads,
        });
      }

      console.log("[createWebBooking] complete — jobNumber:", jobNumber, "taskId:", taskId);
      return res.json({ success: true, jobNumber, taskId, clientId });

    } catch (err) {
      console.error("[createWebBooking] error:", err.message, err.stack);
      return res.status(500).json({ error: err.message });
    }
  }
);
