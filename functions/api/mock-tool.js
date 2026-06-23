// TEMPORARY test mock — a no-op endpoint for harnessing Retell tool calls
// during voice-agent testing. It records NOTHING and writes NOTHING; it simply
// returns success so a cloned test agent can call a tool (e.g. reschedule
// capture) end-to-end without touching AroFlo, Firestore, email, or SMS.
// Safe to delete once testing is complete.
export async function onRequestPost() {
  return new Response(
    JSON.stringify({ success: true, message: "Request captured for the team. They will follow up with the caller directly." }),
    { headers: { "content-type": "application/json" } }
  );
}
export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, mock: "tool" }), { headers: { "content-type": "application/json" } });
}
