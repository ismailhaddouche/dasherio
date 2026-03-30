# Arquitectura y Stack Tecnológico

[English Version (ARCHITECTURE.md)](ARCHITECTURE.md) | [Version Française (ARCHITECTURE_fr.md)](ARCHITECTURE_fr.md)

Este documento proporciona un resumen técnico de la arquitectura de la plataforma DisherIo y su stack tecnológico subyacente.

## Arquitectura del Sistema

La plataforma utiliza una arquitectura de monorepositorio organizada en tres módulos principales:
- backend: API de Node.js Express que facilita la lógica de negocio y la persistencia de datos.
- frontend: Aplicación SPA de Angular que proporciona la interfaz de usuario para los diversos módulos.
- shared: Biblioteca común que contiene tipos, esquemas y definiciones de errores unificados.

### Orquestación del Flujo de Datos
```
                    Caddy (Proxy Inverso)
                       Puertos 80 / 443
                    /                  \
           Frontend                  Backend
           Angular 21                Express 5
           Puerto 4200               Puerto 3000
                                         |
                                      MongoDB
                                      Puerto 27017
```

## Stack Tecnológico

### Servicios Backend
- Framework: Express 5.2
- Lenguaje de Ejecución: TypeScript 5.4
- Capa de Base de Datos: MongoDB 7 + Mongoose 9
- Marco de Seguridad: JWT + CASL (Control de Acceso Basado en Atributos)
- Validación de Esquemas: Zod
- Comunicación en Tiempo Real: Socket.IO 4.8
- Marco de Registro (Logging): Pino

### Aplicación Frontend
- Framework: Angular 21.2
- Framework de Estilos: TailwindCSS 3.4
- Integración en Tiempo Real: Socket.IO Client
- Gestión de Estado Reactiva: Angular Signals y almacenes dedicados

### Infraestructura y Despliegue
- Contenerización: Docker y Docker Compose
- Servicios de Pasarela: Caddy 2
- Procesamiento de Medios: Sharp

## Patrones de Diseño Arquitectónico

### Patrón Repositorio (Backend)
El backend implementa el Patrón Repositorio para desacoplar la lógica de negocio de la capa de acceso a datos. Los servicios interactúan exclusivamente con los Repositorios, que gestionan las interacciones con los modelos de Mongoose, mejorando la testabilidad y el mantenimiento del sistema.

### Registros de Decisiones Arquitectónicas (ADRs)
La documentación formal de las decisiones arquitectónicas está disponible en `docs/architecture/`:
- ADR-001: Organización estructural de la jerarquía de directorios.
- ADR-002: Implementación del Patrón Repositorio.
- ADR-003: Estrategias de gestión de estado.
- ADR-004: Definiciones unificadas de tipos y validación.
