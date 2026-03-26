# DisherIO - Instalacion Rápida

## Requisitos

- Ubuntu/Debian (20.04+)
- 1GB RAM mínimo (2GB recomendado)
- 5GB espacio en disco
- Conexión a internet
- Acceso root (sudo)

## Instalación en 2 Comandos

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio && sudo ./install.sh
```

## ¿Qué hace el instalador?

El script `install.sh` automatiza completamente el proceso:

1. **Verifica el sistema** - RAM, disco, conectividad
2. **Instala dependencias** - Docker, Docker Compose, UFW
3. **Configura automáticamente** - IP, secretos JWT, firewall
4. **Aplica correcciones** - Bugs de seguridad y rendimiento
5. **Inyecta credenciales** - Crea usuario admin automáticamente
6. **Verifica la instalación** - Comprueba que todo funciona

## Después de la instalación

Al finalizar, verás las credenciales de acceso:

```
╔════════════════════════════════════════════════════════════╗
║           DISHER.IO INSTALADO CORRECTAMENTE                ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  URL de Acceso:                                            ║
║    http://TU_IP                                            ║
║                                                            ║
║  CREDENCIALES DE ADMINISTRADOR:                            ║
║    Email:    admin@disherio.com                            ║
║    Password: xxxxxxxxxxxxxxxx                              ║
║    PIN:      0000                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**IMPORTANTE:** Cambia la contraseña después del primer login.

## Comandos Útiles

```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f mongo

# Reiniciar servicios
docker compose restart

# Ver estado
docker compose ps

# Backup de base de datos
sudo ./scripts/backup.sh
```

## Troubleshooting

### Puerto 80 ocupado
```bash
# Cambiar puerto en .env
sed -i 's/PORT=80/PORT=8080/' .env
docker compose up -d
```

### Olvidé la contraseña
```bash
sudo ./scripts/inject-credentials.sh "admin@disherio.com" "nuevaPassword123"
```

### Servicios no inician
```bash
# Ver errores
docker compose logs --tail=100

# Reiniciar todo
docker compose down
docker compose up -d
```

## Instalación Manual (Avanzado)

Si prefieres controlar cada paso:

```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio

# 1. Validar requisitos
sudo ./scripts/preflight-check.sh

# 2. Configurar (selecciona IP/dominio)
sudo ./scripts/configure.sh

# 3. Aplicar correcciones
sudo ./scripts/fix-critical-bugs.sh
sudo ./scripts/fix-security-ratelimit.sh
sudo ./scripts/fix-performance.sh

# 4. Construir e iniciar
docker compose up -d --build

# 5. Inyectar credenciales
sudo ./scripts/inject-credentials.sh

# 6. Verificar
sudo ./scripts/health-check-full.sh
```

## Desinstalación

```bash
sudo ./scripts/uninstall.sh
```

## Documentación

- `CODE_ANALYSIS.md` - Análisis de código y bugs conocidos
- `SECURITY_AUDIT.md` - Auditoría de seguridad
- `README.md` - Documentación completa del proyecto

---

**Versión del instalador:** 3.0.0
