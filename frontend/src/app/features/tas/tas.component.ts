import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-tas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header class="bg-white dark:bg-gray-800 shadow px-4 py-3 flex items-center gap-2">
        <span class="material-symbols-outlined text-2xl">room_service</span>
        <h1 class="text-xl font-bold">Servicio de Mesa (TAS)</h1>
      </header>

      <main class="flex-1 p-4 grid grid-cols-3 gap-3 overflow-auto">
        <!-- Table cards would be rendered here -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-2 shadow">
          <span class="material-symbols-outlined text-4xl text-gray-400">table_restaurant</span>
          <p class="text-sm text-gray-400">Sin sesiones activas</p>
        </div>
      </main>
    </div>
  `,
})
export class TasComponent {}
