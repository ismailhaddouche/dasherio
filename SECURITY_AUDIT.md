# 🔒 Security Audit Report - DisherIo Refactor

**Fecha:** 2026-03-26  
**Auditor:** CyberSec Agent  
**Proyecto:** disherio-refactor  
**Stack:** Express + Angular + MongoDB

---

## 📊 Resumen Ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| 🔴 CRITICAL | 1 |
| 🟠 HIGH | 1 |
| 🟡 MEDIUM | 4 |
| 🟢 LOW | 1 |
| ℹ️ INFO | 2 |

---

## 🔴 CRITICAL

### SEC-01: JWT_SECRET con fallback inseguro
**Archivo:** `backend/src/services/auth.service.ts`  
**Línea:** 6

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
```

**Problema:** Aunque hay validación para producción, el fallback `'changeme'` sigue presente en el código. Si alguien ejecuta en modo staging/test sin configurar JWT_SECRET, el sistema usará una clave conocida.

**Impacto:** Un atacante podría firmar sus propios tokens JWT válidos.

**Recomendación:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

**Status:** 🔧 Pendiente de corrección

---

## 🟠 HIGH

### SEC-02: Token JWT almacenado en localStorage
**Archivo:** `frontend/src/app/store/auth.store.ts`  
**Líneas:** 23, 34, 40

```typescript
const storedToken = localStorage.getItem('token');
// ...
localStorage.setItem('token', token);
localStorage.removeItem('token');
```

**Problema:** localStorage es vulnerable a ataques XSS. Cualquier script malicioso puede acceder al token.

**Impacto:** Si se inyecta código malicioso, el atacante puede robar el token y suplantar la identidad del usuario.

**Recomendación:**
- Opción A: Usar cookies `HttpOnly; Secure; SameSite=Strict` (más seguro)
- Opción B: Implementar refresh tokens rotativos con short-lived access tokens
- Opción C: Al menos usar sessionStorage (menor exposición temporal)

**Referencias:**
- [OWASP: HTML5 Security Cheat Sheet - Local Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)

**Status:** 🔧 Pendiente de corrección

---

## 🟡 MEDIUM

### SEC-03: Socket.IO no envía token en handshake
**Archivo:** `frontend/src/app/services/socket/socket.service.ts`  
**Línea:** 14

```typescript
this.socket = io(environment.wsUrl, { withCredentials: true });
```

**Problema:** El frontend no envía el token JWT en el handshake de Socket.IO, aunque el backend espera `socket.handshake.auth.token`.

**Impacto:** Las conexiones de socket fallarán o el backend necesita aceptar conexiones sin autenticar.

**Recomendación:**
```typescript
this.socket = io(environment.wsUrl, {
  withCredentials: true,
  auth: {
    token: authStore.token()
  }
});
```

**Status:** 🔧 Pendiente de corrección

---

### SEC-04: JWT_EXPIRES con fallback
**Archivo:** `backend/src/services/auth.service.ts`  
**Línea:** 7

```typescript
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';
```

**Problema:** Similar a SEC-01, aunque menos crítico. Un tiempo de expiración largo por defecto aumenta la ventana de ataque si el token es robado.

**Recomendación:**
```typescript
const JWT_EXPIRES = process.env.JWT_EXPIRES || '15m'; // Más conservador
```

**Status:** 🔧 Pendiente de corrección

---

### SEC-05: ImageUploader no valida MIME type en frontend
**Archivo:** `frontend/src/app/shared/components/image-uploader/image-uploader.component.ts`  
**Línea:** 50

```typescript
<input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)" />
```

**Problema:** El atributo `accept="image/*"` es solo una sugerencia del navegador. No hay validación real del tipo de archivo en TypeScript antes de subir.

**Impacto:** Un atacante podría subir archivos no-imagen cambiando la extensión.

**Recomendación:** Agregar validación en `onFileSelected`:
```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  alert('Tipo de archivo no permitido');
  return;
}
```

**Nota:** El backend SÍ tiene validación (fileFilter en image.controller.ts), por lo que esto es defensa en profundidad.

**Status:** 🔧 Pendiente de corrección

---

### SEC-06: decodeJwt no verifica firma
**Archivo:** `frontend/src/app/store/auth.store.ts`  
**Líneas:** 10-22

```typescript
export function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // ...
  }
}
```

**Problema:** La función decodifica el payload base64 pero NO verifica la firma JWT.

**Impacto:** Un atacante podría modificar el payload del token en el cliente (aunque el backend rechazaría el token modificado).

**Nota:** Esto es aceptable en frontend porque la validación real debe hacerse en backend. Sin embargo, el frontend confía ciegamente en el payload decodificado.

**Recomendación:** Considerar usar una librería como `jwt-decode` o al menos documentar que esto es solo para conveniencia de UI.

**Status:** ℹ️ Aceptar riesgo / documentar

---

## 🟢 LOW

### SEC-07: Falta validación de Content-Type
**Archivo:** `backend/src/index.ts`  
**Línea:** 26

```typescript
app.use(express.json({ limit: '1mb' }));
```

**Problema:** No hay validación explícita de Content-Type. El servidor aceptará requests con content-types inesperados.

**Impacto:** Potencial confusión de tipo o bypass de controles en ciertos escenarios.

**Recomendación:** Considerar agregar middleware de validación de content-type para rutas específicas.

**Status:** ℹ️ Bajo riesgo actual

---

## ℹ️ INFO

### INFO-01: Buenas prácticas implementadas ✅

El proyecto tiene varias medidas de seguridad bien implementadas:

| Medida | Implementación | Estado |
|--------|----------------|--------|
| Helmet | `backend/src/middlewares/security.ts` | ✅ |
| CORS estricto | Validación de FRONTEND_URL en prod | ✅ |
| Rate limiting | `apiLimiter` (100 req/15min) + `authLimiter` (10 req/15min) | ✅ |
| Validación Zod | `backend/src/middlewares/validate.ts` | ✅ |
| Validación ObjectId | `Types.ObjectId.isValid()` en servicios | ✅ |
| Password hashing | `bcryptjs` con salt rounds 12 | ✅ |
| File upload validation | MIME type + extensión en image.controller.ts | ✅ |
| Socket auth | JWT verification en socketAuthMiddleware | ✅ |
| RBAC | `requirePermission` middleware | ✅ |
| Input sanitization | Angular templates (auto-escape) | ✅ |

### INFO-02: Dependencias actualizadas

Las dependencias principales están en versiones recientes:
- express: ^5.2.1 (latest)
- mongoose: ^9.3.2 (latest)
- jsonwebtoken: ^9.0.3 (latest)
- helmet: ^8.1.0 (latest)
- zod: ^4.3.6 (latest)

**Recomendación:** Configurar Dependabot o similar para monitoreo continuo.

---

## 📋 Lista de Tareas de Corrección

- [ ] **SEC-01:** Eliminar fallback de JWT_SECRET
- [ ] **SEC-02:** Migrar de localStorage a cookies HttpOnly o implementar refresh tokens
- [ ] **SEC-03:** Agregar token JWT al handshake de Socket.IO
- [ ] **SEC-04:** Reducir tiempo de expiración por defecto de JWT
- [ ] **SEC-05:** Agregar validación MIME type en frontend
- [ ] **SEC-06:** Documentar que decodeJwt es solo para conveniencia de UI
- [ ] **SEC-07:** Considerar validación de Content-Type

---

## 🎯 Prioridad de Corrección

1. **Inmediata (1-2 días):** SEC-01, SEC-02
2. **Alta (1 semana):** SEC-03, SEC-04
3. **Media (2 semanas):** SEC-05
4. **Baja:** SEC-06, SEC-07

---

## 📚 Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Angular Security Guide](https://angular.io/guide/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

*Reporte generado automáticamente por CyberSec Agent*  
*Proyecto: disherio-refactor*
