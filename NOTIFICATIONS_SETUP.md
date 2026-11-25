# Email & Push Notification Setup

Both channels are entirely optional and off by default — the app works fine
with neither configured. In-app notifications (the bell icon) always work
regardless of this setup, since they don't depend on external services.

## Email (SMTP)

Uses `nodemailer`, already in `backend/package.json`. To turn it on, add
these to `backend/.env`:

```
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=PlumbPro <no-reply@yourdomain.com>
```

Any standard SMTP provider works — Gmail (with an app password), a
transactional email service, or your hosting provider's SMTP. Once
`SMTP_HOST` is set, emails start sending automatically for:

- Welcome email on registration
- Booking accepted
- Booking completed (with a review prompt)

No code changes needed — `backend/src/utils/email.js` picks up the env vars
at request time. Until configured, every call just logs
`[email:skipped, no SMTP configured]` and moves on; nothing breaks.

## Web Push

Free — it's a browser-native API, no SMS gateway or payment account needed.
It needs a VAPID key pair to identify your server to browsers' push services.

**One-time setup:**

1. Install dependencies if you haven't: `cd backend && npm install`
2. Generate a key pair:
   ```
   node backend/scripts/generate-vapid-keys.js
   ```
3. Copy the output into `backend/.env`:
   ```
   VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_CONTACT_EMAIL=you@example.com
   ```
4. Copy the public key into the **root** `.env` (the one the frontend build
   reads, not `backend/.env`):
   ```
   REACT_APP_VAPID_PUBLIC_KEY=...
   ```
5. Rebuild the frontend (`npm run build` or restart `npm run dev`).

Once both keys are set, the bell icon's dropdown will show a "Get notified
even when the tab is closed" option for logged-in users. Push then fires
alongside every in-app notification that already exists — new bookings, job
status changes, new chat messages, new reviews, and report updates.

**Keep `VAPID_PRIVATE_KEY` secret** — it's what proves push messages came
from your server. Never commit it to a public repo.

## Why these are separate, optional systems

In-app notifications (the bell) are the one channel guaranteed to work with
zero setup, since they're just database rows the app already polls. Email and
push are genuinely valuable for reaching someone who isn't looking at the
app, but neither should ever be a hard dependency — a support ticket you
haven't set up SMTP for yet shouldn't mean the whole notification system is
broken.
