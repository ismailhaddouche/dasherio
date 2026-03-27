import { signal, computed, Signal } from '@angular/core';
import { Router } from '@angular/router';

export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  language: Language;
  theme: Theme;
}

export interface AuthUser {
  staffId: string;
  restaurantId: string;
  role: string;
  permissions: string[];
  name: string;
  preferences?: UserPreferences;
}

export interface AuthStore {
  user: Signal<AuthUser | null>;
  isAuthenticated: Signal<boolean>;
  hasPermission: (perm: string) => Signal<boolean>;
  preferences: Signal<UserPreferences | null>;
  setAuth: (user: AuthUser, expiresAt: number) => void;
  clearAuth: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

interface StoredUser extends AuthUser {
  expiresAt: number;
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredUser;
    if (data.expiresAt < Date.now()) {
      localStorage.removeItem('auth_user');
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem('auth_user');
    return null;
  }
}

const _user = signal<AuthUser | null>(loadStoredUser());

export const authStore: AuthStore = {
  user: _user.asReadonly(),
  isAuthenticated: computed(() => _user() !== null),
  hasPermission: (perm: string) => computed(() => _user()?.permissions.includes(perm) ?? false),
  preferences: computed(() => _user()?.preferences ?? null),

  setAuth(user: AuthUser, expiresAt: number) {
    const data: StoredUser = { ...user, expiresAt };
    localStorage.setItem('auth_user', JSON.stringify(data));
    _user.set(user);
  },

  clearAuth() {
    localStorage.removeItem('auth_user');
    _user.set(null);
  },

  updatePreferences(prefs: Partial<UserPreferences>) {
    const current = _user();
    if (current) {
      const updated = {
        ...current,
        preferences: { ...current.preferences, ...prefs } as UserPreferences
      };
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const data = JSON.parse(raw) as StoredUser;
        data.preferences = updated.preferences;
        localStorage.setItem('auth_user', JSON.stringify(data));
      }
      _user.set(updated);
    }
  }
};

export function validateTokenOrRedirect(router: Router): boolean {
  const user = authStore.user();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  return true;
}
