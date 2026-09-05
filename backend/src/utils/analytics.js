const { pool } = require('../config/db');

// Fire-and-forget event tracking. Never awaited by callers in a way that
// blocks the response, and never throws — analytics should never be able to
// break the feature it's measuring.
function trackEvent(eventName, userId = null, metadata = null) {
  pool.query(
    'INSERT INTO analytics_events (event_name, user_id, metadata) VALUES (?, ?, ?)',
    [eventName, userId, metadata ? JSON.stringify(metadata) : null]
  ).catch(() => {});
}

module.exports = { trackEvent };
