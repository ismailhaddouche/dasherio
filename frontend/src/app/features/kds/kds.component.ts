import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { kdsStore } from '../../store/kds.store';
import { SocketService } from '../../services/socket/socket.service';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule, LocalizePipe, TranslatePipe],
  template: `
    <div class="h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 overflow-hidden">
      <header class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-3xl text-primary">restaurant</span>
          <h1 class="text-2xl font-bold">{{ 'kds.title' | translate }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ ordered().length + onPrepare().length }} {{ 'kds.pending' | translate }}</span>
        </div>
      </header>

      <div class="grid grid-cols-2 gap-4 h-[calc(100%-80px)] overflow-auto">
        <!-- ORDERED -->
        <div class="flex flex-col gap-2">
          <h2 class="text-lg font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
            <span class="material-symbols-outlined">pending</span> {{ 'kds.new_orders' | translate }} ({{ ordered().length }})
          </h2>
          @for (item of ordered(); track item._id) {
            <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-yellow-400 shadow-sm">
              <p class="font-semibold text-base text-gray-900 dark:text-white">{{ item.item_name_snapshot | localize }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.createdAt | date:'HH:mm:ss' }}</p>
              <button
                (click)="prepareItem(item._id!)"
                class="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-black rounded py-2 font-bold active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">check_circle</span> {{ 'kds.prepare' | translate }}
              </button>
            </div>
          }
        </div>

        <!-- ON_PREPARE -->
        <div class="flex flex-col gap-2">
          <h2 class="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
            <span class="material-symbols-outlined">cooking</span> {{ 'kds.in_preparation' | translate }} ({{ onPrepare().length }})
          </h2>
          @for (item of onPrepare(); track item._id) {
            <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-green-400 shadow-sm">
              <p class="font-semibold text-base text-gray-900 dark:text-white">{{ item.item_name_snapshot | localize }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.createdAt | date:'HH:mm:ss' }}</p>
              <button
                (click)="serveItem(item._id!)"
                class="mt-2 w-full bg-green-500 hover:bg-green-600 text-white rounded py-2 font-bold active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">done_all</span> {{ 'kds.serve' | translate }}
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class KdsComponent implements OnInit, OnDestroy {
  private socketService = inject(SocketService);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  ordered = kdsStore.ordered;
  onPrepare = kdsStore.onPrepare;

  ngOnInit() {
    // Acquire store reference to prevent cleanup while component is active
    kdsStore.acquireReference();
    // Acquire socket connection for real-time updates
    this.socketService.acquireConnection();
    // BUG-12: was only listening to WS — existing items were invisible on page load
    this.http.get<any[]>(`${environment.apiUrl}/orders/kitchen`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => kdsStore.setItems(items),
        error: (err) => {
          console.error('[KDS] Error loading kitchen items:', err);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // Release socket connection
    this.socketService.releaseConnection();
    // Release store reference (clears store when all components destroyed)
    kdsStore.releaseReference();
  }

  prepareItem(itemId: string) {
    this.socketService.emit('kds:item_prepare', { itemId });
  }

  serveItem(itemId: string) {
    this.socketService.emit('kds:item_serve', { itemId });
  }
}
