# Scripts de DisherIO

## Instalacion Automatizada (Recomendado)

### Instalacion en 2 Comandos
```bash
git clone https://github.com/ismailhaddouche/disherio.git
cd disherio && sudo ./install.sh
```

El script `install.sh` automatiza todo el proceso:
1. Verifica requisitos del sistema
2. Instala Docker y dependencias
3. Configura IP, puertos y secretos
4. Aplica correcciones de bugs y seguridad
5. Inyecta credenciales de admin
6. Verifica la instalacion

## Instalacion Manual (Avanzado)

### Flujo Completo

1. **Pre-flight Check** (Validar entorno)
   ```bash
   sudo ./scripts/preflight-check.sh
   ```

2. **Instalador Corregido** (Instalar con credenciales funcionales)
   ```bash
   sudo ./scripts/install-fixed.sh
   ```

3. **Health Check** (Verificar instalacion)
   ```bash
   sudo ./scripts/health-check-full.sh
   ```

### Opcion Alternativa: Instalacion Manual + Inyeccion
```bash
# 1. Validar entorno
sudo ./scripts/preflight-check.sh

# 2. Usar docker-compose directamente
docker compose up -d

# 3. Inyectar credenciales
sudo ./scripts/inject-credentials.sh

# 4. Verificar
sudo ./scripts/health-check-full.sh
```

## Solucion de Problemas

### Login falla con "Invalid credentials"
```bash
sudo ./scripts/inject-credentials.sh
```

### No se creo el usuario admin
```bash
# Verificar si existe
docker compose exec mongo mongosh disherio --eval "db.staffs.find({email: 'admin@disherio.com'})"

# Recrear
sudo ./scripts/inject-credentials.sh "admin@disherio.com" "nuevaPassword123"
```

### Olvide la contraseña
```bash
sudo ./scripts/inject-credentials.sh "admin@disherio.com" "nuevaPassword123"
```

## Correccion de Bugs

Para aplicar correcciones a los bugs criticos documentados:

```bash
sudo ./scripts/fix-critical-bugs.sh
```

Esto corrige:
- JWT_SECRET con fallback inseguro (SEC-01)
- Inconsistencia KITCHEN vs KTS (BUG-03)
- Typos 'alergen' -> 'allergen' (BUG-02)
- Agrega validacion de ObjectId (BUG-01)

Despues de aplicar fixes:
```bash
docker compose down
docker compose up -d --build
```

## Scripts Disponibles

| Script | Descripcion | Uso |
|--------|-------------|-----|
| `preflight-check.sh` | Valida requisitos antes de instalar | Pre-instalacion |
| `install-fixed.sh` | Instalador corregido con credenciales funcionales | Instalacion |
| `inject-credentials.sh` | Inyecta/actualiza credenciales de admin en BD | Reparacion |
| `health-check-full.sh` | Verificacion completa de todos los servicios | Post-instalacion |
| `fix-critical-bugs.sh` | Aplica correcciones a bugs de CODE_ANALYSIS.md | Mantenimiento |
| `fix-security-ratelimit.sh` | Agrega rate limiting a rutas QR (SEC-02) | Seguridad |
| `fix-performance.sh` | Optimiza login PIN y cache de dishes | Rendimiento |
| `validate-business-rules.sh` | Valida que todas las reglas de negocio esten OK | QA |
| `configure.sh` | Reconfigurar dominio/puerto | Reconfiguracion |
| `backup.sh` | Backup de base de datos | Backup |
| `verify.sh` | Verificar estado de instalacion (original) | Verificacion |
| `health-check.sh` | Check de salud basico (original) | Verificacion |

## Flujo de Desarrollo y Debugging

### 1. Validar Logica de Negocio
```bash
sudo ./scripts/validate-business-rules.sh
```

### 2. Aplicar Fixes Necesarios
```bash
# Bugs criticos (SEC-01, BUG-03, BUG-02, BUG-01)
sudo ./scripts/fix-critical-bugs.sh

# Rate limiting y seguridad (SEC-02)
sudo ./scripts/fix-security-ratelimit.sh

# Optimizaciones de rendimiento
sudo ./scripts/fix-performance.sh
```

### 3. Reconstruir y Verificar
```bash
docker compose down
docker compose up -d --build
sudo ./scripts/health-check-full.sh
sudo ./scripts/validate-business-rules.sh
```

## Bugs Corregidos

### Seguridad (SEC-*)
- **SEC-01**: JWT_SECRET con fallback 'changeme' → Eliminado
- **SEC-02**: Rate limiting en rutas publicas de QR → Agregado

### Bugs Funcionales (BUG-*)
- **BUG-01**: Falta validacion de ObjectId → Agregada en BaseRepository
- **BUG-02**: Typo 'alergen' → Corregido a 'allergen'
- **BUG-03**: Inconsistencia KITCHEN vs KTS → Estandarizado a 'KTS'
- **BUG-04**: Rutas publicas sin rate limiting → Protegidas
- **BUG-05**: Memory leak en Socket.IO → Agregado cleanup
- **BUG-06**: Race condition sin notificacion → Errores emitidos al cliente
- **BUG-07**: Validacion de extras incompleta → Verificada
- **BUG-08**: URLs de imagen sin validacion → Validacion agregada

### Optimizaciones (PERF-*)
- **PERF-01**: Login PIN iteraba sobre todos los usuarios → Cache agregado
- **PERF-02**: Queries repetidas a dish/category → Cache de 2 min
- **PERF-03**: 'any' types en servicios → Tipado completo

Despues de instalacion correcta:
- **Email:** admin@disherio.com
- **Password:** (generado aleatoriamente, ver archivo `.credentials`)
- **PIN:** 0000

## Comandos Utiles

### Docker
```bash
# Estado de servicios
docker compose ps

# Logs en tiempo real
docker compose logs -f backend
docker compose logs -f mongo
docker compose logs -f caddy

# Reiniciar servicio especifico
docker compose restart backend

# Shell en contenedores
docker compose exec backend sh
docker compose exec mongo mongosh disherio
```

### MongoDB
```bash
# Conectar a la base de datos
docker compose exec mongo mongosh disherio

# Ver usuarios
db.staffs.find().pretty()

# Ver restaurantes
db.restaurants.find().pretty()

# Resetear contraseña manualmente
db.staffs.updateOne(
  {email: "admin@disherio.com"},
  {$set: {password_hash: "nuevo_hash_bcrypt"}}
)
```

### Backup y Restore
```bash
# Crear backup
sudo ./scripts/backup.sh

# Restore (desde backup)
docker compose exec -T mongo mongorestore --archive < backup-file.archive
```

## Documentacion Relacionada

- `../CODE_ANALYSIS.md` - Analisis estatico con bugs encontrados
- `../SECURITY_AUDIT.md` - Auditoria de seguridad
- `../REVIEW_REPORT.md` - Reporte de revision de codigo
- `../INSTALL.md` - Guia de instalacion original
