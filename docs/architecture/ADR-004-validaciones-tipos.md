# ADR-004: Validaciones y Tipos Compartidos

## Status
Accepted

## Context
Actualmente hay:
- Tipos duplicados entre FE y BE
- Validaciones inconsistentes
- Uso de `any` en múltiples lugares (SMELL-01)
- Enums como strings sin tipado

## Decision
Centralizar **todos** los tipos y validaciones en el paquete `shared/`.

### Estructura de Tipos

```typescript
// shared/src/types/user.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  permissions: Permission[];  // BUG-03: Permission enum, no string
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  permissions?: Permission[];
}
```

```typescript
// shared/src/types/order.types.ts
import { OrderStatus, ItemState } from '../enums';

export interface Order {
  id: string;
  restaurantId: string;
  tableNumber?: number;
  status: OrderStatus;  // SMELL-03: Enum, no magic string
  items: OrderItem[];
  total: number;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
  extras: Extra[];
  state: ItemState;  // 'ORDERED' | 'ON_PREPARE' | 'READY' | 'DELIVERED'
  notes?: string;
}
```

### Enums Compartidos (SMELL-03 fix)

```typescript
// shared/src/enums/permissions.enum.ts
export enum Permission {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  KTS = 'KTS',  // BUG-03 fix: KTS (no KITCHEN)
  CASHIER = 'CASHIER'
}

// shared/src/enums/order-status.enum.ts
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// shared/src/enums/item-state.enum.ts
export enum ItemState {
  ORDERED = 'ORDERED',
  ON_PREPARE = 'ON_PREPARE',
  READY = 'READY',
  DELIVERED = 'DELIVERED'
}
```

### Schemas Zod (Validaciones)

```typescript
// shared/src/schemas/auth.schemas.ts
import { z } from 'zod';
import { Permission } from '../enums';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(6),
  permissions: z.array(z.nativeEnum(Permission)).default([Permission.WAITER])
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
```

```typescript
// shared/src/schemas/order.schemas.ts
import { z } from 'zod';
import { OrderStatus, ItemState } from '../enums';
import { isValidObjectId } from '../utils/objectid';  // BUG-01

const objectIdSchema = z.string().refine(
  (val) => isValidObjectId(val),
  { message: 'Invalid ObjectId format' }
);

export const createOrderSchema = z.object({
  restaurantId: objectIdSchema,  // BUG-01 fix
  tableNumber: z.number().positive().optional(),
  items: z.array(z.object({
    dishId: objectIdSchema,  // BUG-01 fix
    quantity: z.number().positive(),
    variantId: objectIdSchema.optional(),
    extras: z.array(objectIdSchema).default([]),
    notes: z.string().max(500).optional()
  })).min(1, 'Order must have at least one item')
});

export const updateItemStateSchema = z.object({
  itemId: objectIdSchema,
  newState: z.nativeEnum(ItemState)
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateItemStateDto = z.infer<typeof updateItemStateSchema>;
```

```typescript
// shared/src/schemas/dish.schemas.ts
import { z } from 'zod';

// BUG-02 fix: Usar 'allergen' (inglés) consistentemente
export const allergenSchema = z.object({
  allergen_name: z.string(),  // Era 'alergen_name' (typo)
  allergen_description: z.string().optional()
});

export const dishVariantSchema = z.object({
  variant_name: z.string(),
  variant_price: z.number().positive(),
  variant_url_image: z.string().url().optional()  // BUG-08: URL validada
});

export const dishSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  categoryId: z.string(),
  variants: z.array(dishVariantSchema).optional(),
  extras: z.array(z.object({
    name: z.string(),
    price: z.number().positive()
  })).optional(),
  allergens: z.array(allergenSchema).optional(),
  imageUrl: z.string().url().optional()
});

export type DishDto = z.infer<typeof dishSchema>;
export type AllergenDto = z.infer<typeof allergenSchema>;
```

### Helpers Compartidos

```typescript
// shared/src/utils/objectid.ts
import { Types } from 'mongoose';

// BUG-01 fix: Validación centralizada de ObjectId
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

export function toObjectId(id: string): Types.ObjectId {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new Types.ObjectId(id);
}
```

### Exportación Centralizada

```typescript
// shared/src/index.ts
// Enums
export * from './enums/permissions.enum';
export * from './enums/order-status.enum';
export * from './enums/item-state.enum';

// Types
export * from './types/user.types';
export * from './types/order.types';
export * from './types/dish.types';
export * from './types/restaurant.types';

// Schemas
export * from './schemas/auth.schemas';
export * from './schemas/order.schemas';
export * from './schemas/dish.schemas';

// Utils
export * from './utils/objectid';
```

## Consequences

### Positive
- Tipos consistentes entre FE y BE
- Validaciones idénticas en ambos lados
- IDE autocomplete funciona perfectamente
- Cambios centralizados

### Negative
- Necesita build del paquete shared antes de usarlo
- Cambios en shared afectan a todos

## Referencias
- Zod Documentation
- TypeScript Strict Mode
