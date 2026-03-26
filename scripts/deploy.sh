#!/bin/bash
# ============================================
# DisherIo Deployment Script
# Usage: ./deploy.sh [environment] [version]
# Example: ./deploy.sh production v1.2.3
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
COMPOSE_FILE="docker-compose.prod.yml"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_info "Usage: ./deploy.sh [staging|production] [version]"
        exit 1
    fi
}

check_requirements() {
    log_info "Checking requirements..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Requirements OK"
}

deploy() {
    log_info "Starting deployment to $ENVIRONMENT..."
    cd "$PROJECT_DIR"
    export DEPLOY_ENV="$ENVIRONMENT"
    
    log_info "Building and starting containers..."
    docker compose -f "$COMPOSE_FILE" build --parallel
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    log_success "Containers started"
}

health_check() {
    log_info "Running health checks..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if wget -qO- http://localhost:3000/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            if wget -qO- http://localhost:4200 > /dev/null 2>&1; then
                log_success "Frontend is healthy"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        sleep 5
    done
    
    log_error "Health checks failed"
    return 1
}

main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  DisherIo Deployment${NC}"
    echo -e "${BLUE}  Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    validate_environment
    check_requirements
    deploy
    
    if health_check; then
        echo ""
        log_success "Deployment to $ENVIRONMENT completed successfully!"
        log_info "App URL: http://localhost"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

main "$@"
