# DisherIo

[Versión en Inglés (README.md)](README.md) | [Version Française (README_fr.md)](README_fr.md)

DisherIo es una plataforma integrada de gestión de restaurantes que proporciona soluciones para pedidos de autoservicio, asistencia en mesa, sistemas de visualización en cocina (KDS) y operaciones de punto de venta (POS).

## Índice de Documentación

- [Guía de Instalación](docs/INSTALL_es.md): Requisitos del sistema y procedimientos de despliegue.
- [Configuración y Mantenimiento](docs/CONFIGURE_es.md): Gestión operativa y uso de scripts.
- [Arquitectura y Stack Tecnológico](docs/ARCHITECTURE_es.md): Resumen técnico y patrones de diseño.
- [Resolución de Problemas](docs/ERRORS_es.md): Resolución de errores y procedimientos de diagnóstico.

## Módulos Principales

- Tótem de Autoservicio: Interfaz de cliente para la realización de pedidos mediante autenticación por código QR.
- Sistema de Visualización en Cocina (KDS): Gestión del ciclo de vida de pedidos en tiempo real para operaciones de cocina.
- Punto de Venta (POS): Procesamiento integral de transacciones y pagos.
- Servicio de Asistencia en Mesa (TAS): Herramientas digitales para camareros destinadas a la gestión de mesas y solicitudes de servicio.
- Panel Administrativo: Analíticas centralizadas, administración de personal y configuración de menús.

## Stack Tecnológico

- Frontend: Angular 21, TailwindCSS, Socket.IO Client.
- Backend: Node.js (Express 5), Socket.IO, Mongoose 9.
- Base de datos: MongoDB 7.
- Infraestructura: Docker, Caddy (Proxy Inverso).
- Lenguaje: TypeScript 5.

Para especificaciones técnicas, consulte la [Documentación de Arquitectura](docs/ARCHITECTURE_es.md).

## Despliegue

Despliegue automatizado estándar en Linux:

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio
sudo ./scripts/install.sh
```

Instrucciones detalladas disponibles en la [Guía de Instalación](docs/INSTALL_es.md).

## Marco de Mantenimiento

El directorio `scripts/` contiene herramientas para la administración del sistema:

- install.sh: Orquesta el despliegue completo del sistema.
- configure.sh: Gestiona parámetros de red y credenciales administrativas.
- backup.sh: Ejecuta rutinas de persistencia de base de datos.
- info.sh: Informa sobre telemetría del sistema y utilización de recursos.

Consulte la [Guía de Configuración](docs/CONFIGURE_es.md) para detalles operativos.

## Licencia

Propietario. Todos los derechos reservados.
