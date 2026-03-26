#!/usr/bin/env bash
# =============================================================================
# DisherIo Installer v3.0 - FIXED
# Soluciona problemas de generacion de credenciales y seeding
# =============================================================================
set -euo pipefail

# Configuracion
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env"
CADDYFILE="$ROOT_DIR/Caddyfile"
CREDENTIALS_FILE="$ROOT_DIR/.credentials"
LOG_FILE="/var/log/disherio_install.log"

# Credenciales por defecto (configurables)
ADMIN_EMAIL="admin@disherio.com"
ADMIN_PASSWORD=""
ADMIN_PIN="0000"

# Colores
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# Funciones de utilidad
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

log_info() {
    echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}$1${NC}" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}$1${NC}" | tee -a "$LOG_FILE"
}

# =============================================================================
# GENERACION DE CREDENCIALES SEGURA
# =============================================================================

generate_secure_password() {
    local length=${1:-16}
    # Metodo 1: OpenSSL con filtrado garantizado
    local password=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9!@#$%^&*' | head -c "$length")
    
    # Fallback si esta vacio
    if [ -z "$password" ]; then
        password=$(date +%s%N | sha256sum | base64 | head -c "$length")
    fi
    
    # Fallback final
    if [ -z "$password" ]; then
        password="DisherIO$(date +%s)"
    fi
    
    echo "$password"
}

generate_jwt_secret() {
    openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64
}

# =============================================================================
# SEEDING DE BASE DE DATOS CON VERIFICACION
# =============================================================================

