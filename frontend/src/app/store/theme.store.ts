import { signal, Signal } from '@angular/core';

export interface ThemeStore {
  isDark: Signal<boolean>;
  toggle: () => void;
  init: () => void;
}

const _dark = signal<boolean>(localStorage.getItem('theme') === 'dark');

export const themeStore: ThemeStore = {
  isDark: _dark.asReadonly(),

  toggle() {
    const next = !_dark();
    _dark.set(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  init() {
    if (_dark()) document.documentElement.classList.add('dark');
  },
};
