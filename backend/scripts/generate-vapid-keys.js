// Run this once: node scripts/generate-vapid-keys.js
// Copy the output into backend/.env as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.
// The public key also needs to go in the frontend as REACT_APP_VAPID_PUBLIC_KEY
// (in the root .env, not backend/.env) so the browser can subscribe.
const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();
console.log('\nAdd these to backend/.env:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_CONTACT_EMAIL=you@example.com`);
console.log('\nAlso add this to the root .env (frontend build reads it):\n');
console.log(`REACT_APP_VAPID_PUBLIC_KEY=${keys.publicKey}\n`);
