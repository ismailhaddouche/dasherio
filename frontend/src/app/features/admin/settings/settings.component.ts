import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { I18nService, type Language } from '../../../core/services/i18n.service';
import { ThemeService, type Theme } from '../../../core/services/theme.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { NotificationService } from '../../../core/services/notification.service';

interface RestaurantSettings {
  _id: string;
  restaurant_name: string;
  tax_rate: number;
  currency: string;
  default_language: Language;
  default_theme: Theme;
  tips_state: boolean;
  tips_type: 'MANDATORY' | 'VOLUNTARY';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="admin-container max-w-5xl">
      <header class="admin-header">
        <div>
          <h1 class="admin-title">{{ 'settings.title' | translate }}</h1>
          <p class="admin-subtitle">{{ 'settings.subtitle' | translate }}</p>
        </div>
        <button
          (click)="saveSettings()"
          [disabled]="saving()"
          class="btn-admin btn-primary"
        >
          @if (saving()) {
            <span class="material-symbols-outlined animate-spin text-sm">refresh</span>
          } @else {
            <span class="material-symbols-outlined text-sm">save</span>
          }
          {{ saving() ? ('common.saving' | translate) : ('common.save' | translate) }}
        </button>
      </header>

      @if (loading()) {
        <div class="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">{{ 'common.loading' | translate }}</p>
        </div>
      } @else {
        <div class="space-y-6">
          <!-- Restaurant Info -->
          <div class="admin-card p-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">store</span>
              {{ 'settings.restaurant' | translate }}
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="admin-label">
                  {{ 'settings.restaurant_name' | translate }}
                </label>
                <input
                  type="text"
                  [(ngModel)]="settings().restaurant_name"
                  class="admin-input"
                  [placeholder]="'settings.restaurant_name' | translate"
                />
              </div>
              
              <div>
                <label class="admin-label">
                  {{ 'settings.currency' | translate }}
                </label>
                <select
                  [(ngModel)]="settings().currency"
                  class="admin-select"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              
              <div>
                <label class="admin-label">
                  {{ 'settings.tax' | translate }} (%)
                </label>
                <input
                  type="number"
                  [(ngModel)]="settings().tax_rate"
                  min="0"
                  max="100"
                  class="admin-input"
                />
              </div>
            </div>
          </div>

          <!-- Default Preferences -->
          <div class="admin-card p-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">tune</span>
              {{ 'settings.general' | translate }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {{ 'settings.staff_defaults' | translate }}
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Default Language -->
              <div>
                <label class="admin-label">
                  {{ 'common.language' | translate }} ({{ 'common.default' | translate }})
                </label>
                <select
                  [(ngModel)]="settings().default_language"
                  class="admin-select"
                >
                  @for (lang of availableLanguages; track lang.code) {
                    <option [value]="lang.code">{{ lang.flag }} {{ lang.name }}</option>
                  }
                </select>
              </div>
              
              <!-- Default Theme -->
              <div>
                <label class="admin-label">
                  {{ 'common.theme' | translate }} ({{ 'common.default' | translate }})
                </label>
                <select
                  [(ngModel)]="settings().default_theme"
                  class="admin-select"
                >
                  <option value="light">☀️ {{ 'common.light' | translate }}</option>
                  <option value="dark">🌙 {{ 'common.dark' | translate }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  private notify = inject(NotificationService);

  settings = signal<RestaurantSettings>({
    _id: '',
    restaurant_name: '',
    tax_rate: 10,
    currency: 'EUR',
    default_language: 'es',
    default_theme: 'light',
    tips_state: false,
    tips_type: 'VOLUNTARY'
  });

  loading = signal(true);
  saving = signal(false);

  readonly availableLanguages = this.i18n.getAvailableLanguages();

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading.set(true);
    this.http.get<RestaurantSettings>(`${environment.apiUrl}/restaurant/settings`).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading settings:', err);
        this.notify.error(this.i18n.translate('error.loading'));
        this.loading.set(false);
      }
    });
  }

  saveSettings() {
    this.saving.set(true);

    const s = this.settings();
    const payload = {
      restaurant_name: s.restaurant_name,
      tax_rate: s.tax_rate,
      currency: s.currency,
      default_language: s.default_language,
      default_theme: s.default_theme,
      tips_state: s.tips_state,
      tips_type: s.tips_type
    };

    this.http.patch(`${environment.apiUrl}/restaurant/settings`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(this.i18n.translate('settings.preferences.saved'));
      },
      error: (err) => {
        console.error('Error saving settings:', err);
        this.saving.set(false);
        this.notify.error(this.i18n.translate('error.saving'));
      }
    });
  }
}
