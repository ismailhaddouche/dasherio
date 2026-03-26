import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      
      // Dishes
      { 
        path: 'dishes/new', 
        loadComponent: () => import('./dishes/dish-form.component').then(m => m.DishFormComponent) 
      },
      { 
        path: 'dishes/:id', 
        loadComponent: () => import('./dishes/dish-form.component').then(m => m.DishFormComponent) 
      },

      // Categories
      { 
        path: 'categories', 
        loadComponent: () => import('./categories/category-list.component').then(m => m.CategoryListComponent) 
      },
      { 
        path: 'categories/new', 
        loadComponent: () => import('./categories/category-form.component').then(m => m.CategoryFormComponent) 
      },
      { 
        path: 'categories/:id', 
        loadComponent: () => import('./categories/category-form.component').then(m => m.CategoryFormComponent) 
      },

      // Settings
      { 
        path: 'settings', 
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) 
      },
    ]
  }
];
