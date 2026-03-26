#!/usr/bin/env bash
# =============================================================================
# DisherIo - Inyeccion de Credenciales Manual
# Usar cuando el install.sh no ha creado correctamente el usuario admin
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

error_exit() { echo -e "${RED}ERROR: $1${NC}"; exit 1; }
log_info() { echo -e "${BLUE}$1${NC}"; }
log_success() { echo -e "${GREEN}$1${NC}"; }
log_warn() { echo -e "${YELLOW}$1${NC}"; }

# Credenciales (personalizables)
ADMIN_EMAIL="${1:-admin@disherio.com}"
ADMIN_PASSWORD="${2:-$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)}"
ADMIN_PIN="${3:-0000}"

echo -e "${BOLD}DisherIO - Inyeccion de Credenciales${NC}"
echo "======================================"
echo ""

# Verificar que los contenedores estan corriendo
if ! docker compose -f "$ROOT_DIR/docker-compose.yml" ps | grep -q "disherio_mongo"; then
    error_exit "MongoDB no esta corriendo. Inicia los servicios primero: docker compose up -d"
fi

log_info "Credenciales a inyectar:"
echo "  Email:    $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo "  PIN:      $ADMIN_PIN"
echo ""

# Esperar a que MongoDB responda
log_info "Conectando a MongoDB..."
max_wait=30
waited=0
while ! docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T mongo mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
    sleep 2
    waited=$((waited + 2))
    echo "  Esperando... ${waited}s"
    if [ $waited -ge $max_wait ]; then
        error_exit "MongoDB no responde"
    fi
done
log_success "MongoDB conectado"

# Inyectar credenciales usando Node.js con bcrypt
docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T backend node -e "
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function injectCredentials() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/disherio');
        
        // Definir schemas minimos
        const RestaurantSchema = new mongoose.Schema({
            restaurant_name: String,
            tax_rate: Number,
            currency: String,
            language: String
        }, { strict: false });
        
        const RoleSchema = new mongoose.Schema({
            restaurant_id: mongoose.Schema.Types.ObjectId,
            role_name: String,
            permissions: [String]
        }, { strict: false });
        
        const StaffSchema = new mongoose.Schema({
            restaurant_id: mongoose.Schema.Types.ObjectId,
            role_id: mongoose.Schema.Types.ObjectId,
            staff_name: String,
            email: String,
            password_hash: String,
            pin_code_hash: String
        }, { strict: false });
        
        const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
        const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
        const Staff = mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
        
        // Crear o encontrar restaurante
        let restaurant = await Restaurant.findOne({ restaurant_name: 'DisherIo Demo' });
        if (!restaurant) {
            restaurant = await Restaurant.create({
                restaurant_name: 'DisherIo Demo',
                tax_rate: 10,
                currency: 'EUR',
                language: 'es'
            });
            console.log('Restaurante creado:', restaurant._id);
        } else {
            console.log('Restaurante existente:', restaurant._id);
        }
        
        // Crear o encontrar rol admin
        let role = await Role.findOne({ restaurant_id: restaurant._id, role_name: 'Admin' });
        if (!role) {
            role = await Role.create({
                restaurant_id: restaurant._id,
                role_name: 'Admin',
                permissions: ['ADMIN']
            });
            console.log('Rol Admin creado');
        } else {
            console.log('Rol Admin existente');
        }
        
        // Hashear credenciales
        const passwordHash = await bcrypt.hash('$ADMIN_PASSWORD', 12);
        const pinHash = await bcrypt.hash('$ADMIN_PIN', 12);
        
        // Crear o actualizar usuario
        let staff = await Staff.findOne({ email: '$ADMIN_EMAIL' });
        if (!staff) {
            staff = await Staff.create({
                restaurant_id: restaurant._id,
                role_id: role._id,
                staff_name: 'Administrator',
                email: '$ADMIN_EMAIL',
                password_hash: passwordHash,
                pin_code_hash: pinHash
            });
            console.log('Usuario creado');
        } else {
            await Staff.updateOne(
                { email: '$ADMIN_EMAIL' },
                { 
                    password_hash: passwordHash,
                    pin_code_hash: pinHash,
                    restaurant_id: restaurant._id,
                    role_id: role._id
                }
            );
            console.log('Usuario actualizado con nuevas credenciales');
        }
        
        await mongoose.disconnect();
        console.log('');
        console.log('========================================');
        console.log('CREDENCIALES INYECTADAS CORRECTAMENTE');
        console.log('========================================');
        console.log('Email:    $ADMIN_EMAIL');
        console.log('Password: $ADMIN_PASSWORD');
        console.log('PIN:      $ADMIN_PIN');
        console.log('========================================');
        
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

injectCredentials();
"

# Guardar credenciales en archivo
CRED_FILE="$ROOT_DIR/.credentials"
cat > "$CRED_FILE" <<EOF
# DisherIO - Credenciales de Administrador
# Generado: $(date '+%Y-%m-%d %H:%M:%S')

ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_PIN=$ADMIN_PIN
EOF

chmod 600 "$CRED_FILE"
log_success "Credenciales guardadas en: $CRED_FILE"
