const { stripTags, sanitizeFields } = require('../src/utils/sanitize');

describe('stripTags', () => {
  test('removes a script tag entirely, not just the wrapper', () => {
    expect(stripTags('<script>alert(1)</script>hello')).toBe('alert(1)hello');
  });

  test('removes a plain HTML tag', () => {
    expect(stripTags('<b>bold</b> text')).toBe('bold text');
  });

  test('removes an img tag with an onerror handler', () => {
    expect(stripTags('<img src=x onerror=alert(1)>')).toBe('');
  });

  test('leaves plain text completely untouched', () => {
    expect(stripTags('My kitchen sink is leaking badly.')).toBe('My kitchen sink is leaking badly.');
  });

  test('trims surrounding whitespace', () => {
    expect(stripTags('  spaced out  ')).toBe('spaced out');
  });

  test('passes non-string values through unchanged', () => {
    expect(stripTags(42)).toBe(42);
    expect(stripTags(null)).toBe(null);
    expect(stripTags(undefined)).toBe(undefined);
  });
});

describe('sanitizeFields', () => {
  test('only cleans the fields named, leaving the rest of the object alone', () => {
    const input = { name: '<b>Bibek</b>', age: 21, bio: '<script>bad()</script>ok' };
    const result = sanitizeFields(input, ['name', 'bio']);
    expect(result.name).toBe('Bibek');
    expect(result.bio).toBe('bad()ok');
    expect(result.age).toBe(21);
  });

  test('does not mutate the original object', () => {
    const input = { name: '<b>X</b>' };
    sanitizeFields(input, ['name']);
    expect(input.name).toBe('<b>X</b>');
  });
});
