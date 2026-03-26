# Resumen Ejecutivo - Arquitectura DisherIO Refactor

## Visión General

Se propone una arquitectura **Clean Architecture** con separación clara de capas:

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION (Controllers / Components)                │
│  - HTTP routes / Angular components                     │
│  - Input validation                                     │
├─────────────────────────────────────────────────────────┤
│  BUSINESS (Services)                                    │
│  - Lógica de negocio                                    │
│  - Orquestación                                         │
├─────────────────────────────────────────────────────────┤
│  DATA (Repositories)                                    │
│  - Acceso a MongoDB                                     │
│  - Queries complejas                                    │
├─────────────────────────────────────────────────────────┤
│  DOMAIN (Entities / Enums)                              │
│  - Tipos puros                                          │
│  - Reglas de negocio inmutables                         │
└─────────────────────────────────────────────────────────┘
```

## Decisiones Clave

### 1. Repository Pattern (ADR-002)
- **Motivación:** Testing aislado, cambio de BD posible
- **Implementación:** Interfaces + Implementaciones MongoDB
- **Beneficio:** Cada capa es testable independientemente

### 2. Signals para Estado (ADR-003)
- **Motivación:** Simplicidad vs NgRx, performance nativa
- **Implementación:** Stores con signals + computed
- **Beneficio:** Menos código, mejor performance, no memory leaks

### 3. Shared Package (ADR-004)
- **Motivación:** Consistencia FE/BE, eliminar duplicación
- **Implementación:** Tipos, Zod schemas, enums compartidos
- **Beneficio:** Cambios centralizados, autocomplete perfecto

## Estructura de Carpetas

### Backend
```
src/
├── domain/          # Entidades y enums
├── repositories/    # Contratos + Implementaciones Mongo
├── services/        # Lógica de negocio
├── controllers/     # HTTP handlers
├── middlewares/     # Auth, validation, rate-limit
└── config/          # DB, logger, env validation
```

### Frontend
```
src/app/
├── core/            # Guards, interceptors, singletons
├── features/        # Módulos por feature (lazy)
├── shared/          # Components, pipes, utils
└── state/           # Signal stores globales
```

## Bugs Críticos Resueltos por Arquitectura

| Bug | Solución | Ubicación |
|-----|----------|-----------|
| BUG-01 | Validación ObjectId en repositorios | `repositories/` + `shared/utils/objectid.ts` |
| BUG-02 | Naming consistente 'allergen' | `shared/schemas/dish.schemas.ts` |
| BUG-03 | Permiso KTS consistente | `shared/enums/permissions.enum.ts` |
| SEC-01 | JWT sin fallback | `config/env.ts` validación estricta |
| SMELL-01 | Eliminar any | `tsconfig.json` strict mode |
| SMELL-02 | CASL compartido | `shared/abilities/` |
| SMELL-03 | Enums vs strings | `shared/enums/` |

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Backend | Express 5 + TypeScript |
| Frontend | Angular 21 + Signals |
| Validación | Zod (shared) |
| Auth | JWT (sin fallback) |
| Base de Datos | MongoDB + Mongoose |
| Tests | Jest |

## Próximos Pasos

1. **Backend Dev:** Implementar repositorios con validación ObjectId
2. **Frontend Dev:** Migrar a Signals, eliminar any types
3. **Shared:** Publicar paquete compartido
4. **Security Review:** Verificar SEC-01, SEC-02
5. **CI/CD:** Pipeline GitHub Actions

## Métricas de Éxito

- [ ] 0 bugs críticos
- [ ] 0 `any` types
- [ ] 100% validaciones Zod
- [ ] Tests unitarios > 80% coverage
- [ ] TypeScript strict sin errores
