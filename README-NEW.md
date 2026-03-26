# 🍽️ DisherIO

**Sistema de Gestión de Restaurantes** - Solución full-stack para operaciones de restaurante: POS, KDS (Kitchen Display System), TAS (Table Service) y pedidos via Totem/QR.

---

## 🚀 Instalación Rápida (2 Comandos)

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio && sudo ./install.sh
```

**Requisitos:** Ubuntu/Debian, 1GB RAM, 5GB disco, acceso root

Al finalizar, accede a `http://TU_IP` con las credenciales mostradas.

---

## 📋 Documentación

- [INSTALL-SIMPLE.md](INSTALL-SIMPLE.md) - Guía de instalación detallada
- [INSTALL.md](INSTALL.md) - Instalación manual avanzada
- [CODE_ANALYSIS.md](CODE_ANALYSIS.md) - Análisis de código
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md) - Auditoría de seguridad

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Caddy (Reverse Proxy)                │
│                    Ports: 80, 443                           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
      ┌────────▼──────┐              ┌───────▼────────┐
      │   Frontend    │              │    Backend     │
      │   (Angular)   │              │   (Express)    │
      │   Port: 4200  │              │   Port: 3000   │
      └───────────────┘              └───────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │    MongoDB      │
                                    │    Port: 27017  │
                                    └─────────────────┘
```

### Stack Tecnológico

| Componente | Tecnología |
|-----------|------------|
| **Frontend** | Angular 21, TypeScript, TailwindCSS, Socket.io |
| **Backend** | Node.js, Express, TypeScript, Socket.io |
| **Base de Datos** | MongoDB 7 |
| **Autenticación** | JWT, CASL (Authorization) |
| **Reverse Proxy** | Caddy 2 |
| **Contenedores** | Docker, Docker Compose |

---

## ✨ Características

### POS (Point of Sale)
- Gestión de órdenes en tiempo real
- Múltiples métodos de pago
- División de cuentas por cliente
- Propinas configurables

### KDS (Kitchen Display System)
- Pantalla de cocina en tiempo real
- Estados: ORDERED → ON_PREPARE → SERVED
- Notificaciones via WebSocket
- Gestión de prioridades

### TAS (Table Service)
- Pedidos desde mesa
- Identificación por PIN
- Asignación de items a clientes

### Totem/QR
- Menú digital accesible por QR
- Pedidos sin registro
- Personalización de variantes y extras

---

## 🔒 Seguridad

- Rate limiting en rutas públicas
- JWT con secret obligatorio
- Encriptación bcrypt (12 rounds)
- Validación de ObjectId en todas las queries
- Permisos granulares (RBAC)

---

## 🛠️ Desarrollo

### Requisitos de Desarrollo
- Node.js 20+
- MongoDB 7
- Angular CLI 21

### Estructura del Proyecto
```
disherio/
├── backend/           # API REST + WebSocket
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   └── sockets/
│   └── Dockerfile
├── frontend/          # Angular SPA
│   ├── src/
│   │   └── app/
│   └── Dockerfile
├── scripts/           # Scripts de utilidad
└── docker-compose.yml
```

### Comandos de Desarrollo

```bash
# Backend
cd backend
npm install
npm run dev          # Modo desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm run test         # Ejecutar tests

# Frontend
cd frontend
npm install
npm start            # Servidor de desarrollo (localhost:4200)
npm run build        # Build de producción
npm run test         # Ejecutar tests
```

---

## 🚢 Despliegue

### Producción (Automatizado)

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio && sudo ./install.sh
```

### Producción (Manual)

Ver [INSTALL.md](INSTALL.md) para opciones avanzadas de configuración.

---

## 🔧 Troubleshooting

### Ver logs
```bash
docker compose logs -f backend
docker compose logs -f mongo
```

### Reiniciar servicios
```bash
docker compose restart
```

### Resetear base de datos
```bash
docker compose down -v
docker compose up -d
sudo ./scripts/inject-credentials.sh
```

---

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

---

**Desarrollado por:** Ismail Haddouche Rhali  
**Versión:** 3.0.0  
**Repositorio:** https://github.com/ismailhaddouche/disherio
