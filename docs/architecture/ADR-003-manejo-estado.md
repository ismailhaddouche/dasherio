# ADR-003: Manejo de Estado en Frontend

## Status
Accepted

## Context
El frontend actual tiene estado disperso entre servicios, componentes y localStorage. Hay:
- Memory leaks en sockets (BUG-05)
- Estado duplicado entre componentes
- Dificultad para trackear cambios

## Decision
Usar **Angular Signals** para estado global y local.

### Por qué Signals (y no NgRx)
1. **Simplicidad** - Menos boilerplate que NgRx
2. **Performance** - Change detection optimizado
3. **Nativo** - Integrado en Angular 16+
4. **Menos código** - SMELL-01 fix: menos any types

### Estructura de Stores

```typescript
// state/auth.store.ts
import { signal, computed } from '@angular/core';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const authStore = {
  // State
  private readonly _state = signal<AuthState>({
    user: null,
    isLoading: false,
    error: null
  });
  
  // Selectors (computed)
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => !!this._state().user);
  readonly permissions = computed(() => this._state().user?.permissions ?? []);
  readonly hasPermission = (perm: Permission) => 
    computed(() => this.permissions().includes(perm));
  
  // Actions (methods)
  setUser(user: User) {
    this._state.update(s => ({ ...s, user, error: null }));
  }
  
  logout() {
    this._state.set({ user: null, isLoading: false, error: null });
  }
};
```

```typescript
// state/cart.store.ts
interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  config: RestaurantConfig;
}

export const cartStore = {
  private readonly _state = signal<CartState>({
    items: [],
    restaurantId: null,
    config: { taxRate: 0, currency: 'EUR' }  // SMELL-07 fix: default del BE
  });
  
  readonly items = computed(() => this._state().items);
  readonly total = computed(() => 
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  readonly totalWithTax = computed(() => {
    const taxRate = this._state().config.taxRate;
    return this.total() * (1 + taxRate / 100);
  });
  
  addItem(item: CartItem) {
    this._state.update(s => ({ 
      ...s, 
      items: [...s.items, item] 
    }));
  }
  
  removeItem(itemId: string) {
    this._state.update(s => ({
      ...s,
      items: s.items.filter(i => i.id !== itemId)
    }));
  }
  
  clear() {
    this._state.update(s => ({ ...s, items: [] }));
  }
};
```

### Socket Service con Cleanup
```typescript
// services/socket.service.ts
@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly destroy$ = new Subject<void>();
  
  // BUG-05 fix: Singleton pattern con cleanup
  connect(): void {
    if (this.socket?.connected) return;
    
    this.socket = io(environment.wsUrl, { withCredentials: true });
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });
  }
  
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
  
  on<T>(event: string): Observable<T> {
    if (!this.socket) throw new Error('Socket not connected');
    return fromEvent<T>(this.socket, event).pipe(
      takeUntil(this.destroy$)
    );
  }
  
  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
```

### Patrón para Componentes
```typescript
// features/orders/order-list.component.ts
@Component({
  selector: 'app-order-list',
  template: `
    @if (orders(); as orderList) {
      @for (order of orderList; track order.id) {
        <app-order-card [order]="order" />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush  // Performance
})
export class OrderListComponent implements OnInit {
  // Inyectar stores
  private readonly orderService = inject(OrderService);
  
  // Signals locales
  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  
  // Computed
  readonly hasOrders = computed(() => this.orders().length > 0);
  
  async ngOnInit() {
    this.isLoading.set(true);
    try {
      const data = await this.orderService.getOrders();
      this.orders.set(data);
    } catch (e) {
      this.error.set('Failed to load orders');
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## Consequences

### Positive
- Reactividad fina (solo re-renderiza lo necesario)
- Código más limpio sin RxJS complejo
- Fácil de debuggear (signals son síncronos)
- No memory leaks con OnDestroy

### Negative
- Curva de aprendizaje para devs acostumbrados a RxJS
- Menos herramientas de debug que Redux DevTools

## References
- Angular Signals Documentation
- Angular 16+ Reactivity Model
