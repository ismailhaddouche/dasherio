# Architecture and Technology Stack

[Spanish Version (ARCHITECTURE_es.md)](ARCHITECTURE_es.md) | [French Version (ARCHITECTURE_fr.md)](ARCHITECTURE_fr.md)

This document provides a technical overview of the DisherIo platform architecture and its underlying technology stack.

## System Architecture

The platform utilizes a monorepo architecture organized into three primary modules:
- backend: Node.js Express API facilitating business logic and data persistence.
- frontend: Angular SPA providing the user interface across various modules.
- shared: Common library containing unified types, schemas, and error definitions.

### Data Flow Orchestration
```
                    Caddy (Reverse Proxy)
                       Ports 80 / 443
                    /                  \
           Frontend                  Backend
           Angular 21                Express 5
           Port 4200                 Port 3000
                                         |
                                      MongoDB
                                      Port 27017
```

## Technology Stack

### Backend Services
- Framework: Express 5.2
- Runtime Language: TypeScript 5.4
- Database Layer: MongoDB 7 + Mongoose 9
- Security Framework: JWT + CASL (Attribute-Based Access Control)
- Schema Validation: Zod
- Real-time Communication: Socket.IO 4.8
- Logging Framework: Pino

### Frontend Application
- Framework: Angular 21.2
- Styling Framework: TailwindCSS 3.4
- Real-time Integration: Socket.IO Client
- Reactive State Management: Angular Signals and dedicated stores

### Infrastructure and Deployment
- Containerization: Docker & Docker Compose
- Gateway Services: Caddy 2
- Media Processing: Sharp

## Architectural Design Patterns

### Repository Pattern (Backend)
The backend implements the Repository Pattern to decouple business logic from the data access layer. Services interact exclusively with Repositories, which manage Mongoose model interactions, enhancing testability and system maintainability.

### Architectural Decision Records (ADRs)
Formal documentation of architectural decisions is available in `docs/architecture/`:
- ADR-001: Structural organization of directory hierarchy.
- ADR-002: Implementation of the Repository Pattern.
- ADR-003: State management strategies.
- ADR-004: Unified validation and type definitions.
