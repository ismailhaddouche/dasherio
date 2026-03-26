import { signal, computed } from '@angular/core';

export interface AuthUser {
  staffId: string;
  restaurantId: string;
  role: string;
  permissions: string[];
  name: string;
}

// BUG-06: decode JWT payload so _user is populated on page refresh
export function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.staffId || !payload.restaurantId) return null;
    return {
      staffId: payload.staffId,
      restaurantId: payload.restaurantId,
      role: payload.role || '',
      permissions: payload.permissions || [],
      name: payload.name || '',
    };
  } catch {
    return null;
  }
}

const storedToken = localStorage.getItem('token');
const _token = signal<string | null>(storedToken);
// BUG-06: restore user from stored JWT so guards work after page refresh
const _user = signal<AuthUser | null>(storedToken ? decodeJwt(storedToken) : null);

export const authStore = {
  user: _user.asReadonly(),
  token: _token.asReadonly(),
  isAuthenticated: computed(() => _token() !== null && _user() !== null),
  hasPermission: (perm: string) => computed(() => _user()?.permissions.includes(perm) ?? false),

  setAuth(token: string, user: AuthUser) {
    localStorage.setItem('token', token);
    _token.set(token);
    _user.set(user);
  },

  clearAuth() {
    localStorage.removeItem('token');
    _token.set(null);
    _user.set(null);
  },
};
