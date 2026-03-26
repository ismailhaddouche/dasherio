# Análisis de Código - DisherIO

**Fecha:** 2026-03-26  
**Proyecto:** disherio-github  
**Stack:** Angular 21 + Express 5 + MongoDB + TypeScript  
**Tipo de análisis:** Estático (sin ejecución de servidores)

---

## 📊 Resumen Ejecutivo

| Categoría | Count | Severidad |
|-----------|-------|-----------|
| Bugs Potenciales | 8 | Alta: 3, Media: 3, Baja: 2 |
| Code Smells | 12 | Media |
| Problemas de Seguridad | 4 | Alta: 2, Media: 2 |
| Mejoras Sugeridas | 10 | Baja |

---

## 🐛 BUGS POTENCIALES

### BUG-01: Falta validación de ObjectId en múltiples servicios
**Archivo:** `backend/src/services/*.ts` (varios)  
**Severidad:** 🔴 **ALTA**

```typescript
// PROBLEMA: No se valida restaurantId antes de usarlo
export async function getKitchenItems(restaurantId: string) {
  // Falta: if (!Types.ObjectId.isValid(restaurantId))
  const totems = await Totem.find({ restaurant_id: restaurantId }).select('_id').lean();
  // ...
}
```

**Impacto:** Puede causar errores 500 si se envía un ID malformado.  
**Solución:** Agregar validación consistente en todos los servicios.

---

### BUG-02: Error tipográfico en manejo de alérgenos
**Archivo:** `backend/src/models/dish.model.ts`  
**Severidad:** 🟡 **MEDIA**

```typescript
// PROBLEMA: "alergen" vs "allergen" inconsistente
export interface IAllergen {
  alergen_name: { ... }  // ← "alergen" (español/typo)
}
// Schema Zod usa: allergen_name (inglés correcto)
```

**Impacto:** Inconsistencia en naming que puede causar bugs de integración.  
**Solución:** Estandarizar a `allergen` (inglés) en todo el codebase.

---

### BUG-03: Permiso 'KITCHEN' vs 'KTS' inconsistente
**Archivo:** `backend/src/sockets/kds.handler.ts` vs `backend/src/abilities/abilities.ts`  
**Severidad:** 🔴 **ALTA**

```typescript
// kds.handler.ts
if (!user || !user.permissions.includes('KITCHEN')) {  // ← 'KITCHEN'

// abilities.ts
if (perms.has('KTS')) {  // ← 'KTS'
  can('read', 'KDS');
}
```

**Impacto:** Los usuarios con permiso 'KTS' no pueden acceder al KDS vía WebSocket.  
**Solución:** Usar 'KTS' consistentemente o agregar ambos permisos al validador de socket.

---

### BUG-04: Manejo de errores inconsistente en controladores
**Archivo:** `backend/src/controllers/order.controller.ts`  
**Severidad:** 🟡 **MEDIA**

```typescript
// PROBLEMA: Algunos errores no tienen mensaje específico
export async function getKitchenItems(req: Request, res: Response): Promise<void> {
  try {
    const items = await OrderService.getKitchenItems(req.user!.restaurantId);
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Server error' });  // ← Sin detalles del error
  }
}
```

**Impacto:** Dificulta el debugging en producción.  
**Solución:** Loggear el error antes de enviar respuesta genérica.

---

### BUG-05: Memory Leak potencial en Socket.IO
**Archivo:** `frontend/src/app/services/socket/socket.service.ts`  
**Severidad:** 🟡 **MEDIA**

```typescript
// PROBLEMA: El socket no se desconecta al cambiar de componente
connect(): void {
  if (this.socket?.connected) return;
  this.socket = io(environment.wsUrl, { withCredentials: true });
  // Los listeners se acumulan si connect() se llama múltiples veces
}
```

**Impacto:** Múltiples conexiones simultáneas si el componente se monta/desmonta rápidamente.  
**Solución:** Agregar guarda más robusta y cleanup en ngOnDestroy.

---

### BUG-06: Race condition en actualización de estado KDS
**Archivo:** `backend/src/sockets/kds.handler.ts`  
**Severidad:** 🟡 **MEDIA**

```typescript
// PROBLEMA: findOneAndUpdate puede fallar silenciosamente
const item = await ItemOrder.findOneAndUpdate(
  { _id: itemId, item_state: 'ORDERED' },
  { item_state: 'ON_PREPARE' },
  { new: true }
);
if (!item) {
  logger.warn(...);  // Solo log, no hay respuesta al cliente
  return;
}
```

**Impacto:** El cliente no sabe si su acción fue exitosa o falló.  
**Solución:** Emitir evento de error al socket o usar callback.

---

### BUG-07: Validación de extras incompleta
**Archivo:** `backend/src/services/order.service.ts`  
**Severidad:** 🟢 **BAJA**

```typescript
// PROBLEMA: No se valida que los extras pertenezcan al dish
const extraItems = dish.extras.filter((e: any) => extras.includes(e._id.toString()));
// Si un extra no existe, simplemente se ignora - debería dar error
```

