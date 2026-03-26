import { signal } from '@angular/core';

const _dark = signal<boolean>(localStorage.getItem('theme') === 'dark');

export const themeStore = {
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
