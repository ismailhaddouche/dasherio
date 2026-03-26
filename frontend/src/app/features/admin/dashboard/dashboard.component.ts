import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { authStore } from '../../../store/auth.store';

interface SalesByDish {
  dishId: string;
  dishName: string;
  quantity: number;
  revenue: number;
}

interface SalesByCategory {
  categoryId: string;
  categoryName: string;
  revenue: number;
  quantity: number;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTicket: number;
}

interface OrderStatus {
  ordered: number;
  onPrepare: number;
  served: number;
  canceled: number;
}

interface DashboardData {
  salesByDish: SalesByDish[];
  salesByCategory: SalesByCategory[];
  paymentStats: PaymentStats;
  orderStatus: OrderStatus;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex items-center justify-between flex-wrap gap-4">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        
        <div class="flex gap-2 items-center">
          <label class="text-sm text-gray-600">From:</label>
          <input 
            type="date" 
            [value]="dateFrom()"
            (change)="onDateFromChange($event)"
            class="border rounded px-2 py-1 text-sm"
          />
          <label class="text-sm text-gray-600">To:</label>
          <input 
            type="date" 
            [value]="dateTo()"
            (change)="onDateToChange($event)"
            class="border rounded px-2 py-1 text-sm"
          />
          
          <button 
            (click)="loadData()"
            class="bg-primary text-white px-4 py-1 rounded text-sm hover:bg-primary-dark"
          >
            Refresh
          </button>
        </div>
      </header>

      @if (error()) {
        <div class="bg-red-100 text-red-700 p-4 rounded-lg">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="flex justify-center py-10">
          <span class="material-symbols-outlined animate-spin">refresh</span>
        </div>
      } @else {
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div class="text-sm text-gray-500">Total Revenue</div>
            <div class="text-2xl font-bold text-primary">{{ data()?.paymentStats?.totalRevenue | currency:'EUR' }}</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div class="text-sm text-gray-500">Transactions</div>
            <div class="text-2xl font-bold">{{ data()?.paymentStats?.totalTransactions }}</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div class="text-sm text-gray-500">Average Ticket</div>
            <div class="text-2xl font-bold">{{ data()?.paymentStats?.averageTicket | currency:'EUR' }}</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div class="text-sm text-gray-500">Items Served</div>
            <div class="text-2xl font-bold text-green-600">{{ data()?.orderStatus?.served }}</div>
          </div>
        </div>

        <!-- Order Status Chart -->
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <h2 class="font-bold mb-4">Order Status</h2>
          <div class="flex gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span class="text-sm">Ordered: {{ data()?.orderStatus?.ordered }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <span class="text-sm">Preparing: {{ data()?.orderStatus?.onPrepare }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span class="text-sm">Served: {{ data()?.orderStatus?.served }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span class="text-sm">Canceled: {{ data()?.orderStatus?.canceled }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top Dishes -->
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <h2 class="font-bold mb-4">Top Dishes</h2>
            <div class="flex flex-col gap-3">
              @for (dish of data()?.salesByDish; track dish.dishId) {
                <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div class="font-medium">{{ dish.dishName }}</div>
                    <div class="text-sm text-gray-500">{{ dish.quantity }} sold</div>
                  </div>
                  <div class="font-bold text-primary">{{ dish.revenue | currency:'EUR' }}</div>
                </div>
              }
              @if (!data()?.salesByDish?.length) {
                <p class="text-gray-500 text-center py-4">No sales data available</p>
              }
            </div>
          </div>

          <!-- Sales by Category -->
          <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <h2 class="font-bold mb-4">Sales by Category</h2>
            <div class="flex flex-col gap-3">
              @for (cat of data()?.salesByCategory; track cat.categoryId) {
                <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div class="font-medium">{{ cat.categoryName }}</div>
                    <div class="text-sm text-gray-500">{{ cat.quantity }} items</div>
                  </div>
                  <div class="font-bold text-primary">{{ cat.revenue | currency:'EUR' }}</div>
                </div>
              }
              @if (!data()?.salesByCategory?.length) {
                <p class="text-gray-500 text-center py-4">No category data available</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  
  data = signal<DashboardData | null>(null);
  loading = signal(false);
  error = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  ngOnInit() {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.dateTo.set(today.toISOString().split('T')[0]);
    this.dateFrom.set(thirtyDaysAgo.toISOString().split('T')[0]);
    
    if (authStore.isAuthenticated()) {
      this.loadData();
    }
  }

  loadData() {
    this.loading.set(true);
    this.error.set('');
    
    const params: Record<string, string> = {};
    if (this.dateFrom()) params.from = this.dateFrom();
    if (this.dateTo()) params.to = this.dateTo();
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${environment.apiUrl}/dashboard/stats${queryString ? '?' + queryString : ''}`;
    
    this.http.get<DashboardData>(url).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Error loading data:', err);
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
      }
    });
  }

  onDateFromChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dateFrom.set(value);
  }

  onDateToChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dateTo.set(value);
  }
}
