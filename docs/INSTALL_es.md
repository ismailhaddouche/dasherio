# Guía de Instalación

[English Version (INSTALL.md)](INSTALL.md) | [Version Française (INSTALL_fr.md)](INSTALL_fr.md)

Este documento describe los procedimientos para el despliegue y la eliminación de la plataforma DisherIo.

## Requisitos Previos del Sistema

- Sistema Operativo: Linux (se recomienda Ubuntu 22.04 LTS o superior).
- Control de Versiones: Git.
- Privilegios: Acceso Sudo/Administrativo.
- Conectividad: Acceso a Internet sin restricciones.

## Despliegue Automatizado

El script de instalación integrado automatiza el aprovisionamiento del entorno Docker, la inicialización de la configuración, la construcción de imágenes y la inicialización de la base de datos.

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio
sudo ./scripts/install.sh
```

Secuencia de Despliegue:
1. Actualización del sistema y resolución de dependencias (Docker Engine, Docker Compose).
2. Configuración del archivo de variables de entorno (.env).
3. Construcción de imágenes Docker para los servicios frontend y backend.
4. Orquestación de servicios mediante Docker Compose.
5. Inicialización de la base de datos y aprovisionamiento del usuario administrador.
6. Configuración del proxy inverso (Caddy).

## Configuración Manual para Desarrollo

Para establecer un entorno de desarrollo local sin automatización completa:

1. Instalación de Dependencias:
   ```bash
   npm install
   ```

2. Aprovisionamiento de Base de Datos:
   Ejecute una instancia de MongoDB (versión 7.0 o superior):
   ```bash
   docker run -d -p 27017:27017 --name disherio-mongo mongo:7
   ```

3. Configuración del Entorno:
   Cree un archivo `.env` a partir de `.env.example` y defina las variables requeridas.

4. Ejecución de Servicios:
   ```bash
   # Terminal 1: API Backend
   npm run dev:backend
   
   # Terminal 2: Aplicación Frontend
   npm run dev:frontend
   ```

## Eliminación del Sistema

Procedimientos para el desmantelamiento de la instancia de DisherIo:

### Desmantelamiento Estándar
Detiene los servicios preservando las imágenes y los volúmenes persistentes:
```bash
docker compose down
```

### Purga Completa de Datos
Finaliza los servicios y elimina todos los activos asociados, incluidos volúmenes de base de datos e imágenes:
```bash
docker compose down -v --rmi all
```

Advertencia: Esta operación resulta en la pérdida permanente de todos los registros de la base de datos y los archivos multimedia subidos.
