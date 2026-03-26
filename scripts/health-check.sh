#!/bin/bash
# ============================================
# DisherIo Health Check Script
# Usage: ./health-check.sh [component]
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPONENT="${1:-all}"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_docker() {
    if docker info > /dev/null 2>&1; then
        log_ok "Docker daemon is running"
        return 0
    else
        log_error "Docker daemon is not running"
        return 1
    fi
}

check_container() {
    local name=$1
    if docker ps --format "{{.Names}}" | grep -q "^${name}$"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null)
        if [ "$status" = "running" ]; then
            log_ok "$name is running"
            return 0
        else
            log_error "$name is not running (status: $status)"
            return 1
        fi
    else
        log_error "$name container not found"
        return 1
    fi
}

check_backend() {
    if wget -qO- http://localhost:3000/health > /dev/null 2>&1; then
        log_ok "Backend API is responding"
        return 0
    else
        log_error "Backend API is not responding"
        return 1
    fi
}

check_frontend() {
    if wget -qO- http://localhost:4200 > /dev/null 2>&1; then
        log_ok "Frontend is responding"
        return 0
    else
        log_error "Frontend is not responding"
        return 1
    fi
}

main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  DisherIo Health Check${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    local overall_status=0
    
    case "$COMPONENT" in
        docker) check_docker || overall_status=1 ;;
        backend) check_container "disherio_backend" && check_backend || overall_status=1 ;;
        frontend) check_container "disherio_frontend" && check_frontend || overall_status=1 ;;
        mongo) check_container "disherio_mongo" || overall_status=1 ;;
        all|*)
            check_docker || overall_status=1
            check_container "disherio_mongo" || overall_status=1
            check_container "disherio_backend" || overall_status=1
            check_container "disherio_frontend" || overall_status=1
            check_container "disherio_caddy" || overall_status=1
            ;;
    esac
    
    echo -e "${BLUE}========================================${NC}"
    if [ $overall_status -eq 0 ]; then
        echo -e "${GREEN}  All checks passed${NC}"
    else
        echo -e "${RED}  Some checks failed${NC}"
    fi
    echo -e "${BLUE}========================================${NC}"
    
    exit $overall_status
}

main "$@"
