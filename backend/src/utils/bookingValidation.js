const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

function isPositiveInteger(value) {
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return false;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0;
}

function isValidDate(value) {
  if (typeof value !== 'string') return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function isValidTime(value) {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

function validateBookingInput(input = {}) {
  const errors = [];
  if (!isPositiveInteger(input.service_id)) errors.push('A valid service is required.');
  if (input.plumber_id !== undefined && input.plumber_id !== null &&
      input.plumber_id !== '' && !isPositiveInteger(input.plumber_id)) {
    errors.push('Selected plumber is invalid.');
  }
  if (typeof input.address !== 'string' || !input.address.trim() || input.address.trim().length > 500) {
    errors.push('A valid address (maximum 500 characters) is required.');
  }
  if (!isValidDate(input.booking_date)) errors.push('Booking date must be a real date in YYYY-MM-DD format.');
  if (!isValidTime(input.booking_time)) errors.push('Booking time must be in HH:MM format.');
  if (input.description !== undefined &&
      (typeof input.description !== 'string' || input.description.length > 2000)) {
    errors.push('Description must be 2,000 characters or fewer.');
  }
  return errors;
}

module.exports = { isPositiveInteger, isValidDate, isValidTime, validateBookingInput };
