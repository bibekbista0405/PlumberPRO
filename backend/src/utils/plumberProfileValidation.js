'use strict';
function parseBoolean(value, fallback, fieldName) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  throw new Error(`${fieldName} must be true or false.`);
}

function validateProfileInput(input) {
  const errors = [];
  const limits = { profession: 160, education: 255, certifications: 255, location_name: 255, bio: 3000 };
  Object.entries(limits).forEach(([field, max]) => {
    if (input[field] !== undefined && (typeof input[field] !== 'string' || input[field].trim().length > max)) {
      errors.push(`${field.replace('_', ' ')} must be ${max} characters or fewer.`);
    }
  });
  const experience = Number(input.experience_years ?? 0);
  const radius = Number(input.service_radius_km ?? 15);
  if (!Number.isFinite(experience) || experience < 0 || experience > 60) errors.push('Experience must be between 0 and 60 years.');
  if (!Number.isFinite(radius) || radius < 1 || radius > 100) errors.push('Service radius must be between 1 and 100 km.');
  return errors;
}

module.exports = { parseBoolean, validateProfileInput };
