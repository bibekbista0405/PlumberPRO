// Unit tests for the booking lifecycle state machine — no database needed.
// This is the single most important piece of business logic in the app
// (PRD section 13: "Backend is authoritative for every state transition"),
// so it's the highest-value place to have real, fast, repeatable tests.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { TRANSITIONS } = require('../src/controllers/bookings');

function canTransition(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}

describe('booking state machine', () => {
  test('a full happy-path job can move through every real-world step in order', () => {
    const path = ['pending', 'assigned', 'confirmed', 'on_the_way', 'arrived', 'in_progress', 'completed', 'reviewed'];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  test('every terminal state has no outgoing transitions', () => {
    ['reviewed', 'cancelled', 'rejected', 'expired'].forEach((state) => {
      expect(TRANSITIONS[state]).toEqual([]);
    });
  });

  test('a booking cannot skip straight from pending to completed', () => {
    expect(canTransition('pending', 'completed')).toBe(false);
  });

  test('a booking cannot skip straight from confirmed to completed', () => {
    expect(canTransition('confirmed', 'completed')).toBe(false);
  });

  test('a completed job cannot be cancelled after the fact', () => {
    expect(canTransition('completed', 'cancelled')).toBe(false);
  });

  test('cancellation is allowed before work starts, not after', () => {
    ['pending', 'assigned', 'confirmed', 'on_the_way', 'arrived'].forEach((state) => {
      expect(canTransition(state, 'cancelled')).toBe(true);
    });
    expect(canTransition('in_progress', 'cancelled')).toBe(false);
  });

  test('rejection is only possible before a plumber has committed to the job', () => {
    expect(canTransition('assigned', 'rejected')).toBe(true);
    expect(canTransition('confirmed', 'rejected')).toBe(true);
    expect(canTransition('on_the_way', 'rejected')).toBe(false);
  });

  test('an unknown "from" state has no valid transitions', () => {
    expect(canTransition('not_a_real_status', 'completed')).toBe(false);
  });
});
