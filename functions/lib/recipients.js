// Test/production gate for notification recipients.
//
// While we're finalising, TEST mode (the default) sends every customer SMS and
// every team-inbox email to the tester instead of real customers/staff. To go
// live, set the Cloudflare Pages env var NOTIFY_TEST_MODE="false" (then real
// customers get their SMS and the team inbox jobs@mrwasher.com.au gets emails).
//
// NOTE: the after-hours on-call alert (plumber/electrician/supervisor + central
// pager@mrwasher.com.au) is gated SEPARATELY by ONCALL_TEST_MODE on the
// dashboards function — flip BOTH at go-live.
export function isNotifyTest(env) {
  return env && env.NOTIFY_TEST_MODE === 'false' ? false : true; // default: TEST
}

export const TEST_SMS = '0420994836';
export const TEST_EMAIL = 'fergusgordon77@gmail.com';
export const TEAM_EMAIL_PROD = 'jobs@mrwasher.com.au';

// The team inbox for bookings / call-backs / change requests.
export function teamEmail(env) {
  return isNotifyTest(env) ? TEST_EMAIL : TEAM_EMAIL_PROD;
}
