const {
  isPositiveInteger,
  isValidDate,
  isValidTime,
  validateBookingInput,
} = require('../src/utils/bookingValidation');

describe('booking input validation', () => {
  test('accepts valid positive integer identifiers', () => {
    expect(isPositiveInteger(12)).toBe(true);
    expect(isPositiveInteger('12')).toBe(true);
    expect(isPositiveInteger('1.2')).toBe(false);
    expect(isPositiveInteger('-1')).toBe(false);
    expect(isPositiveInteger('1 OR 1=1')).toBe(false);
  });

  test('validates real calendar dates, including leap years', () => {
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2027-02-29')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('26-01-01')).toBe(false);
  });

  test('validates 24-hour times', () => {
    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('23:59:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
  });

  test('rejects malformed booking payloads and oversized text', () => {
    expect(validateBookingInput({})).toHaveLength(5);
    expect(validateBookingInput({
      service_id: '2',
      plumber_id: '3',
      address: 'Kathmandu',
      booking_date: '2027-05-20',
      booking_time: '10:30',
      description: 'Pipe leak',
    })).toEqual([]);
    expect(validateBookingInput({
      service_id: '2 OR 1=1',
      address: ' ',
      booking_date: '2027-02-29',
      booking_time: '25:00',
      description: 'x'.repeat(2001),
    }).length).toBeGreaterThan(0);
  });
});