**Impacto:** Pedidos con extras inválidos pueden procesarse sin alertar.  
**Solución:** Validar que todos los extras solicitados existan en el dish.

---

### BUG-08: URL de imagen sin validación
**Archivo:** `shared/schemas/dish.schema.ts`  
**Severidad:** 🟢 **BAJA**

```typescript
// PROBLEMA: URL opcional pero sin restricciones de dominio
variant_url_image: z.string().url().optional(),
```

**Impacto:** Posible XSS via URLs de imágenes maliciosas (javascript:).  
**Solución:** Validar que sea URL de imagen (http/https) y considerar CSP.

---

## 🔒 PROBLEMAS DE SEGURIDAD

### SEC-01: JWT_SECRET con fallback inseguro
**Archivo:** `backend/src/services/auth.service.ts`  
**Severidad:** 🔴 **ALTA**

```typescript
// PROBLEMA: Fallback 'changeme' permite arranque sin configuración
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// La validación solo ocurre después
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'changeme') {
  throw new Error('JWT_SECRET must be configured in production');
}
```

**Riesgo:** Si NODE_ENV no está seteado correctamente, usa secret predeterminado.  
**Solución:** Requerir JWT_SECRET explícitamente, sin fallback.

---

### SEC-02: Rate limit no aplicado a rutas de autenticación de totem
**Archivo:** `backend/src/routes/totem.routes.ts`  
**Severidad:** 🟡 **MEDIA**

```typescript
// Falta revisar si estas rutas tienen rate limiting apropiado
// Los endpoints de QR podrían ser vulnerables a fuerza bruta
```

**Riesgo:** Fuerza bruta en tokens QR para acceder a sesiones.  
**Solución:** Aplicar rate limiting específico para endpoints de totem.

---

### SEC-03: Información de stack en errores
**Archivo:** `backend/src/middlewares/validate.ts`  
**Severidad:** 🟡 **MEDIA**

```typescript
// PROBLEMA: Podría exponer información interna
res.status(400).json({ errors: result.error.flatten().fieldErrors });
```

**Riesgo:** En modo debug, podría exponer detalles de implementación.  
**Solución:** Sanitizar errores en producción.

---

### SEC-04: No hay sanitización de nombres de archivo
**Archivo:** `backend/src/routes/image.routes.ts` (inferred)  
**Severidad:** 🟢 **BAJA**

```typescript
// PROBLEMA potencial: Si no se sanitiza, podría haber path traversal
// No se pudo verificar el código completo del image service
```

---

## 🦨 CODE SMELLS

### SMELL-01: `any` types abundantes
**Ubicación:** Múltiples archivos

```typescript
// Ejemplos encontrados:
export async function createDish(data: any) { ... }
export async function updateDish(dishId: string, data: any) { ... }
export async function createCategory(data: any) { ... }
// En variant/extra también
```

**Impacto:** Pierde beneficios de TypeScript.  
**Solución:** Definir interfaces específicas para cada operación.

---

### SMELL-02: Duplicación de código de abilities
**Archivos:** `backend/src/abilities/abilities.ts` y `frontend/src/app/core/casl/ability.factory.ts`

El código de definición de permisos CASL está duplicado entre frontend y backend.

**Impacto:** Riesgo de inconsistencia si se modifica uno y no el otro.  
**Solución:** Compartir la lógica desde el paquete `shared/`.

---

### SMELL-03: Magic strings para estados
**Archivo:** `backend/src/services/order.service.ts`

```typescript
item_state: { $in: ['ORDERED', 'ON_PREPARE'] },  // Magic strings
// vs usar enum
```

**Solución:** Definir enums TypeScript y usarlos consistentemente.

---

### SMELL-04: Lógica de negocio en controladores
**Archivo:** `backend/src/controllers/order.controller.ts`

Los controladores manejan lógica de validación de errores que debería estar centralizada.

**Solución:** Middleware de error handling uniforme.

---

### SMELL-05: Uso de `as any` en mongoose
**Archivo:** `backend/src/models/*.ts`

```typescript
const restaurantId = (session.totem_id as any).restaurant_id;
```

**Solución:** Usar populate tipado o interfaces correctas de mongoose.

---

### SMELL-06: Comentarios de BUGs en código
**Archivos:** Varios archivos tienen comentarios `// BUG-XX:`

```typescript
// BUG-05: return all active kitchen items for the restaurant
// BUG-06: decode JWT payload so _user is populated on page refresh
// BUG-10: deleting a totem left active sessions orphaned
```

**Solución:** Mover estos comentarios a issues del sistema de tracking.

---

### SMELL-07: Valores por defecto en frontend y backend desincronizados
**Archivo:** `frontend/src/app/store/cart.store.ts`

```typescript
const _config = signal<RestaurantConfig>({
  taxRate: 10, // Default 10%
  // Pero el backend puede tener otro default
});
```

**Solución:** Sincronizar defaults o obtenerlos del backend.

---

### SMELL-08: Funciones con muchas responsabilidades
**Archivo:** `backend/src/services/order.service.ts`

```typescript
export async function addItemToOrder(
  orderId: string, 
  sessionId: string, 
  dishId: string, 
  customerId?: string, 
  variantId?: string, 
  extras: string[] = []
) { ... }
```

