import { Component, OnInit, inject, signal } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent],
  template: `
    <div class="max-w-4xl mx-auto flex flex-col gap-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Configuración del Restaurante</h1>
        <button 
          (click)="save()"
          class="bg-primary text-white rounded-lg px-6 py-2 font-bold active:scale-95 transition-transform"
        >
          Guardar Cambios
        </button>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Basic Info -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 class="font-bold text-lg mb-2">Información Básica</h2>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-500">Nombre del Restaurante</label>
            <input 
              [(ngModel)]="restaurant().restaurant_name"
              class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-500">Logo del Restaurante</label>
            <app-image-uploader 
              folder="restaurant" 
              [currentImage]="restaurant().logo_image_url"
              (imageUploaded)="onLogoUploaded($event)"
            />
          </div>
        </section>

        <!-- Taxes & Billing -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 class="font-bold text-lg mb-2">Impuestos y Facturación</h2>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-500">Tasa de IVA (%)</label>
            <input 
              type="number"
              [(ngModel)]="restaurant().tax_rate"
              class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-500">Estado de Propinas</label>
            <select 
              [(ngModel)]="restaurant().tips_state"
              class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-primary"
            >
              <option [ngValue]="true">Activado</option>
              <option [ngValue]="false">Desactivado</option>
            </select>
          </div>
          @if (restaurant().tips_state) {
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-500">Tipo de Propina</label>
              <select 
                [(ngModel)]="restaurant().tips_type"
                class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-primary"
              >
                <option value="MANDATORY">Obligatoria</option>
                <option value="VOLUNTARY">Voluntaria</option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-500">Tasa de Propina (%)</label>
              <input 
                type="number"
                [(ngModel)]="restaurant().tips_rate"
                class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private http = inject(HttpClient);
  restaurant = signal<any>({});

  ngOnInit() {
    this.http.get(`${environment.apiUrl}/restaurant/me`).subscribe((res) => {
      this.restaurant.set(res);
    });
  }

  onLogoUploaded(url: string) {
    this.restaurant.update(r => ({ ...r, logo_image_url: url }));
  }

  save() {
    this.http.patch(`${environment.apiUrl}/restaurant/me`, this.restaurant()).subscribe(() => {
      alert('Configuración guardada correctamente');
    });
  }
}
