/**
 * State Machine Security Tests
 * Validates that item state transitions follow the defined flow:
 * ORDERED -> ON_PREPARE -> SERVED
 *                       -> CANCELED (with POS auth if ON_PREPARE)
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
  ORDERED: ['ON_PREPARE', 'CANCELED'],
  ON_PREPARE: ['SERVED', 'CANCELED'],
  SERVED: [],
  CANCELED: [],
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe('Item State Machine Security', () => {
  it('ORDERED -> ON_PREPARE is valid', () => {
    expect(canTransition('ORDERED', 'ON_PREPARE')).toBe(true);
  });

  it('ORDERED -> CANCELED is valid', () => {
    expect(canTransition('ORDERED', 'CANCELED')).toBe(true);
  });

  it('ON_PREPARE -> SERVED is valid', () => {
    expect(canTransition('ON_PREPARE', 'SERVED')).toBe(true);
  });

  it('ON_PREPARE -> CANCELED is valid (with POS auth)', () => {
    expect(canTransition('ON_PREPARE', 'CANCELED')).toBe(true);
  });

  it('SERVED -> ORDERED is invalid (no backwards)', () => {
    expect(canTransition('SERVED', 'ORDERED')).toBe(false);
  });

  it('CANCELED -> ON_PREPARE is invalid', () => {
    expect(canTransition('CANCELED', 'ON_PREPARE')).toBe(false);
  });

  it('ORDERED -> SERVED is invalid (must go through ON_PREPARE)', () => {
    expect(canTransition('ORDERED', 'SERVED')).toBe(false);
  });

  it('SERVED -> CANCELED is invalid', () => {
    expect(canTransition('SERVED', 'CANCELED')).toBe(false);
  });
});