seed_database() {
    log_info "Inyectando credenciales en base de datos..."
    
    # Esperar a que MongoDB este listo
    local max_wait=60
    local waited=0
    while ! docker compose exec -T mongo mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
        sleep 2
        waited=$((waited + 2))
        if [ $waited -ge $max_wait ]; then
            error_exit "MongoDB no responde despues de ${max_wait}s"
        fi
    done
    
    log_success "MongoDB conectado"
    
    # Inyectar credenciales directamente via mongosh
    local hashed_password=$(echo -n "$ADMIN_PASSWORD" | openssl dgst -sha256 -binary | openssl base64)
    local hashed_pin=$(echo -n "$ADMIN_PIN" | openssl dgst -sha256 -binary | openssl base64)
    
    docker compose exec -T mongo mongosh disherio --quiet --eval "
        // Crear restaurante por defecto
        var restaurant = db.restaurants.findOne({ restaurant_name: 'DisherIo Demo' });
        if (!restaurant) {
            var restResult = db.restaurants.insertOne({
                restaurant_name: 'DisherIo Demo',
                tax_rate: 10,
                currency: 'EUR',
                language: 'es',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            restaurant = db.restaurants.findOne({ _id: restResult.insertedId });
            print('Restaurante creado: ' + restaurant._id);
        } else {
            print('Restaurante ya existe: ' + restaurant._id);
        }
        
        // Crear rol admin
        var role = db.roles.findOne({ restaurant_id: restaurant._id, role_name: 'Admin' });
        if (!role) {
            var roleResult = db.roles.insertOne({
                restaurant_id: restaurant._id,
                role_name: 'Admin',
                permissions: ['ADMIN'],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            role = db.roles.findOne({ _id: roleResult.insertedId });
            print('Rol Admin creado');
        } else {
            print('Rol Admin ya existe');
        }
        
        // Crear usuario admin
        var staff = db.staffs.findOne({ email: '$ADMIN_EMAIL' });
        if (!staff) {
            db.staffs.insertOne({
                restaurant_id: restaurant._id,
                role_id: role._id,
                staff_name: 'Administrator',
                email: '$ADMIN_EMAIL',
                password_hash: '\$2a\$12\$$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 22)',
                pin_code_hash: '\$2a\$12\$$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 22)',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            print('Usuario admin creado');
        } else {
            print('Usuario admin ya existe');
        }
    "
    
    # ACTUALIZAR CONTRASEÑA REAL USANDO BCRYPT
    log_info "Hasheando credenciales con bcrypt..."
    
    # Usar el backend para hashear correctamente
    docker compose exec -T backend node -e "
        const bcrypt = require('bcryptjs');
        const mongoose = require('mongoose');
        
        async function updatePasswords() {
            await mongoose.connect(process.env.MONGODB_URI);
            
            const passwordHash = await bcrypt.hash('$ADMIN_PASSWORD', 12);
            const pinHash = await bcrypt.hash('$ADMIN_PIN', 12);
            
            await mongoose.connection.collection('staffs').updateOne(
                { email: '$ADMIN_EMAIL' },
                { \$set: { 
                    password_hash: passwordHash,
                    pin_code_hash: pinHash,
                    updatedAt: new Date()
                }}
            );
            
            console.log('Contraseñas actualizadas correctamente');
            await mongoose.disconnect();
        }
        
        updatePasswords().catch(e => {
            console.error('Error:', e.message);
            process.exit(1);
        });
    "
}

# =============================================================================
# VERIFICACION DE CREDENCIALES
# =============================================================================

verify_credentials() {
    log_info "Verificando credenciales en base de datos..."
    
    local result=$(docker compose exec -T mongo mongosh disherio --quiet --eval "
        var staff = db.staffs.findOne({ email: '$ADMIN_EMAIL' });
        if (staff) {
            print('EXISTS:' + staff._id);
        } else {
            print('NOT_FOUND');
        }
    ")
    
    if [[ "$result" == *"EXISTS"* ]]; then
        log_success "Usuario verificado en base de datos"
        return 0
    else
        log_warn "Usuario no encontrado en verificacion"
        return 1
    fi
}

# =============================================================================
# GUARDAR CREDENCIALES DE FORMA SEGURA
# =============================================================================

save_credentials() {
    cat > "$CREDENTIALS_FILE" <<EOF
# DisherIO - Credenciales de Administrador
# Generado: $(date '+%Y-%m-%d %H:%M:%S')
# IMPORTANTE: Cambiar estas credenciales despues del primer login

ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_PIN=$ADMIN_PIN

URL_DE_ACCESO=$ACCESS_URL
EOF
    
    chmod 600 "$CREDENTIALS_FILE"
    
    # Tambien guardar en .env para referencia
    cat >> "$ENV_FILE" <<EOF

# Credenciales Admin (generadas por install.sh)
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
EOF
    
    log_info "Credenciales guardadas en: $CREDENTIALS_FILE"
}

# =============================================================================
# BANNER Y MENUS
# =============================================================================

banner() {
    echo -e "${CYAN}"
    echo "  ██████╗ ██╗███████╗██╗  ██╗███████╗██████╗ ██╗ ██████╗ "
    echo "  ██╔══██╗██║██╔════╝██║  ██║██╔════╝██╔══██╗██║██╔═══██╗"
    echo "  ██║  ██║██║███████╗███████║█████╗  ██████╔╝██║██║   ██║"
    echo "  ██║  ██║██║╚════██║██╔══██║██╔══╝  ██╔══██╗██║██║   ██║"
    echo "  ██████╔╝██║███████║██║  ██║███████╗██║  ██║██║╚██████╔╝"
    echo "  ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ "
    echo -e "${NC}"
    echo -e "${BOLD}  Instalador v3.0 - Sistema de gestion de restaurantes${NC}"
    echo ""
}

# =============================================================================
# CONFIGURACION DE ACCESO
# =============================================================================

configure_access() {
    log_info "Configuracion de Acceso"
    
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
    PUBLIC_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "")
    
    echo "Selecciona el tipo de acceso:"
    echo "1) Dominio personalizado"
    echo "2) IP Local ($LOCAL_IP)"
    echo "3) IP Publica ($PUBLIC_IP)"
    read -p "Opcion [1-3] (default: 2): " ACCESS_OPT
    ACCESS_OPT=${ACCESS_OPT:-2}
    
    case "$ACCESS_OPT" in
        1)
            read -p "Introduce tu dominio (ej: app.disher.io): " CADDY_DOMAIN
            IS_PUBLIC_DOMAIN="true"
            ;;
        2)
            CADDY_DOMAIN="$LOCAL_IP"
            IS_PUBLIC_DOMAIN="false"
            ;;
        3)
            CADDY_DOMAIN="$PUBLIC_IP"
            IS_PUBLIC_DOMAIN="false"
            ;;
        *)
            CADDY_DOMAIN="$LOCAL_IP"
            IS_PUBLIC_DOMAIN="false"
            ;;
    esac
    
    read -p "Puerto HTTP (default 80): " PORT
    PORT=${PORT:-80}
}

# =============================================================================
# INSTALACION DE DEPENDENCIAS
# =============================================================================

install_dependencies() {
    log_info "Instalando dependencias..."
    
    apt-get update -qq >/dev/null 2>&1
    
    for pkg in curl wget ufw openssl docker.io docker-compose-plugin; do
        if ! dpkg -l | grep -q "^ii  $pkg "; then
            log_info "Instalando $pkg..."
            apt-get install -y -qq "$pkg" </dev/null >/dev/null 2>&1 || true
        fi
    done
    
    # Configurar firewall
    ufw allow 22/tcp >/dev/null 2>&1 || true
    ufw allow "$PORT/tcp" >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    ufw --force enable >/dev/null 2>&1 || true
    
    log_success "Dependencias instaladas"
}

# =============================================================================
# CONFIGURACION DE ARCHIVOS
# =============================================================================

write_config() {
    log_info "Generando archivos de configuracion..."
    
    # Generar secretos
    JWT_SECRET=$(generate_jwt_secret)
    ADMIN_PASSWORD=$(generate_secure_password 16)
    
    # Configurar FRONTEND_URL
    if [ "$IS_PUBLIC_DOMAIN" = "true" ]; then
        FRONTEND_URL="https://${CADDY_DOMAIN}"
        ACCESS_URL="https://${CADDY_DOMAIN}"
    elif [ "$PORT" = "80" ]; then
        FRONTEND_URL="http://${CADDY_DOMAIN}"
        ACCESS_URL="http://${CADDY_DOMAIN}"
    else
        FRONTEND_URL="http://${CADDY_DOMAIN}:${PORT}"
        ACCESS_URL="http://${CADDY_DOMAIN}:${PORT}"
    fi
    
    # Escribir .env
    cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=${PORT}
HTTPS_PORT=443
BACKEND_PORT=3000
MONGODB_URI=mongodb://mongo:27017/disherio
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES=8h
ADMIN_EMAIL=${ADMIN_EMAIL}
APP_LANG=es
FRONTEND_URL=${FRONTEND_URL}
LOG_LEVEL=info
EOF
    
    chmod 600 "$ENV_FILE"
    
    # Escribir Caddyfile
    if [ "$IS_PUBLIC_DOMAIN" = "true" ]; then
        cat > "$CADDYFILE" <<EOF
$CADDY_DOMAIN {
    handle /api/* { reverse_proxy backend:3000 }
    handle /socket.io/* { reverse_proxy backend:3000 }
    handle { reverse_proxy frontend:4200 }
}
EOF
    else
        cat > "$CADDYFILE" <<EOF
{
    admin off
    auto_https off
}
:${PORT} {
    handle /api/* { reverse_proxy backend:3000 }
    handle /socket.io/* {
        reverse_proxy backend:3000 {
            transport http { versions h1 }
        }
    }
    handle { reverse_proxy frontend:4200 }
}
EOF
    fi
    
    log_success "Configuracion guardada"
}

# =============================================================================
# BUILD Y START
# =============================================================================

build_and_start() {
    log_info "Construyendo imagenes Docker..."
    cd "$ROOT_DIR"
    
    docker compose build --no-cache 2>&1 | tee -a "$LOG_FILE" | grep -E "^(Step|#|ERROR)" || true
    
    log_info "Iniciando servicios..."
    docker compose up -d 2>&1 | tee -a "$LOG_FILE"
    
    # Esperar a que todo este saludable
    log_info "Esperando que los servicios esten listos..."
    sleep 10
    
    local max_wait=180
    local waited=0
    
    while ! docker compose ps | grep -q "healthy"; do
        sleep 5
        waited=$((waited + 5))
        echo "  ... ${waited}s/${max_wait}s"
        if [ $waited -ge $max_wait ]; then
            log_warn "Timeout esperando servicios"
            break
        fi
    done
}

# =============================================================================
# RESUMEN FINAL
# =============================================================================

print_summary() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            DISHER.IO INSTALADO CORRECTAMENTE                   ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  URL de Acceso:  ${BOLD}${ACCESS_URL}${NC}"
    echo -e "${GREEN}║${NC}                                                 ${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}CREDENCIALES DE ADMINISTRADOR:${NC}"
    echo -e "${GREEN}║${NC}  Email:    ${BOLD}${ADMIN_EMAIL}${NC}"
    echo -e "${GREEN}║${NC}  Password: ${BOLD}${ADMIN_PASSWORD}${NC}"
    echo -e "${GREEN}║${NC}  PIN:      ${BOLD}${ADMIN_PIN}${NC}"
    echo -e "${GREEN}║${NC}                                                 ${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}IMPORTANTE:${NC}"
    echo -e "${GREEN}║${NC}  - Cambia la contraseña despues del primer login"
    echo -e "${GREEN}║${NC}  - Credenciales guardadas en: .credentials"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Mostrar estado de contenedores
    docker compose ps
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    # Verificar root
    if [ "$EUID" -ne 0 ]; then
        error_exit "Ejecuta como root: sudo ./scripts/install.sh"
    fi
    
    # Inicializar log
    echo "=== Instalacion DisherIO $(date) ===" > "$LOG_FILE"
    
    banner
    configure_access
    install_dependencies
    write_config
    build_and_start
    seed_database
    verify_credentials
    save_credentials
    print_summary
}

main "$@"
