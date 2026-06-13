"use strict";

// Shared encryption/hashing for aroflo_clients records so a Firestore-only
// leak yields nothing intelligible:
//   - phone digits → HMAC-SHA256 with a secret pepper (matchable, not reversible
//     without the pepper; defeats the ~100M brute-force on a bare phone hash)
//   - name fields  → AES-256-GCM (recoverable only with the key)
// Both secrets live in Secret Manager, never in Firestore.

const crypto = require("crypto");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const secretClient = new SecretManagerServiceClient();

let _keys = null;
async function getKeys() {
  if (_keys) return _keys;
  const [pepperV] = await secretClient.accessSecretVersion({
    name: "projects/pettrdashboards/secrets/CLIENT_HMAC_PEPPER/versions/latest",
  });
  const [keyV] = await secretClient.accessSecretVersion({
    name: "projects/pettrdashboards/secrets/CLIENT_ENC_KEY/versions/latest",
  });
  _keys = {
    pepper: pepperV.payload.data.toString("utf8").trim(),
    encKey: Buffer.from(keyV.payload.data.toString("utf8").trim(), "base64"), // 32 bytes
  };
  return _keys;
}

// Last 8 digits of an AU mobile in canonical form.
function digits8(raw) {
  if (!raw) return "";
  let p = String(raw).replace(/\D/g, "");
  if (p.startsWith("61") && p.length >= 11) p = "0" + p.slice(2);
  if (p.length === 9 && !p.startsWith("0")) p = "0" + p;
  return p.length >= 8 ? p.slice(-8) : "";
}

async function hmacPhone(raw) {
  const d = digits8(raw);
  if (!d) return "";
  const { pepper } = await getKeys();
  return crypto.createHmac("sha256", pepper).update(d).digest("hex");
}

async function encrypt(text) {
  const { encKey } = await getKeys();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encKey, iv);
  const ct = Buffer.concat([cipher.update(String(text == null ? "" : text), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

async function decrypt(blob) {
  if (!blob || typeof blob !== "string" || blob.split(":").length !== 3) return "";
  try {
    const { encKey } = await getKeys();
    const [ivB, tagB, ctB] = blob.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", encKey, Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ctB, "base64")), decipher.final()]).toString("utf8");
  } catch (e) {
    console.error("[clientCrypto] decrypt failed:", e.message);
    return "";
  }
}

const SEP = "";
async function encryptName(firstname, surname) {
  return encrypt(`${firstname || ""}${SEP}${surname || ""}`);
}
async function decryptName(blob) {
  const [firstname = "", surname = ""] = (await decrypt(blob)).split(SEP);
  return { firstname, surname };
}

module.exports = { digits8, hmacPhone, encrypt, decrypt, encryptName, decryptName };
