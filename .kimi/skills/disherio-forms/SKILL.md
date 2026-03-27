# DisherIO - Patrón de Formularios

Skill para mantener consistencia en los formularios de administración de DisherIO.

## Estructura del Header (Estándar)

Todos los formularios deben tener el mismo layout de header:

```typescript
<header class="flex items-center justify-between mb-6">
  <div>
    <a routerLink="/admin/ruta" class="text-gray-600 dark:text-gray-400 hover:text-primary flex items-center gap-1 mb-2">
      <span class="material-symbols-outlined text-sm">arrow_back</span>
      Volver a [sección]
    </a>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      {{ isEditMode ? 'Editar' : 'Nuevo' }} [Entidad]
    </h1>
  </div>
  <div class="flex gap-2">
    <a routerLink="/admin/ruta" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">
      Cancelar
    </a>
    <button
      type="button"
      (click)="onSubmit()"
      [disabled]="form.invalid || submitting()"
      class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
    >
      <span *ngIf="!submitting()">{{ isEditMode ? 'Guardar Cambios' : 'Crear [Entidad]' }}</span>
      <span *ngIf="submitting()">Guardando...</span>
    </button>
  </div>
</header>
```

## Estructura del Formulario

```typescript
<form [formGroup]="form" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <!-- Campos del formulario -->
</form>
```

## Estilos de Inputs

### Input estándar
```typescript
<input
  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
  [class.border-red-500]="form.get('field')?.invalid && form.get('field')?.touched"
/>
```

### Select
```typescript
<select
  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
>
```

### Labels
```typescript
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  Nombre del campo *
</label>
```

### Mensajes de error
```typescript
<div *ngIf="form.get('field')?.invalid && form.get('field')?.touched" class="text-red-500 text-sm mt-1">
  Mensaje de error
</div>
```

### Texto de ayuda
```typescript
<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
  Texto descriptivo o de ayuda
</p>
```

## Alerts

### Error
```typescript
<div *ngIf="error()" class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
  {{ error() }}
</div>
```

### Éxito
```typescript
<div *ngIf="success()" class="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
  {{ success() }}
</div>
```

## Ejemplo Completo - Componente

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <!-- Header -->
      <header class="flex items-center justify-between mb-6">
        <div>
          <a routerLink="/admin/entities" class="text-gray-600 dark:text-gray-400 hover:text-primary flex items-center gap-1 mb-2">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            Volver a entidades
          </a>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode ? 'Editar' : 'Nuevo' }} Entidad
          </h1>
        </div>
        <div class="flex gap-2">
          <a routerLink="/admin/entities" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">
            Cancelar
          </a>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="form.invalid || submitting()"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <span *ngIf="!submitting()">{{ isEditMode ? 'Guardar Cambios' : 'Crear Entidad' }}</span>
            <span *ngIf="submitting()">Guardando...</span>
          </button>
        </div>
      </header>

      <!-- Alerts -->
      <div *ngIf="error()" class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
        {{ error() }}
      </div>

      <div *ngIf="success()" class="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
        {{ success() }}
      </div>

      <!-- Form -->
      <form [formGroup]="form" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre *
          </label>
          <input
            formControlName="name"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            [class.border-red-500]="form.get('name')?.invalid && form.get('name')?.touched"
          />
          <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-red-500 text-sm mt-1">
            El nombre es obligatorio
          </div>
        </div>
      </form>
    </div>
  `
})
export class EntityFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  isEditMode = false;
  entityId: string | null = null;

  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.entityId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.entityId;
    if (this.isEditMode && this.entityId) {
      this.loadEntity(this.entityId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
  }

  loadEntity(id: string): void {
    // Cargar datos
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    // Guardar...
  }
}
```

## Lista de Formularios Implementados

- ✅ `dish-form.component.ts` - Platos
- ✅ `category-form.component.ts` - Categorías
- ✅ `totem-form.component.ts` - Tótems
- ✅ `staff-form.component.ts` - Personal
- ✅ `settings.component.ts` - Configuración

## Reglas

1. **Botones siempre arriba** - El header debe incluir los botones de acción
2. **"Cancelar" a la izquierda** - Link gris que vuelve a la lista
3. **"Guardar" a la derecha** - Botón primario (bg-primary)
4. **Iconos Material Symbols** - Usar `material-symbols-outlined`
5. **Dark mode support** - Todas las clases deben incluir variantes `dark:`
6. **Estados de carga** - Mostrar "Guardando..." durante el submit
7. **Validación visual** - Borde rojo en campos inválidos tocados
