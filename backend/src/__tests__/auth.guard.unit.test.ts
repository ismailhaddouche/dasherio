import { defineAbilityFor } from '../abilities/abilities';

const makeUser = (permissions: string[]) => ({
  staffId: 'staff1',
  restaurantId: 'rest1',
  role: 'test',
  permissions,
});

describe('CASL Abilities', () => {
  it('ADMIN should manage all', () => {
    const ability = defineAbilityFor(makeUser(['ADMIN']));
    expect(ability.can('manage', 'all')).toBe(true);
    expect(ability.can('delete', 'Staff')).toBe(true);
  });

  it('KTS should only read and update items', () => {
    const ability = defineAbilityFor(makeUser(['KTS']));
    expect(ability.can('read', 'Order')).toBe(true);
    expect(ability.can('update', 'ItemOrder')).toBe(true);
    expect(ability.cannot('create', 'Staff')).toBe(true);
    expect(ability.cannot('delete', 'Totem')).toBe(true);
  });

  it('TAS should not access Staff or Restaurant management', () => {
    const ability = defineAbilityFor(makeUser(['TAS']));
    expect(ability.cannot('create', 'Staff')).toBe(true);
    expect(ability.cannot('delete', 'Restaurant')).toBe(true);
    expect(ability.can('create', 'Order')).toBe(true);
  });

  it('POS should update payments', () => {
    const ability = defineAbilityFor(makeUser(['POS']));
    expect(ability.can('update', 'Payment')).toBe(true);
    expect(ability.cannot('create', 'Staff')).toBe(true);
  });

  it('empty permissions should have no access', () => {
    const ability = defineAbilityFor(makeUser([]));
    expect(ability.cannot('read', 'Order')).toBe(true);
    expect(ability.cannot('create', 'Totem')).toBe(true);
  });
});
