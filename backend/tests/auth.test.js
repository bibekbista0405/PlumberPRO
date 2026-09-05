process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const jwt = require('jsonwebtoken');
const { signToken, sanitizeUser } = require('../src/utils/auth');

describe('signToken', () => {
  const user = { id: 7, role: 'plumber', email: 'test@example.com', name: 'Test Plumber' };

  test('produces a token that verifies with the same secret', () => {
    const token = signToken(user);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(7);
    expect(decoded.role).toBe('plumber');
  });

  test('never embeds the password hash, even if present on the input object', () => {
    const token = signToken({ ...user, password_hash: 'super-secret-hash' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.password_hash).toBeUndefined();
  });

  test('rejects a token signed with a different secret', () => {
    const token = signToken(user);
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });
});

describe('sanitizeUser', () => {
  test('strips password_hash from the object returned to the client', () => {
    const dbRow = { id: 1, name: 'A', email: 'a@a.com', phone: '999', role: 'customer', status: 'active', created_at: '2026-01-01', password_hash: 'hash' };
    const clean = sanitizeUser(dbRow);
    expect(clean.password_hash).toBeUndefined();
    expect(clean.email).toBe('a@a.com');
  });
});
