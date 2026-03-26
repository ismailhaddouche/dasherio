# ADR-001: Estructura de Carpetas

## Status
Accepted

## Context
El proyecto DisherIO actual tiene una estructura mezclada con código en desorden, duplicación de lógica entre frontend y backend, y falta de separación de responsabilidades.

## Decision
Implementaremos una estructura de carpetas Clean Architecture con separación clara de capas.

### Backend Structure
```
backend/
├── src/
│   ├── config/                 # Configuración (DB, logger, env)
│   │   ├── database.ts
│   │   ├── logger.ts
│   │   └── env.ts             # Validación centralizada de variables
│   │
│   ├── domain/                # Capa de dominio (entidades puras)
│   │   ├── entities/          # Interfaces de entidades
│   │   │   ├── user.entity.ts
│   │   │   ├── order.entity.ts
│   │   │   ├── dish.entity.ts
│   │   │   └── restaurant.entity.ts
│   │   └── enums/             # Enums compartidos
│   │       ├── order-status.enum.ts
│   │       ├── permissions.enum.ts  # KTS, ADMIN, etc.
│   │       └── item-state.enum.ts
│   │
│   ├── repositories/          # Capa de datos (Repository Pattern)
│   │   ├── interfaces/        # Contratos de repositorios
│   │   │   ├── user.repository.interface.ts
│   │   │   ├── order.repository.interface.ts
│   │   │   └── ...
│   │   └── implementations/   # Implementaciones MongoDB
│   │       ├── user.repository.mongo.ts
│   │       ├── order.repository.mongo.ts
│   │       └── ...
│   │
│   ├── services/              # Capa de negocio (orquestación)
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   ├── dish.service.ts
│   │   └── validators/        # Validaciones de negocio
│   │       ├── objectid.validator.ts  # BUG-01 fix
│   │       └── permissions.validator.ts # BUG-03 fix
│   │
│   ├── controllers/           # Capa de presentación HTTP
│   │   ├── auth.controller.ts
│   │   ├── order.controller.ts
│   │   └── ...
│   │
│   ├── middlewares/           # Cross-cutting concerns
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── rate-limit.middleware.ts  # SEC-02 fix
│   │
│   ├── routes/                # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── order.routes.ts
│   │   └── ...
│   │
│   ├── sockets/               # WebSocket handlers
│   │   ├── kds.handler.ts     # BUG-03: usar permisos consistentes
│   │   └── index.ts
│   │
│   └── utils/                 # Utilidades puras
│       ├── jwt.ts             # SEC-01 fix
│       └── tax-calculator.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
└── package.json
```

### Frontend Structure (Clean Architecture)
```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton, singleton services
│   │   │   ├── guards/              # Auth guards
│   │   │   ├── interceptors/        # HTTP interceptors
│   │   │   ├── services/            # Core singleton services
│   │   │   │   └── auth.service.ts
│   │   │   └── constants/           # App-wide constants
│   │   │
│   │   ├── features/                # Feature modules (lazy loaded)
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── auth.routes.ts
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── orders.routes.ts
│   │   │   │
│   │   │   ├── dishes/
│   │   │   ├── kitchen/
│   │   │   └── ...
│   │   │
│   │   ├── shared/                  # Shared components/pipes
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   ├── directives/
│   │   │   └── utils/
│   │   │
│   │   └── state/                   # Global state (Signals)
│   │       ├── auth.store.ts
│   │       ├── cart.store.ts
│   │       └── order.store.ts
│   │
│   └── environments/
│
└── angular.json
```

### Shared Package Structure
```
shared/
├── src/
│   ├── types/                 # TypeScript interfaces
│   │   ├── user.types.ts
│   │   ├── order.types.ts
│   │   └── ...
│   │
│   ├── schemas/               # Zod validation schemas
│   │   ├── auth.schemas.ts
│   │   ├── order.schemas.ts
│   │   ├── dish.schemas.ts
│   │   └── index.ts
│   │
│   ├── enums/                 # Enums compartidos
│   │   ├── permissions.enum.ts   # BUG-03 fix: KTS consistente
│   │   ├── order-status.enum.ts
│   │   └── item-state.enum.ts
│   │
│   └── abilities/             # CASL abilities (shared)
│       ├── ability.definitions.ts
│       └── ability.factory.ts   # SMELL-02 fix: compartido
│
├── package.json
└── tsconfig.json
```

## Consequences

### Positive
- Separación clara de responsabilidades
- Facilita testing unitario (cada capa es testable aisladamente)
- Permite cambiar MongoDB por otra BD sin afectar negocio
- Elimina duplicación de código entre FE y BE

### Negative
- Más carpetas y archivos (complejidad inicial)
- Necesita documentación para nuevos devs

## References
- Clean Architecture by Robert C. Martin
- Angular Style Guide - Feature modules
