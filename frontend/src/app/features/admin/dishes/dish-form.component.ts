import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { DishOptionListComponent, OptionItem } from './dish-option-list.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../core/services/i18n.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Dish, Variant, Extra, Category } from '../../../types';

// Form-specific types matching backend requirements (es, en, fr, ar supported)
type LocalizedFormString = { es: string; en: string; fr: string; ar: string };

interface VariantForm {
  variant_name: LocalizedFormString;
  variant_price: number;
}

interface ExtraForm {
  extra_name: LocalizedFormString;
  extra_price: number;
}

interface DishForm extends Omit<Dish, 'restaurant_id' | 'disher_status' | 'disher_variant' | 'disher_name' | 'variants' | 'extras'> {
  disher_name: LocalizedFormString;
  variants: VariantForm[];
  extras: ExtraForm[];
}

const ALLERGEN_CODES = ['GLUTEN','CRUSTACEANS','EGGS','FISH','PEANUTS','SOY','MILK','NUTS','CELERY','MUSTARD','SESAME','SULPHITES','LUPINE','MOLLUSCS'] as const;

const INITIAL_DISH: DishForm = {
  category_id: '',
  disher_name: { es: '', en: '', fr: '', ar: '' },
  disher_price: 0,
  disher_type: 'KITCHEN',
  disher_alergens: [],
  variants: [],
  extras: []
};

const INITIAL_VARIANT: VariantForm = { variant_name: { es: '', en: '', fr: '', ar: '' }, variant_price: 0 };
const INITIAL_EXTRA: ExtraForm = { extra_name: { es: '', en: '', fr: '', ar: '' }, extra_price: 0 };

