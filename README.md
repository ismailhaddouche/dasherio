# Disher.io v1.0 — Plataforma Open-Source para Gestión de Restaurantes

Disher.io es una plataforma de gestión de restaurantes autoalojada y lista para producción, diseñada para pequeños y medianos establecimientos. Ofrece sincronización de pedidos en tiempo real entre clientes, personal de cocina y cajeros, todo desde un único despliegue.

[![CI/CD](https://github.com/ismailhaddouche/disherio/actions/workflows/docker-build.yml/badge.svg)](https://github.com/ismailhaddouche/disherio/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![Angular](https://img.shields.io/badge/Angular-21-red)](https://angular.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-brightgreen)](https://mongodb.com)

---

## ¿Qué es Disher.io?

Disher.io sustituye los tickets de papel, los walkie-talkies y los sistemas POS desconectados por una plataforma unificada que se ejecuta en tu propio hardware. Los clientes escanean un código QR en su mesa, hacen su pedido y la cocina lo ve al instante. El cajero cierra la cuenta con un clic, permitiendo también dividir en varios pagos.

Se puede ejecutar en cualquier dispositivo, desde una Raspberry Pi hasta un servidor en la nube, sin cuotas de suscripción.

---

## Arquitectura del Sistema

```
                        ┌────────────────────────────────────────────────────────────────────────┐
                        │                  Caddy (Proxy Inverso)                 │
                        │           TLS/SSL · Compresión · Enrutamiento          │
                        └──────────────────────────────┬─────────────────────────┬───────────────┘
                                       │                  │
                          /api/*  ─────┘                  └─── /* (frontend)
                                       │
              ┌────────────────────────▼────────────────────────────────────────┐
              │              Backend (Node.js 20 + Express)      │
              │                                                  │
              │   REST API · JWT Auth · RBAC · Socket.io         │
              │   Rate Limiting · Helmet · Logs de Actividad     │
              └──────────────┬───────────────────────────────────┬──────────────┘
                           │                    │
               ┌───────────▼──────────┐   ┌─────▼──────────────────┐
               │  MongoDB 7       │   │  Socket.io (WS)      │
               │  Pedidos · Menú  │   │  Eventos en tiempo   │
               │  Usuarios · TPV  │   │  real a clientes     │
               └──────────────────┘   └──────────────────────────┘

              ┌────────────────────────────────────────────────────────────────────────┐
              │              Frontend (Angular 21)               │
              │                                                  │
              │  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
              │  │  Admin     │  │  KDS     │  │  Cliente     │  │
              │  │  Dashboard │  │  Cocina  │  │  Menú + QR   │  │
              │  └────────────┘  └──────────┘  └──────────────┘  │
              │  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
              │  │  TPV /     │  │  Editor  │  │  Pago /      │  │
              │  │  Cajero    │  │  de Menú │  │  Checkout    │  │
              │  └────────────┘  └──────────┘  └──────────────┘  │
              └────────────────────────────────────────────────────────────────────────┘
```

---

## Características

### Para Clientes
- Escaneo de código QR en la mesa (sin descargar aplicaciones).
- Menú interactivo con categorías, variantes y alérgenos.
- Realización de pedidos directamente desde el teléfono.
- Autopago (Checkout) con propina opcional.

### Para Personal de Cocina (KDS)
- Pantalla de pedidos en tiempo real en cualquier tablet.
- Marcar platos individualmente como "en preparación" o "listos".
- Alertas visuales para pedidos nuevos y pendientes.

### Para Cajeros (TPV / POS)
- Vista general interactiva de todas las mesas y el estado de los pedidos.
- Cierre de cuenta y cálculo de IVA en un solo clic.
- División de pagos entre varias personas a partes iguales o personalizadas.
- Opciones de pago en efectivo y tarjeta.

### Para Administradores
- Gestión completa del menú (categorías, variantes, extras, alérgenos).
- Gestión de personal de cocina y cajeros con acceso basado en roles.
- Personalización de marca del restaurante (logo, colores, nombre).
- Generador de PDF de tótems QR gestionando las mesas dinámicamente.
- Logs de actividad y auditoría.

---

## Instalación

### Requisitos Previos

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| SO | Linux (Ubuntu 20.04+, Debian 11+) | Ubuntu 22.04 LTS |
| RAM | 1 GB | 2 GB |
| Disco | 5 GB libres | 10 GB libres |
| Docker | 24+ | última versión estable |
| Acceso | root / sudo | — |

> **Nota:** En Raspberry Pi funciona el modo local/LAN. Para producción en la nube se recomienda al menos 2 GB de RAM.

> **Proveedores Cloud (Google Cloud, AWS, Azure):** Además de tener el puerto libre en el sistema, es necesario **abrirlo en el firewall del proveedor**. Consulta la sección correspondiente en la [Guía de Inicio Rápido](./docs/QUICK_START.md#proveedores-cloud--firewall).

---

### Instalación Rápida (Recomendada)

El instalador automatizado es la forma más segura de desplegar Disher.io. Se encarga de la configuración, generación de secretos y despliegue de todos los servicios.

```bash
# 1. Clonar el repositorio
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio

# 2. Dar permisos y ejecutar el instalador como root
chmod +x install.sh
sudo ./install.sh
```

#### Pasos del instalador

El instalador te guiará de forma interactiva por **6 pasos**:

| Paso | Descripción |
|------|-------------|
| **[1/6]** Configuración de acceso | Elegir entre acceso por **Dominio** (recomendado) o **Dirección IP** |
| **[1.5/6]** Configuración de puerto | Puerto HTTP (por defecto `80`; si está ocupado, usar `8080`) |
| **[2/6]** Seguridad | Generación automática de `JWT_SECRET`, contraseña de MongoDB y credenciales de usuarios |
| **[3/6]** Configuración | Escritura del archivo `.env` con todos los parámetros |
| **[4/6]** Docker | Comprobación e instalación automática de Docker si no está presente |
| **[5/6]** Servicios | Levantamiento de todos los contenedores (`docker compose up -d --build`) |
| **[6/6]** Tienda inicial | Inicialización de la base de datos con los datos de la tienda |

#### Opciones de acceso

- **Dominio local** (`disherio.local`): Para uso en red LAN sin internet. Ideal para Raspberry Pi o uso interno.
- **Dominio personalizado** (ej: `app.mirestaurante.com`): Activa HTTPS automático con Let's Encrypt vía Caddy.
- **IP local**: Para acceso directo en red local por IP.
- **IP pública**: Para VPS sin dominio. El instalador detecta la IP automáticamente.

#### Credenciales iniciales

> ⚠️ **Importante:** Al finalizar la instalación se muestran las credenciales generadas automáticamente. **Guárdalas en un lugar seguro**, no se vuelven a mostrar.

```
--- Credenciales Iniciales ---
Usuario Admin:    admin
Contraseña Admin: [generada aleatoriamente]
Acceso:           http://<tu-ip-o-dominio>
```

---

### Reconfigurar después de instalar

Si necesitas cambiar el dominio, puerto u otras opciones después de la primera instalación:

```bash
cd disherio
sudo ./configure.sh
```

---

## Desinstalación

### Desinstalación estándar (conservando datos)

Detiene y elimina los contenedores **sin borrar** la base de datos ni los volúmenes:

```bash
cd disherio
docker compose down
```

Los datos de MongoDB se conservan en los volúmenes de Docker. Puedes volver a levantar la plataforma en cualquier momento con `docker compose up -d`.

---

### Desinstalación completa (borra todos los datos)

> ⚠️ **Advertencia:** Este proceso elimina **todos los datos** incluyendo la base de datos, el menú, los pedidos y los usuarios. Es irreversible.

```bash
cd disherio

# 1. Detener y eliminar contenedores + volúmenes (base de datos incluida)
docker compose down -v

# 2. Eliminar la carpeta del proyecto
cd ..
rm -rf disherio
```

---

## Reinstalación / Recuperación de Instalación Corrupta

Si la instalación está rota (contenedores que no arrancan, errores de Docker, `.env` corrupto, fallo a mitad de instalación, etc.), sigue estos pasos para hacer una instalación limpia desde cero.

### Paso 1 — Diagnóstico rápido

```bash
# Ver el estado de los contenedores
docker ps -a

# Ver los logs del servicio con error (ej: backend)
docker compose logs backend
docker compose logs caddy
docker compose logs database
```

### Paso 2 — Parar todo y limpiar

```bash
cd disherio

# Detener y eliminar contenedores, redes y volúmenes
docker compose down -v --remove-orphans
```

### Paso 3 — Limpieza profunda de Docker (opcional pero recomendada)

```bash
# Eliminar imágenes sin usar
docker image prune -a -f

# Eliminar volúmenes huérfanos
docker volume prune -f

# Eliminar redes sin usar
docker network prune -f

# O limpieza total de Docker (¡borra TODO lo de Docker en el sistema!)
# docker system prune -a -f --volumes
```

> ⚠️ `docker system prune -a -f --volumes` elimina **todas** las imágenes, volúmenes y contenedores del sistema, no solo los de Disher. Úsalo solo si quieres un reset total de Docker.

### Paso 4 — Eliminar la instalación antigua

```bash
cd ~   # o el directorio padre donde esté la carpeta

# Eliminar la carpeta del proyecto
rm -rf disherio
```

### Paso 5 — Clonar e instalar de nuevo

```bash
# Clonar el repositorio limpio
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio

# Dar permisos al instalador
chmod +x install.sh

# Ejecutar el instalador
sudo ./install.sh
```

---

### Referencia rápida: Comandos de recuperación

```bash
# Ver estado de todos los contenedores
docker ps -a

# Ver logs de un servicio específico
docker compose logs <servicio>   # backend | caddy | database

# Reiniciar un servicio sin reinstalar
docker compose restart <servicio>

# Levantar de nuevo si los contenedores están parados
docker compose up -d

# Forzar reconstrucción de imágenes
docker compose up -d --build

# Limpiar y reinstalar manteniendo datos
docker compose down --remove-orphans && docker compose up -d --build
```

---

## Accesos a la Plataforma

| Módulo | URL de Acceso | Rol Requerido |
|--------|-----|------|
| Panel de Administración | `/admin/dashboard` | Admin |
| Pantalla de Cocina (KDS) | `/admin/kds` | Cocina, Admin |
| Terminal de Venta (TPV) | `/admin/pos` | Cajero (POS), Admin |
| Editor de Menú | `/admin/menu` | Admin |
| Gestión de Usuarios | `/admin/users` | Admin |
| Configuración de Restaurante | `/admin/config` | Admin |
| Menú Digital Público (Cliente) | `/:numeroDeMesa` | Público |
| Checkout Pago (Cliente) | `/:numeroDeMesa/checkout` | Público |

---

## Modos de Despliegue

### Modo Local (LAN)
Diseñado para instalarse en una red local sin conexión a internet o para uso interno. Ideal para una única tablet como TPV o configurar la aplicación detrás de la barra en una Raspberry Pi en intranet.

### Modo Producción
Conecta con un dominio público e instala certificados TLS autogestionados mediante Let's Encrypt usando Caddy. Ideal para restaurantes que desean alojarlo en un servidor cloud o acceder desde internet.

### Modo Raspberry Pi
Equivalente al modo local pero ajustado y optimizado según los límites de los recursos (ARM, límite en uso de RAM y procesador). Validado para entornos de Raspberry Pi.

---

## Documentación del Proyecto

| Documento | Descripción |
|----------|-------------|
| [Quick Start](./docs/QUICK_START.md) | Instalación, primeros pasos y configuración inicial. |
| [Architecture](./docs/ARCHITECTURE.md) | Diseño del sistema y diagramas base. |
| [API Reference](./docs/API.md) | Documentación técnica de todos los endpoints. |
| [Maintenance](./docs/MAINTENANCE.md) | Guía de mantenimiento, restauraciones, backups y actualización. |
| [Contributing](./CONTRIBUTING.md) | Reglas y guía para contribuir al ecosistema Disher. |
| [Security](./SECURITY.md) | Notas de seguridad y reporte de vulnerabilidades. |
| [Changelog](./CHANGELOG.md) | Historial de versiones y cambios del repositorio. |

---

## Tecnologías Utilizadas

| Capa | Tecnología | Versión |
|-------|-----------|---------| 
| Backend | Node.js + Express | 20 / 5.x |
| Frontend | Angular + Signals API | 21 |
| Base de Datos | MongoDB | 7 |
| Servidor Web proxy | Caddy | 2 |
| Websockets (Tiempo real)| Socket.io | 4.x |
| Seguridad & Autologin | JWT | 9.x |

---

## Contribuciones y Seguridad

Cualquier contribución es bienvenida. Asegúrate de leer y entender nuestro [CONTRIBUTING.md](./CONTRIBUTING.md) antes de publicar un PR.

Si descubres una vulnerabilidad, no publiques la incidencia explícita. Por favor, revisa la sección de divulgación responsable ubicada en nuestro archivo [SECURITY.md](./SECURITY.md).

## Desarrollo Asistido por IA

Este proyecto ha sido desarrollado con el apoyo de herramientas de inteligencia artificial de Google:

- **[Gemini CLI](https://github.com/google-gemini/gemini-cli)** — Interfaz de línea de comandos para interacción con modelos Gemini, utilizada como asistente de desarrollo durante la codificación, depuración y generación de documentación.
- **[Gemini 3.0](https://deepmind.google/technologies/gemini/)** — Modelo de lenguaje de última generación de Google DeepMind, empleado para asistencia en la escritura de código, revisión de arquitectura y resolución de problemas técnicos.

> **Nota:** La dirección del proyecto, la arquitectura del sistema y todas las decisiones de diseño han sido responsabilidad del equipo humano. Las herramientas de IA se han utilizado como apoyo para acelerar el desarrollo y mejorar la calidad del código.

---

## Licencia

Disher.io está distribuido bajo la [Licencia MIT](./LICENSE). Puede usarse, modificarse y distribuirse para cualquier propósito que se desee.
