# Contratos de API - DisherIO Refactor

> **Versión:** 1.0  
> **Fecha:** 2026-03-26  
> **Base URL:** `/api/v1`

---

## Índice

1. [Autenticación](#autenticación)
2. [Restaurantes](#restaurantes)
3. [Platos (Dishes)](#platos-dishes)
4. [Órdenes](#órdenes)
5. [Kitchen Display System (KDS)](#kitchen-display-system-kds)
6. [Totems](#totems)
7. [Usuarios](#usuarios)

---

## Autenticación

### POST `/auth/login`
Login de usuario con email/password.

**Request:**
```typescript
interface LoginRequest {
  email: string;      // email válido
  password: string;   // min 6 chars
}
```

**Response 200:**
```typescript
interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    permissions: Permission[];
    restaurantId: string;
  };
  token: string;  // JWT
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials
- `429` - Too many requests (SEC-02)

---

### POST `/auth/login-pin`
Login de staff con PIN.

**Request:**
```typescript
interface LoginPinRequest {
  restaurantId: string;  // ObjectId validado
  pin: string;           // 4-6 dígitos
}
```

**Response 200:** `LoginResponse`

**Errors:**
- `400` - Invalid PIN format
- `401` - Invalid PIN
- `429` - Too many attempts

---

### POST `/auth/logout`
Logout (invalida token).

**Headers:**
- `Authorization: Bearer {token}`

**Response 200:**
```typescript
{ success: true }
```

---

### GET `/auth/me`
Obtener usuario actual.

**Headers:**
- `Authorization: Bearer {token}`

**Response 200:** `User`

---

## Restaurantes

### GET `/restaurants/:id`
Obtener restaurante por ID.

**Params:**
- `id` - ObjectId válido (BUG-01 fix)

**Response 200:**
```typescript
interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  config: {
    taxRate: number;
    currency: string;
    languages: string[];
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

### GET `/restaurants/:id/config`
Obtener configuración pública del restaurante (para totems).

**Response 200:**
```typescript
interface RestaurantConfig {
  taxRate: number;
  currency: string;
  languages: string[];
  theme?: {
    primaryColor: string;
    logoUrl?: string;
  };
}
```

---

### PATCH `/restaurants/:id/config`
Actualizar configuración.

**Auth:** Admin o Manager del restaurante

**Request:** `Partial<RestaurantConfig>`

**Response 200:** `RestaurantConfig`

---

## Platos (Dishes)

### GET `/restaurants/:restaurantId/dishes`
Listar platos activos de un restaurante.

**Query Params:**
- `categoryId` (optional) - Filtrar por categoría
- `includeInactive` (optional) - boolean, default false

**Response 200:**
```typescript
interface DishListResponse {
  dishes: Dish[];
  categories: Category[];
}

interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;
  variants: DishVariant[];
  extras: Extra[];
  allergens: Allergen[];  // BUG-02: 'allergen' consistente
  disherStatus: 'active' | 'inactive';
}
```

---

### GET `/dishes/:id`
Obtener plato por ID.

**Params:**
- `id` - ObjectId válido

**Response 200:** `Dish`

**Errors:**
- `404` - Dish not found

---

### POST `/restaurants/:restaurantId/dishes`
Crear nuevo plato.

**Auth:** Admin, Manager

**Request:** `CreateDishDto` (from shared/schemas)

**Response 201:** `Dish`

---

### PATCH `/dishes/:id`
Actualizar plato.

**Auth:** Admin, Manager

**Request:** `Partial<CreateDishDto>`

**Response 200:** `Dish`

---

### DELETE `/dishes/:id`
Eliminar plato (soft delete).

**Auth:** Admin, Manager

**Response 204:** No content

---

## Órdenes

### GET `/restaurants/:restaurantId/orders`
Listar órdenes del restaurante.

**Query Params:**
- `status` (optional) - Filtrar por estado
- `from` (optional) - Fecha inicio (ISO)
- `to` (optional) - Fecha fin (ISO)
- `page` (optional) - Número de página (MEJ-02)
- `limit` (optional) - Items por página, default 20

**Response 200:**
```typescript
interface OrderListResponse {
  orders: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrderSummary {
  id: string;
  tableNumber?: number;
  status: OrderStatus;  // Enum
  total: number;
  itemCount: number;
  createdAt: string;
}
```

---

### GET `/orders/:id`
Obtener orden completa.

**Response 200:**
```typescript
interface Order {
  id: string;
  restaurantId: string;
  tableNumber?: number;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  taxAmount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;  // User o Totem
}

interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  extras: {
    name: string;
    price: number;
  }[];
  state: ItemState;  // Enum, no magic string
  notes?: string;
}
```

---

### POST `/restaurants/:restaurantId/orders`
Crear nueva orden.

**Auth:** Totem, Waiter, Admin, Manager

**Request:** `CreateOrderDto` (from shared/schemas)

**Response 201:** `Order`

**Errors:**
- `400` - Invalid data (Zod validation)
- `404` - Dish not found

---

### POST `/orders/:orderId/items`
Agregar item a orden existente.

**Request:**
```typescript
interface AddItemRequest {
  dishId: string;       // ObjectId validado
  quantity: number;
  variantId?: string;
  extras?: string[];    // IDs de extras validados
  notes?: string;
}
```

**Response 200:** `Order`

**Errors:**
- `400` - Invalid dish or extras (BUG-07 fix)
- `404` - Order not found

---

## Kitchen Display System (KDS)

### WebSocket Events

#### Conexión
```javascript
const socket = io('/kds', {
  auth: { token: 'JWT_TOKEN' }
});
```

#### Eventos Emitidos (Client → Server)

##### `kds:join`
Unirse a la sala del restaurante.
```typescript
{ restaurantId: string }
```

##### `kds:item:update`
Actualizar estado de un item.
```typescript
interface UpdateItemStateEvent {
  itemId: string;
  newState: ItemState;  // 'ON_PREPARE' | 'READY' | 'DELIVERED'
}
```

##### `kds:items:claim`
Tomar items para preparar.
```typescript
{ itemIds: string[] }
```

#### Eventos Recibidos (Server → Client)

##### `kds:items:list`
Lista inicial de items pendientes.
```typescript
interface KitchenItem {
  id: string;
  orderId: string;
  dishName: string;
  quantity: number;
  extras: string[];
  state: ItemState;
  notes?: string;
  createdAt: string;
  priority: 'normal' | 'high' | 'urgent';
}
```

##### `kds:item:updated`
Un item fue actualizado.
```typescript
{
  item: KitchenItem;
  updatedBy: string;  // User ID
  timestamp: string;
}
```

##### `kds:item:new`
Nuevo item ingresado a cocina.
```typescript
{ item: KitchenItem }
```

##### `kds:error`
Error en operación.
```typescript
{
  code: string;
  message: string;
}
```

### Auth KDS (BUG-03 fix)
```typescript
// Permiso requerido: Permission.KTS
// (antes era 'KITCHEN', ahora consistente)
```

---

## Totems

### POST `/totems/validate-qr`
Validar QR de totem.

**Request:**
```typescript
interface ValidateQrRequest {
  qrCode: string;
}
```

**Response 200:**
```typescript
interface TotemSession {
  sessionId: string;
  restaurantId: string;
  tableNumber?: number;
  token: string;  // JWT de sesión de totem
}
```

**Errors:**
- `400` - Invalid QR code
- `429` - Too many attempts (SEC-02)

---

### POST `/totems/:totemId/session`
Crear sesión de totem (después de validar QR).

**Response 201:** `TotemSession`

---

## Usuarios

### GET `/users`
Listar usuarios del restaurante.

**Auth:** Admin, Manager

**Response 200:** `User[]`

---

### GET `/users/:id`
Obtener usuario.

**Response 200:** `User`

---

### POST `/restaurants/:restaurantId/users`
Crear usuario.

**Auth:** Admin, Manager

**Request:** `CreateUserDto`

**Response 201:** `User`

---

### PATCH `/users/:id`
Actualizar usuario.

**Auth:** Admin, Manager (solo de su restaurante), el propio usuario

**Request:** `Partial<CreateUserDto>`

**Response 200:** `User`

---

### DELETE `/users/:id`
Eliminar usuario.

**Auth:** Admin

**Response 204:** No content

---

## Errores Globales

### Formato de Error
```typescript
interface ApiError {
  status: number;
  code: string;         // Código de error machine-readable
  message: string;      // Mensaje human-readable
  details?: unknown;    // Detalles adicionales (solo en dev)
  requestId: string;    // Para trackeo (MEJ-07)
}
```

### Códigos Comunes
- `INVALID_INPUT` - Datos de entrada inválidos
- `NOT_FOUND` - Recurso no encontrado
- `UNAUTHORIZED` - No autenticado
- `FORBIDDEN` - Sin permisos
- `VALIDATION_ERROR` - Error de validación Zod
- `RATE_LIMITED` - Demasiadas peticiones
- `INTERNAL_ERROR` - Error interno (sin detalles en prod)

---

## Autenticación

Todas las rutas protegidas requieren header:
```
Authorization: Bearer {jwt_token}
```

El token se obtiene en `/auth/login` o `/auth/login-pin`.

---

## Changelog

### v1.0 (2026-03-26)
- Definición inicial de contratos
- Fix BUG-01: Validación de ObjectId en parámetros
- Fix BUG-03: Permisos consistentes (KTS)
- Fix BUG-02: Naming consistente de allergens
- SEC-02: Rate limiting en auth endpoints