@Component({
  selector: 'app-dish-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploaderComponent, DishOptionListComponent, TranslatePipe],
  template: `
    <div class="admin-container max-w-4xl">
      <header class="admin-header">
        <div>
          <h1 class="admin-title">{{ isEdit ? ('dish.edit_dish' | translate) : ('dish.new_dish' | translate) }}</h1>
          <p class="admin-subtitle">{{ isEdit ? ('dish.edit_subtitle' | translate) : ('dish.new_subtitle' | translate) }}</p>
        </div>
        <div class="flex gap-3">
          <button (click)="cancel()" class="btn-admin btn-secondary">
            {{ 'common.cancel' | translate }}
          </button>
          <button (click)="save()" class="btn-admin btn-primary">
            <span class="material-symbols-outlined text-sm">save</span>
            {{ 'common.save' | translate }}
          </button>
        </div>
      </header>

      <div class="admin-card p-6 flex flex-col gap-6">
        <!-- Image Section -->
        <section class="flex flex-col gap-2">
          <label class="admin-label text-base font-bold">{{ 'dish.image' | translate }}</label>
          <app-image-uploader
            folder="dishes"
            [currentImage]="dish().disher_url_image ?? null"
            (imageUploaded)="onImageUploaded($event)"
          />
        </section>

        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="admin-label">{{ 'category.name_es' | translate }} *</label>
            <input [(ngModel)]="dish().disher_name.es" class="admin-input" [placeholder]="'category.name_es' | translate" />
          </div>
          <div>
            <label class="admin-label">{{ 'dish.base_price' | translate }} *</label>
            <input
              type="number"
              [(ngModel)]="dish().disher_price"
              min="0"
              step="0.01"
              class="admin-input"
              [class.border-red-500]="dish().disher_price < 0"
            />
            @if (dish().disher_price <= 0) {
              <span class="text-xs text-red-500 mt-1 block">{{ 'dish.price_negative' | translate }}</span>
            }
          </div>
        </div>

        <div>
          <label class="admin-label">{{ 'dish.category' | translate }} *</label>
          <select [(ngModel)]="dish().category_id" class="admin-select">
            <option value="">{{ 'dish.select_category' | translate }}</option>
            @for (cat of categories(); track cat._id) {
              <option [value]="cat._id">{{ cat.category_name.es }}</option>
            }
          </select>
        </div>

        <!-- Allergens Section -->
        <section class="border-t border-gray-100 dark:border-gray-700 pt-6">
          <h2 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-500">warning</span>
            {{ 'dish.allergens' | translate }}
          </h2>
          <div class="flex flex-wrap gap-2">
            @for (code of allergenCodes; track code) {
              <label class="flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all"
                [class.bg-amber-100]="hasAllergen(code)"
                [class.dark:bg-amber-900]="hasAllergen(code)"
                [class.border-amber-400]="hasAllergen(code)"
                [class.text-amber-800]="hasAllergen(code)"
                [class.dark:text-amber-200]="hasAllergen(code)"
                [class.bg-gray-50]="!hasAllergen(code)"
                [class.dark:bg-gray-700]="!hasAllergen(code)"
                [class.border-gray-200]="!hasAllergen(code)"
                [class.dark:border-gray-600]="!hasAllergen(code)"
                [class.hover:border-gray-300]="!hasAllergen(code)"
              >
                <input type="checkbox" class="hidden" [checked]="hasAllergen(code)" (change)="toggleAllergen(code)" />
                {{ 'allergen.' + code | translate }}
              </label>
            }
          </div>
        </section>

        <!-- Variants Section -->
        <app-dish-option-list
          [title]="'dish.variants' | translate"
          [emptyMessage]="'dish.no_variants' | translate"
          [items]="getVariantsAsOptions()"
          (add)="addVariant()"
          (remove)="removeVariant($event)"
        />

        <!-- Extras Section -->
        <app-dish-option-list
          [title]="'dish.extras' | translate"
          [subtitle]="'dish.extras_desc' | translate"
          [emptyMessage]="'dish.no_extras' | translate"
          variant="amber"
          [items]="getExtrasAsOptions()"
          (add)="addExtra()"
          (remove)="removeExtra($event)"
        />
      </div>
    </div>
  `
})
export class DishFormComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);
  private notify = inject(NotificationService);
  private destroy$ = new Subject<void>();

  readonly allergenCodes = ALLERGEN_CODES;

  isEdit = false;
  dish = signal<DishForm>({
    ...INITIAL_DISH,
    disher_name: { es: '', en: '', fr: '', ar: '' },
  });
  categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.loadCategories();
    this.loadDishIfEditing();
  }

  private loadDishIfEditing(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.loadDish(id);
    }
  }

  loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/dishes/categories`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: (err) => console.error('[DishForm] Error loading categories:', err)
      });
  }

  loadDish(id: string): void {
    this.http.get<DishForm>(`${environment.apiUrl}/dishes/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dish) => this.dish.set(dish),
        error: (err) => {
          console.error('[DishForm] Error loading dish:', err);
          this.notify.error(this.i18n.translate('errors.LOADING_ERROR'));
          this.router.navigate(['/admin/dishes']);
        }
      });
  }

  onImageUploaded(url: string): void {
    this.dish.update((d) => ({ ...d, disher_url_image: url }));
  }

  hasAllergen(code: string): boolean {
    return (this.dish().disher_alergens ?? []).includes(code);
  }

  toggleAllergen(code: string): void {
    const current = this.dish().disher_alergens ?? [];
    const updated = current.includes(code)
      ? current.filter(a => a !== code)
      : [...current, code];
    this.dish.update(d => ({ ...d, disher_alergens: updated }));
  }

  addVariant(): void {
    this.addListItem('variants', INITIAL_VARIANT);
  }

  removeVariant(index: number): void {
    this.removeListItem('variants', index);
  }

  addExtra(): void {
    this.addListItem('extras', INITIAL_EXTRA);
  }

  removeExtra(index: number): void {
    this.removeListItem('extras', index);
  }

  // Helper methods for template type conversion
  getVariantsAsOptions(): OptionItem[] {
    return this.dish().variants as unknown as OptionItem[];
  }

  getExtrasAsOptions(): OptionItem[] {
    return this.dish().extras as unknown as OptionItem[];
  }

  private addListItem(key: 'variants' | 'extras', item: VariantForm | ExtraForm): void {
    this.dish.update((d) => ({
      ...d,
      [key]: [...d[key], item as VariantForm & ExtraForm]
    }));
  }

  private removeListItem(key: 'variants' | 'extras', index: number): void {
    this.dish.update((d) => ({
      ...d,
      [key]: d[key].filter((_, i) => i !== index)
    }));
  }

  save(): void {
    const request$ = this.isEdit 
      ? this.http.patch(`${environment.apiUrl}/dishes/${this.dish()._id}`, this.dish())
      : this.http.post(`${environment.apiUrl}/dishes`, this.dish());
    
    request$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.success(this.i18n.translate(this.isEdit ? 'dish.updated' : 'dish.created'));
          this.router.navigate(['/admin/dishes']);
        },
        error: (err) => {
          console.error('[DishForm] Error saving dish:', err);
          this.notify.error(this.i18n.translate('errors.SERVER_ERROR') + ': ' + (err.error?.message || ''));
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/dishes']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
