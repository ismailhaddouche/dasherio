# REVIEW REPORT - DisherIo Refactor (Frontend)

**Fecha:** 2026-03-26  
**Revisor:** rev-disherio-review  
**Scope:** Frontend Angular (`projects/disherio-refactor/frontend/`)

---

## 📊 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| Archivos TypeScript | 53 | - |
| Líneas de código | ~6,325 | - |
| Tests encontrados | 1 archivo | ⚠️ BAJA |
| TypeScript Strict | Habilitado | ✅ |
| Componentes Standalone | 100% | ✅ |
| Ciclos de dependencias | No detectados | ✅ |

**Veredicto general:** Código bien estructurado con buena arquitectura, pero **cobertura de tests críticamente baja**.

---

## ✅ Aspectos Positivos

### 1. Arquitectura Limpia
- ✅ **Clean Architecture**: Separación clara en `core/`, `features/`, `shared/`, `store/`
- ✅ **Repository Pattern**: Stores con signals funcionan como repositorios de estado
- ✅ **Lazy Loading**: Rutas usan `loadComponent` y `loadChildren` correctamente

### 2. TypeScript Strict
```json
// tsconfig.json
"strict": true,
"noImplicitOverride": true,
"noPropertyAccessFromIndexSignature": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true
```
- ✅ Strict mode completamente habilitado
- ✅ Angular compiler strict también activo

### 3. Uso Correcto de Signals
- ✅ Stores implementados con `signal()` y `computed()`
- ✅ Uso de `asReadonly()` para señales privadas
- ✅ Efectos reactivos en directivas (caslCan)

```typescript
// Ejemplo correcto en auth.store.ts
const _token = signal<string | null>(storedToken);
const _user = signal<AuthUser | null>(storedToken ? decodeJwt(storedToken) : null);
export const authStore = {
  user: _user.asReadonly(),
  // ...
};
```

### 4. Componentes Standalone
- ✅ Todos los componentes son `standalone: true`
- ✅ Imports explícitos en cada componente
- ✅ Sin módulos innecesarios

### 5. Guards Implementados Correctamente (BUG-03 ✅ ARREGLADO)

**role.guard.ts:**
```typescript
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const required: string[] = route.data['permissions'] || [];
  const user = authStore.user();
  if (!user) return router.createUrlTree(['/login']);
  const hasRole = required.some((p) => user.permissions.includes(p));
  // ...
};
```

**app.routes.ts:**
```typescript
{
  path: 'kds',
  canActivate: [authGuard, roleGuard],
  data: { permissions: ['KTS', 'ADMIN'] },  // ✅ KTS permisos correctos
}
```

### 6. JWT Interceptor Limpio (SEC-01 ✅)
```typescript
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authStore.token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```
- ✅ Sin fallback a token hardcodeado
- ✅ Sin `|| 'fallback-token'`

---

## ⚠️ Issues Encontrados

### 🔴 CRITICAL: Cobertura de Tests Inexistente

| Aspecto | Estado |
|---------|--------|
| Archivos de test | 1 (`app.spec.ts`) |
| Tests de componentes | 0 |
| Tests de stores | 0 |
| Tests de guards | 0 |
| Tests de servicios | 0 |

**Impacto:** Cambios en stores o lógica de negocio pueden romper funcionalidad sin detección.

**Recomendación:** Crear tests mínimos para:
- `auth.store.ts` - login/logout, decodeJwt
- `cart.store.ts` - cálculos de totales, add/remove items
- `kds.store.ts` - filtros de estado
- Guards - permisos, redirecciones

---

### 🟡 MEDIUM: Uso de `any` en el código

**Ubicaciones encontradas:**

```typescript
// dish-form.component.ts:133
variants: d.variants.filter((_: any, i: number) => i !== index)

// totem.component.ts:129, 142
categories: any[]; dishes: any[]
addToCart(dish: any)

// socket.service.ts:13, 16, 30
newState: any
item: any
data: any

// image-uploader.component.ts:54
onFileSelected(event: any)

// casl.directive.ts:23
ability.can(action as any, subject as any)

// localize.pipe.ts:17
return (value as any)[lang]
```

**Recomendación:** Definir interfaces para:
- `Dish`, `Category`, `Variant`, `Extra`
- `SocketEventData`, `KdsItem` (ya existe pero socket usa any)
- `FileSelectEvent` (usar `Event` tipado)

---

### 🟡 MEDIUM: Funciones/Componentes grandes