**Solución:** Usar patrón Builder o descomponer en pasos.

---

### SMELL-09: CORS muy permisivo en desarrollo
**Archivo:** `backend/src/middlewares/security.ts`

```typescript
: ['http://localhost:4200', 'http://localhost:3000']  // Demasiados puertos
```

**Solución:** Limitar a un solo puerto de desarrollo.

---

### SMELL-10: Uso de `console.error` en vez de logger
**Archivo:** `backend/src/middlewares/security.ts`

```typescript
console.error('ERROR: FRONTEND_URL must be set in production');
// vs usar el logger de pino configurado
```

---

### SMELL-11: Validación de pin ineficiente
**Archivo:** `backend/src/services/auth.service.ts`

```typescript
// Itera TODOS los staff del restaurante para encontrar PIN
for (const staff of staffMembers) {
  const pinMatch = await bcrypt.compare(pin, staff.pin_code_hash);
  // ...
}
```

**Impacto:** O(n) comparaciones de bcrypt (costosas) por login.  
**Solución:** Considerar HMAC o derivación determinista para PINs.

---

### SMELL-12: Dependencia circular potencial
**Archivo:** `backend/src/config/socket.ts`

```typescript
import { registerKdsHandlers } from '../sockets/kds.handler';
// kds.handler importa de models
// models podrían importar de services que usen socket
```

**Solución:** Verificar con `madge` o similar.

---

## 💡 MEJORAS SUGERIDAS

### MEJ-01: Implementar API versioning
```typescript
// Actual:
app.use('/api/auth', authRoutes);
// Sugerido:
app.use('/api/v1/auth', authRoutes);
```

### MEJ-02: Agregar paginación
Los endpoints como `getKitchenItems` y `getDishesByRestaurant` deberían soportar paginación.

### MEJ-03: Implementar soft deletes
En lugar de `findByIdAndDelete`, usar campo `deletedAt`.

### MEJ-04: Agregar índices de base de datos
Verificar que existan índices para:
- `{ restaurant_id: 1, disher_status: 1 }` en dishes
- `{ totem_qr: 1 }` en totems (ya tiene unique)
- `{ session_id: 1, item_state: 1 }` en itemOrders

### MEJ-05: Implementar health check más completo
```typescript
// Actual: solo retorna { status: 'ok' }
// Sugerido: verificar DB, Redis, etc.
```

### MEJ-06: Agregar OpenAPI/Swagger
Documentar la API con Swagger para mejor DX.

### MEJ-07: Implementar request ID tracing
Para trazar requests a través de logs.

### MEJ-08: Usar transacciones de MongoDB
Operaciones como `createOrder` + `addItem` deberían ser atómicas.

### MEJ-09: Implementar caching
Para datos frecuentes como menús y configuraciones.

### MEJ-10: Agregar métricas
Integrar con Prometheus/Datadog para monitoreo.

---

## 📁 Estructura del Proyecto

```
disherio/
├── backend/
│   ├── src/
│   │   ├── abilities/        # CASL abilities
│   │   ├── config/           # DB, logger, i18n, socket
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/      # Auth, validation, security
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── sockets/          # Socket.IO handlers
│   │   └── utils/            # Tax utilities
│   └── __tests__/            # Unit tests
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── core/         # Guards, interceptors
│       │   ├── features/     # Components
│       │   ├── services/     # Socket service
│       │   ├── shared/       # Pipes, directives
│       │   └── store/        # Signals stores
│       └── environments/
└── shared/
    ├── schemas/              # Zod schemas
    └── types/                # TypeScript types
```

---

## ✅ Checklist de Calidad

| Aspecto | Estado | Notas |
|---------|--------|-------|
| TypeScript strict | ⚠️ | Muchos `any` |
| Tests unitarios | ✅ | Jest configurado, tests presentes |
| Tests de integración | ❌ | No encontrados |
| Linting | ❓ | No verificado |
| Formato consistente | ✅ | Bien en general |
| Documentación | ⚠️ | Comentarios mínimos |
| Manejo de errores | ⚠️ | Inconsistente |
| Seguridad básica | ✅ | Helmet, CORS, rate limiting |
| WebSocket auth | ✅ | Implementado |
| i18n | ✅ | Implementado (es/en/fr/ar) |

---

## 🎯 Prioridades de Arreglo

### Inmediato (Esta semana)
1. **BUG-03:** Sincronizar permisos 'KITCHEN'/'KTS'
2. **SEC-01:** Eliminar fallback de JWT_SECRET
3. **BUG-01:** Agregar validación de ObjectId faltante

### Corto plazo (Este mes)
4. **BUG-02:** Estandarizar naming de alérgenos
5. **BUG-05:** Fix memory leak en sockets
6. **SMELL-01:** Reducir uso de `any`
7. **MEJ-04:** Verificar/agregar índices de MongoDB

### Mediano plazo
8. Implementar tests de integración
9. Agregar OpenAPI/Swagger
10. Implementar paginación

---

*Generado por: Dev Agent - DisherIO Analysis*  
*Metodología: Análisis estático de código fuente*
