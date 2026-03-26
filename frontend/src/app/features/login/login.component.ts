import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { authStore, decodeJwt } from '../../store/auth.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div class="text-center mb-6">
          <span class="material-symbols-outlined text-5xl text-primary">restaurant</span>
          <h1 class="text-2xl font-bold mt-2 text-gray-900 dark:text-white">DisherIo</h1>
        </div>

        <form (ngSubmit)="login()" class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              [(ngModel)]="email" name="email" type="email" required autocomplete="username"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
            <input
              [(ngModel)]="password" name="password" type="password" required autocomplete="current-password"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          @if (error()) {
            <p class="text-red-500 text-sm text-center">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="bg-primary text-white rounded-lg py-2 font-bold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {{ loading() ? 'Accediendo...' : 'Acceder' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  login() {
    this.loading.set(true);
    this.error.set('');
    this.http
      .post<{ token: string; staff: { id: string; name: string; role: string } }>(
        `${environment.apiUrl}/auth/login`,
        { email: this.email, password: this.password }
      )
      .subscribe({
        next: (res) => {
          const user = decodeJwt(res.token);
          if (user) {
            authStore.setAuth(res.token, user);
            this.router.navigate([this.defaultRouteFor(user.permissions)]);
          } else {
            this.error.set('Error procesando credenciales');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.status === 401 ? 'Credenciales incorrectas' : 'Error del servidor');
          this.loading.set(false);
        },
      });
  }

  private defaultRouteFor(permissions: string[]): string {
    if (permissions.includes('ADMIN')) return '/admin';
    if (permissions.includes('KTS')) return '/kds';
    if (permissions.includes('TAS')) return '/tas';
    if (permissions.includes('POS')) return '/pos';
    return '/pos';
  }
}
