import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { kdsStore } from '../../store/kds.store';
import { SocketService } from '../../services/socket/socket.service';
import { LocalizePipe } from '../../shared/pipes/localize.pipe';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule, LocalizePipe, TranslatePipe],
  template: `
    <div class="admin-container h-screen">
      <!-- Header -->
      <header class="admin-header">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <span class="material-symbols-outlined text-3xl text-primary">restaurant</span>
          </div>
          <div>
            <h1 class="admin-title">{{ 'kds.title' | translate }}</h1>
            <p class="admin-subtitle">{{ ordered().length + onPrepare().length }} {{ 'kds.pending' | translate }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Connection Status -->
          <span class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                [class.bg-green-100]="isConnected()" 
                [class.text-green-700]="isConnected()"
                [class.dark:bg-green-900/30]="isConnected()"
                [class.dark:text-green-400]="isConnected()"
                [class.bg-red-100]="!isConnected()"
                [class.text-red-700]="!isConnected()"
                [class.dark:bg-red-900/30]="!isConnected()"
                [class.dark:text-red-400]="!isConnected()">
            <span class="w-2 h-2 rounded-full" [class.bg-green-500]="isConnected()" [class.bg-red-500]="!isConnected()"></span>
            {{ isConnected() ? ('kds.connected' | translate) : ('kds.disconnected' | translate) }}
          </span>
          
          <!-- Refresh Button -->
          <button 
            (click)="loadItems()"
            [disabled]="loading()"
            class="btn-admin btn-secondary"
            title="{{ 'common.refresh' | translate }}">
            <span class="material-symbols-outlined" [class.animate-spin]="loading()">refresh</span>
          </button>
        </div>
      </header>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <!-- ORDERED Column -->
        <div class="flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-4">
            <h2 class="flex items-center gap-2 text-lg font-bold text-yellow-700 dark:text-yellow-400">
              <span class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined">pending</span>
              </span>
              {{ 'kds.new_orders' | translate }}
              <span class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm px-2.5 py-0.5 rounded-full font-bold">
                {{ ordered().length }}
              </span>
            </h2>
          </div>
          
          <div class="flex-1 overflow-y-auto space-y-3 pr-2">
            @for (item of ordered(); track item._id) {
              <div class="admin-card border-l-4 border-l-yellow-400"
                   [class.opacity-60]="processingItem() === item._id">
                <div class="p-4">
                  <!-- Item Header -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {{ item.item_name_snapshot | localize }}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ item.createdAt | date:'HH:mm:ss' }}
                      </p>
                    </div>
                    <span class="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full whitespace-nowrap">
                      {{ 'order_state.ordered' | translate }}
                    </span>
                  </div>
                  
                  <!-- Customer Info -->
                  @if (item.customer_name) {
                    <div class="flex items-center gap-2 mt-3 text-sm text-primary">
                      <span class="material-symbols-outlined text-base">person</span>
                      <span class="font-medium">{{ item.customer_name }}</span>
                    </div>
                  }
                  
                  <!-- Price & Extras -->
                  <div class="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-bold text-primary">{{ item.item_base_price | currency:'EUR' }}</span>
                    @if (item.item_disher_extras && item.item_disher_extras.length > 0) {
                      <span class="text-xs">+ {{ item.item_disher_extras.length }} extras</span>
                    }
                  </div>
                  
                  <!-- Action Buttons -->
                  <div class="flex gap-2 mt-4">
                    <button
                      (click)="prepareItem(item._id!)"
                      [disabled]="processingItem() === item._id || !isConnected()"
                      class="flex-1 btn-admin justify-center"
                      [class.btn-primary]="processingAction() !== 'prepare'"
                      [class.bg-yellow-500]="processingAction() !== 'prepare'"
                      [class.hover:bg-yellow-600]="processingAction() !== 'prepare'"
                      [class.text-black]="processingAction() !== 'prepare'"
                      [class.opacity-70]="processingItem() === item._id && processingAction() !== 'prepare'">
                      @if (processingItem() === item._id && processingAction() === 'prepare') {
                        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {{ 'kds.processing' | translate }}
                      } @else {
                        <span class="material-symbols-outlined">play_arrow</span>
                        {{ 'kds.prepare' | translate }}
                      }
                    </button>
                    
                    <button
                      (click)="cancelItem(item._id!)"
                      [disabled]="processingItem() === item._id || !isConnected()"
                      class="btn-admin btn-danger"
                      [class.opacity-70]="processingItem() === item._id && processingAction() !== 'cancel'"
                      title="{{ 'kds.cancel' | translate }}">
                      @if (processingItem() === item._id && processingAction() === 'cancel') {
                        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      } @else {
                        <span class="material-symbols-outlined">close</span>
                      }
                    </button>
                  </div>
                </div>
              </div>
            }
            
            @if (ordered().length === 0) {
              <div class="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                <span class="material-symbols-outlined text-6xl mb-3 opacity-20">check_circle</span>
                <p class="text-lg font-medium">{{ 'kds.no_new_orders' | translate }}</p>
              </div>
            }
          </div>
        </div>

        <!-- ON_PREPARE Column -->
        <div class="flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-4">
            <h2 class="flex items-center gap-2 text-lg font-bold text-blue-700 dark:text-blue-400">
              <span class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span class="material-symbols-outlined">cooking</span>
              </span>
              {{ 'kds.in_preparation' | translate }}
              <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm px-2.5 py-0.5 rounded-full font-bold">
                {{ onPrepare().length }}
              </span>
            </h2>
          </div>
          
          <div class="flex-1 overflow-y-auto space-y-3 pr-2">
            @for (item of onPrepare(); track item._id) {
              <div class="admin-card border-l-4 border-l-blue-400"
                   [class.opacity-60]="processingItem() === item._id">
                <div class="p-4">
                  <!-- Item Header -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {{ item.item_name_snapshot | localize }}
                      </h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ item.createdAt | date:'HH:mm:ss' }}
                      </p>
                    </div>
                    <span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full whitespace-nowrap">
                      {{ 'order_state.preparing' | translate }}
                    </span>
                  </div>
                  
                  <!-- Customer Info -->
                  @if (item.customer_name) {
                    <div class="flex items-center gap-2 mt-3 text-sm text-primary">
                      <span class="material-symbols-outlined text-base">person</span>
                      <span class="font-medium">{{ item.customer_name }}</span>
                    </div>
                  }
                  
                  <!-- Price & Extras -->
                  <div class="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-bold text-primary">{{ item.item_base_price | currency:'EUR' }}</span>
                    @if (item.item_disher_extras && item.item_disher_extras.length > 0) {
                      <span class="text-xs">+ {{ item.item_disher_extras.length }} extras</span>
                    }
                  </div>
                  
                  <!-- Action Button -->
                  <button
                    (click)="serveItem(item._id!)"
                    [disabled]="processingItem() === item._id || !isConnected()"
                    class="w-full btn-admin btn-primary justify-center mt-4"
                    [class.opacity-70]="processingItem() === item._id && processingAction() !== 'serve'">
                    @if (processingItem() === item._id && processingAction() === 'serve') {
                      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      {{ 'kds.processing' | translate }}
                    } @else {
                      <span class="material-symbols-outlined">done_all</span>
                      {{ 'kds.serve' | translate }}
                    }
                  </button>
                </div>
              </div>
            }
            
            @if (onPrepare().length === 0) {
              <div class="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                <span class="material-symbols-outlined text-6xl mb-3 opacity-20">soup_kitchen</span>
                <p class="text-lg font-medium">{{ 'kds.no_preparing' | translate }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class KdsComponent implements OnInit, OnDestroy {
  private socketService = inject(SocketService);
  private http = inject(HttpClient);
  private notify = inject(NotificationService);
  private i18n = inject(I18nService);
  private destroy$ = new Subject<void>();

  ordered = kdsStore.ordered;
  onPrepare = kdsStore.onPrepare;
  
  // Track state
  processingItem = signal<string | null>(null);
  processingAction = signal<'prepare' | 'serve' | 'cancel' | null>(null);
  isConnected = signal(false);
  loading = signal(false);

  ngOnInit() {
    kdsStore.acquireReference();
    this.socketService.acquireConnection();
    
    this.checkConnection();
    const connectionInterval = setInterval(() => this.checkConnection(), 2000);
    this.destroy$.subscribe(() => clearInterval(connectionInterval));
    
    this.setupSocketListeners();
    this.loadItems();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.releaseConnection();
    kdsStore.releaseReference();
  }

  private checkConnection() {
    // @ts-ignore
    const connected = this.socketService['socket']?.connected ?? false;
    this.isConnected.set(connected);
  }

  loadItems() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/orders/kitchen`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          console.log('[KDS] Loaded items:', items.length);
          kdsStore.setItems(items);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[KDS] Error loading kitchen items:', err);
          this.loading.set(false);
          this.notify.error(this.i18n.translate('kds.load_error'));
        },
      });
  }

  private setupSocketListeners() {
    this.socketService.on('kds:error', (error: any) => {
      console.error('[KDS] Socket error:', error);
      this.processingItem.set(null);
      this.processingAction.set(null);
      this.notify.error(error.message || error.details || this.i18n.translate('kds.error_generic'));
    });

    this.socketService.on('kds:item_prepared', (data: { itemId: string; newState: string }) => {
      console.log('[KDS] Item prepared:', data);
      this.processingItem.set(null);
      this.processingAction.set(null);
      kdsStore.updateItemState(data.itemId, 'ON_PREPARE');
      this.notify.success(this.i18n.translate('kds.item_moved_to_preparing'));
    });

    this.socketService.on('kds:item_served', (data: { itemId: string; newState: string }) => {
      console.log('[KDS] Item served:', data);
      this.processingItem.set(null);
      this.processingAction.set(null);
      kdsStore.updateItemState(data.itemId, 'SERVED');
      this.notify.success(this.i18n.translate('kds.item_served'));
    });

    this.socketService.on('kds:item_canceled', (data: { itemId: string; newState: string }) => {
      console.log('[KDS] Item canceled:', data);
      this.processingItem.set(null);
      this.processingAction.set(null);
      kdsStore.updateItemState(data.itemId, 'CANCELED');
      this.notify.success(this.i18n.translate('kds.item_canceled'));
    });

    this.socketService.on('item:state_changed', (data: { itemId: string; newState: string }) => {
      console.log('[KDS] State changed via broadcast:', data);
      kdsStore.updateItemState(data.itemId, data.newState as any);
    });

    this.socketService.on('kds:new_item', (item: any) => {
      console.log('[KDS] New item:', item);
      kdsStore.addItem(item);
      this.notify.info(this.i18n.translate('kds.new_item_received'));
    });

    this.socketService.on('item:deleted', (data: { itemId: string }) => {
      console.log('[KDS] Item deleted:', data);
      kdsStore.removeItem(data.itemId);
    });
  }

  private emitWithTimeout(itemId: string, action: 'prepare' | 'serve' | 'cancel') {
    setTimeout(() => {
      if (this.processingItem() === itemId) {
        console.warn(`[KDS] No response received for ${action}, resetting state`);
        this.processingItem.set(null);
        this.processingAction.set(null);
        this.loadItems();
      }
    }, 5000);
  }

  prepareItem(itemId: string) {
    if (!this.isConnected()) {
      this.notify.error(this.i18n.translate('kds.not_connected'));
      return;
    }
    
    this.processingItem.set(itemId);
    this.processingAction.set('prepare');
    this.emitWithTimeout(itemId, 'prepare');
    this.socketService.emit('kds:item_prepare', { itemId });
  }

  serveItem(itemId: string) {
    if (!this.isConnected()) {
      this.notify.error(this.i18n.translate('kds.not_connected'));
      return;
    }
    
    this.processingItem.set(itemId);
    this.processingAction.set('serve');
    this.emitWithTimeout(itemId, 'serve');
    this.socketService.emit('kds:item_serve', { itemId });
  }

  cancelItem(itemId: string) {
    if (!this.isConnected()) {
      this.notify.error(this.i18n.translate('kds.not_connected'));
      return;
    }
    
    if (!confirm(this.i18n.translate('kds.confirm_cancel'))) {
      return;
    }
    
    this.processingItem.set(itemId);
    this.processingAction.set('cancel');
    this.emitWithTimeout(itemId, 'cancel');
    this.socketService.emit('kds:item_cancel', { itemId, reason: 'Cancelled by kitchen staff' });
  }
}
