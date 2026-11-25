// Defense-in-depth against stored XSS: React already escapes text it renders,
// so this isn't the only thing standing between an attacker and script
// execution, but it keeps raw HTML/script tags out of the database entirely,
// which protects any future template, export, email, or admin tool that
// might render this text without React's automatic escaping.

const TAG_PATTERN = /<[^>]*>/g;

function stripTags(value) {
  if (typeof value !== 'string') return value;
  return value.replace(TAG_PATTERN, '').trim();
}

// Sanitizes every string field on a plain object (one level deep — this app
// never accepts nested free-text objects from a form).
function sanitizeFields(obj, fields) {
  const clean = { ...obj };
  fields.forEach((key) => {
    if (typeof clean[key] === 'string') clean[key] = stripTags(clean[key]);
  });
  return clean;
}

module.exports = { stripTags, sanitizeFields };
