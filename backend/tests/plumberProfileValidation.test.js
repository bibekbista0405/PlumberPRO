process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const { parseBoolean, validateProfileInput } = require('../src/utils/plumberProfileValidation');

describe('plumber profile workflow validation', () => {
  test.each([[true, true], [1, true], ['1', true], ['true', true], [false, false], [0, false], ['0', false], ['false', false]])(
    'parses boolean input %p as %p', (input, expected) => {
      expect(parseBoolean(input, true, 'Availability')).toBe(expected);
    }
  );

  test('rejects ambiguous boolean strings instead of treating them as true', () => {
    expect(() => parseBoolean('yes', true, 'Availability')).toThrow('Availability must be true or false.');
  });

  test('accepts valid profile limits', () => {
    expect(validateProfileInput({ profession: 'Plumber', experience_years: '12.5', service_radius_km: '25' })).toEqual([]);
  });

  test('rejects out-of-range experience and service radius', () => {
    expect(validateProfileInput({ experience_years: 61, service_radius_km: 0 })).toEqual([
      'Experience must be between 0 and 60 years.',
      'Service radius must be between 1 and 100 km.'
    ]);
  });

  test('rejects oversized profile text', () => {
    expect(validateProfileInput({ profession: 'x'.repeat(161) })).toContain('profession must be 160 characters or fewer.');
  });
});
