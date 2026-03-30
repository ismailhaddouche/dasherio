# Configuración y Mantenimiento

[English Version (CONFIGURE.md)](CONFIGURE.md) | [Version Française (CONFIGURE_fr.md)](CONFIGURE_fr.md)

Este documento proporciona las directrices para la configuración operativa y el mantenimiento de la plataforma DisherIo mediante scripts de gestión integrados.

## Scripts Administrativos

Los scripts de gestión se encuentran en el directorio `scripts/` y requieren privilegios administrativos.

### 1. Configuración del Sistema (configure.sh)
Utilizado para realizar ajustes post-instalación en los parámetros del sistema.
```bash
sudo ./scripts/configure.sh
```
Parámetros configurables:
- Asignación de nombre de dominio y dirección IP.
- Configuración de puertos HTTP y HTTPS.
- Restablecimiento de credenciales administrativas.
- Actualización de variables de entorno.

### 2. Persistencia de Datos (backup.sh)
Ejecuta rutinas de respaldo de la base de datos para asegurar la integridad de la información.
```bash
sudo ./scripts/backup.sh
```
- Ubicación de Almacenamiento: Los respaldos se archivan en `/var/backups/disherio/`.
- Procedimiento: Realiza un `mongodump` del entorno de producción.

### 3. Telemetría del Sistema (info.sh)
Informa sobre el estado operativo actual y la utilización de recursos.
```bash
sudo ./scripts/info.sh
```
Métricas proporcionadas:
- Direcciones de red pública y local.
- Estado operativo de los contenedores Docker.
- Métricas de recursos del sistema (CPU, Memoria, Almacenamiento).
- Configuración activa del entorno.

## Configuración del Entorno

El archivo `.env` define los parámetros operativos de la aplicación.

| Parámetro | Descripción Funcional |
|-----------|-----------------------|
| MONGODB_URI | Cadena de conexión para el acceso a la base de datos. |
| JWT_SECRET | Secreto criptográfico para la autenticación de sesiones. |
| PORT | Puerto de escucha para la pasarela Caddy. |
| NODE_ENV | Modo operativo (production o development). |

## Actualizaciones de Software

Para desplegar la última versión de la plataforma:
1. Obtener los últimos cambios: `git pull origin main`
2. Reconstruir las imágenes de los servicios: `docker compose build`
3. Reiniciar los servicios orquestados: `docker compose up -d`
