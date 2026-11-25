// Web Push is free (no SMS/payment gateway needed) — it's a browser-native
// API. It needs a VAPID key pair to identify your server to push services.
// Generate one with: node backend/scripts/generate-vapid-keys.js
// then set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in .env. Until then, this
// silently no-ops so nothing breaks.
let webpush;
try {
  webpush = require('web-push');
} catch {
  webpush = null;
}

let configured = false;
function ensureConfigured() {
  if (configured || !webpush) return configured;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT_EMAIL } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    `mailto:${VAPID_CONTACT_EMAIL || 'support@plumbpro.local'}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

function isPushEnabled() {
  return ensureConfigured();
}

// Sends to every subscription for a user; drops any subscription the push
// service reports as gone (410/404) so the table doesn't accumulate dead rows.
async function sendPush(pool, userId, payload) {
  if (!ensureConfigured()) return;
  try {
    const [subs] = await pool.query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?', [userId]);
    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        }
      }
    }));
  } catch {
    // Push is a courtesy channel; never let a failure here break the caller.
  }
}

module.exports = { sendPush, isPushEnabled };
