// Email is entirely optional and config-driven — the app works fine with no
// SMTP credentials set (every call here just logs and returns). Once you have
// an SMTP account (Gmail, a transactional provider, whatever), set these in
// .env and email starts working with zero code changes:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

let transporter = null;
function getTransporter() {
  if (!nodemailer || !process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:skipped, no SMTP configured] to=${to} subject="${subject}"`);
    return { sent: false };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'PlumbPro <no-reply@plumbpro.local>',
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ''),
    });
    return { sent: true };
  } catch (err) {
    console.error('[email:failed]', err.message);
    return { sent: false, error: err.message };
  }
}

const wrap = (title, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0d211f">
    <h2 style="margin:0 0 16px;color:#0f6659">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:28px;font-size:12px;color:#5c6e69">PlumbPro — plumbing services, done right.</p>
  </div>
`;

module.exports = { sendEmail, wrap };
