import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // BUG-07: /login and /unauthorized were missing — caused infinite redirect loop
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
  {
    path: 'menu/:qr',
    loadComponent: () => import('./features/totem/totem.component').then((m) => m.TotemComponent),
  },
  {
    path: 'kds',
    loadComponent: () => import('./features/kds/kds.component').then((m) => m.KdsComponent),
    canActivate: [authGuard, roleGuard],
    data: { permissions: ['KTS', 'ADMIN'] },
  },
  {
    path: 'pos',
    loadComponent: () => import('./features/pos/pos.component').then((m) => m.PosComponent),
    canActivate: [authGuard, roleGuard],
    data: { permissions: ['POS', 'ADMIN'] },
  },
  {
    path: 'tas',
    loadComponent: () => import('./features/tas/tas.component').then((m) => m.TasComponent),
    canActivate: [authGuard, roleGuard],
    data: { permissions: ['TAS', 'POS', 'ADMIN'] },
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { permissions: ['ADMIN'] },
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
