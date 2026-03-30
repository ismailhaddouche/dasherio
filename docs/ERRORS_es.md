# Procedimientos de Diagnóstico y Resolución de Problemas

[English Version (ERRORS.md)](ERRORS.md) | [Version Française (ERRORS_fr.md)](ERRORS_fr.md)

Este documento detalla los procedimientos de resolución para problemas operativos comunes y errores del sistema dentro de la plataforma DisherIo.

## Códigos de Error Estandarizados

| Identificador | Contexto Funcional | Resolución Recomendada |
|---------------|--------------------|------------------------|
| AUTH_001 | Fallo de Autenticación | Verificar las credenciales administrativas o de usuario. |
| DB_001 | Conectividad de Persistencia | Validar el estado del servicio de base de datos y los parámetros URI. |
| PERM_001 | Restricción de Autorización | Revisar las asignaciones de roles de usuario y las políticas de control de acceso. |
| VALID_001 | Error de Validación de Esquema | Contrastar los datos de carga útil con los esquemas Zod definidos. |

## Problemas Documentados y Resoluciones

### 1. Inicialización del Servicio Backend: JWT_SECRET Ausente
El tiempo de ejecución de la aplicación requiere la definición de un `JWT_SECRET` dentro del archivo de configuración `.env`.
Resolución: Generar una cadena criptográfica de al menos 32 caracteres y actualizar la configuración del entorno.

### 2. Fallos en la Carga de Activos Multimedia
Comúnmente atribuido a restricciones de permisos del sistema de archivos o montajes de volumen mal configurados.
Resolución: Auditar los permisos del directorio `uploads/` y verificar las definiciones de volumen en Docker Compose.

### 3. Interrupción de la Comunicación Socket.IO
Frecuentemente causado por una mala configuración de la pasarela o restricciones del cortafuegos.
Resolución: Confirmar la configuración del proxy inverso Caddy para la ruta `/socket.io/` y asegurar que la propiedad `withCredentials` esté habilitada en el cliente.

## Logs de Diagnóstico

Utilice los siguientes comandos para inspeccionar la telemetría del servicio:

```bash
# Diagnóstico del servicio backend
docker compose logs -f backend

# Diagnóstico del proxy inverso (Caddy)
docker compose logs -f caddy
```

El registro completo de errores está disponible en `docs/ERROR_CODES.md`.