| Archivo | Líneas | Nota |
|---------|--------|------|
| `totem.component.ts` | ~180 | Template inline muy largo |
| `pos.component.ts` | ~120 | Template inline largo |
| `kds.component.ts` | ~110 | OK, pero podría separarse |
| `dish-form.component.ts` | 148 | Lógica OK, template largo |

**Recomendación:** Considerar separar templates a archivos `.html` cuando superen ~50 líneas.

---

### 🟢 LOW: Comentarios de BUG en código

El código tiene varios comentarios tipo `// BUG-XX:` que documentan fixes previos. Esto es positivo para el historial, pero considerar:

- Añadir fecha al comentario
- Considerar mover a CHANGELOG.md para producción

Ejemplos encontrados:
- `// BUG-06: decode JWT payload...`
- `// BUG-09: was only evaluated once...`
- `// BUG-10: was calling GET /api/dishes...`
- `// BUG-11: was a manually-synced signal...`
- `// BUG-12: was only listening to WS...`
- `// BUG-14: replaced Angular default...`
- `// BUG-16: removed test for Angular placeholder...`

---

### 🟢 LOW: Falta manejo de errores en algunos HTTP

```typescript
// kds.component.ts:44
this.http.get<any[]>(`${environment.apiUrl}/orders/kitchen`).subscribe({
  next: (items) => kdsStore.setItems(items),
  error: () => { /* silently skip */ },  // ⚠️ Silenciado
});
```

**Recomendación:** Al menos loggear errores o mostrar notificación al usuario.

---

## 📋 Código Limpio Checklist

| Criterio | Estado | Notas |
|----------|--------|-------|
| Nombres descriptivos | ✅ | `ordered`, `onPrepare`, `item_state` |
| Funciones <20 líneas | ⚠️ | Algunas funciones en stores son largas |
| Single Responsibility | ✅ | Stores separados por dominio |
| Comentarios necesarios | ✅ | Solo donde hay lógica compleja |
| Consistencia de estilo | ✅ | Prettier configurado |

---

## 🐛 Bugs Historicos Verificados

| Bug | Estado | Ubicación |
|-----|--------|-----------|
| BUG-03 (KTS permisos) | ✅ ARREGLADO | `app.routes.ts` - permisos correctos en `/kds` |
| BUG-06 (JWT decode) | ✅ ARREGLADO | `auth.store.ts` - `decodeJwt()` implementado |
| BUG-07 (redirect loop) | ✅ ARREGLADO | `app.routes.ts` - login/unauthorized definidos |
| BUG-09 (CASL reactivo) | ✅ ARREGLADO | `casl.directive.ts` - usa `effect()` |
| BUG-10 (auth en totem) | ✅ ARREGLADO | `totem.component.ts` - endpoint público |
| BUG-11 (signal manual) | ✅ ARREGLADO | `totem.component.ts` - usa `computed()` |
| BUG-12 (KDS init) | ✅ ARREGLADO | `kds.component.ts` - HTTP + WS |
| BUG-14 (template) | ✅ ARREGLADO | `app.ts` - solo router-outlet |
| BUG-16 (test) | ✅ ARREGLADO | `app.spec.ts` - tests actualizados |

---

## 🎯 Recomendaciones Prioritarias

### 1. Alta Prioridad
- [ ] **Crear suite de tests mínima** (al menos stores y guards)
- [ ] **Definir interfaces** para eliminar `any` en dominio principal

### 2. Media Prioridad
- [ ] Separar templates grandes a archivos `.html`
- [ ] Mejorar manejo de errores HTTP
- [ ] Añadir tipado estricto a eventos de socket

### 3. Baja Prioridad
- [ ] Documentar BUG fixes en CHANGELOG.md
- [ ] Considerar lazy loading más granular

---

## 📝 Conclusión

El frontend de DisherIo refactorizado muestra **buena arquitectura y prácticas modernas de Angular**:
- Signals bien implementados
- Componentes standalone correctos
- TypeScript strict habilitado
- Guards funcionando (BUG-03 verificado arreglado)

El **principal riesgo** es la **ausencia de tests**, que puede llevar a regresiones no detectadas. Se recomienda priorizar la creación de tests para los stores y la lógica de autorización.

**Nota para Backend:** Cuando esté listo, revisar:
- TypeScript strict en backend
- Repositories + Validación ObjectId (BUG-01)
- JWT sin fallback (SEC-01)
- Estructura Clean Architecture

---

*Reporte generado por subagente rev-disherio-review*
