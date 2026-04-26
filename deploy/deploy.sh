#!/bin/bash
# ============================================================
# EduACAS - Production Deployment Script
# ============================================================
# Usage:
#   ./deploy/deploy.sh           # Interactive (prompts for domain)
#   DOMAIN=your-domain.com ./deploy/deploy.sh  # Non-interactive
#
# Prerequisites on EC2:
#   1. Docker & Docker Compose installed
#   2. Clone the repo: git clone <repo-url>
#   3. Create .env from .env.production
#   4. Run this script
# ============================================================

set -e

# ─── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "\n${GREEN}==>${NC} $1"; }

# ─── Config ──────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
ENV_PROD_FILE="$PROJECT_DIR/.env.production"
COMPOSE_FILE="docker-compose.prod.yml"

# ─── Helpers ──────────────────────────────────────────────────
need_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Please run as root (or with sudo): ./deploy/deploy.sh"
        exit 1
    fi
}

check_env() {
    log_step "Checking environment..."

    if [[ ! -f "$ENV_FILE" ]]; then
        log_warn ".env not found!"
        log_info "Creating .env from .env.production template..."
        cp "$ENV_PROD_FILE" "$ENV_FILE"
        log_warn ".env has been created. Please edit it and fill in your credentials:"
        log_info "  nano $ENV_FILE"
        log_error "Aborted. Please configure .env and re-run."
        exit 1
    fi

    # Check for placeholder values
    local has_placeholder=false
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        [[ "$value" =~ ^your_.* || "$value" =~ ^change_this.* || "$value" =~ ^.*_here$ ]] && {
            log_warn "Variable $key still has placeholder value: $value"
            has_placeholder=true
        }
    done < "$ENV_FILE"

    if [[ "$has_placeholder" == "true" ]]; then
        log_error "Please replace all placeholder values in .env before deploying."
        exit 1
    fi

    log_info ".env looks good!"
}

check_docker() {
    log_step "Checking Docker..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Install with:"
        log_info "  sudo apt update && sudo apt install -y docker.io docker-compose"
        exit 1
   
    fi
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Start it with:"
        log_info "  sudo systemctl start docker"
        exit 1
    fi
    log_info "Docker is ready."
}

pull_latest() {
    log_step "Pulling latest code..."
    if [[ -d ".git" ]]; then
        git pull origin main
    else
        log_warn "Not a git repo — skipping git pull."
    fi
}

build_images() {
    log_step "Building Docker images (this may take 10-20 minutes on first run)..."

    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" build --pull
}

start_services() {
    log_step "Starting services..."
    cd "$PROJECT_DIR"

    # Stop old containers
    docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

    # Start all services
    docker compose -f "$COMPOSE_FILE" up -d

    log_info "Waiting for services to become healthy..."
    sleep 10

    # Show status
    docker compose -f "$COMPOSE_FILE" ps
}

verify() {
    log_step "Verifying deployment..."

    local domain
    domain=$(grep "^DOMAIN=" "$ENV_FILE" | cut -d'=' -f2)
    domain=${domain:-localhost}

    local frontend_url="http://$domain"

    log_info "Frontend:   $frontend_url"
    log_info "API:        ${frontend_url}/api/"
    log_info "Swagger:    ${frontend_url}/swagger/acas/"
    log_info "RabbitMQ:   ${frontend_url}:15672 (or localhost:15672)"
    log_info "Redis:      localhost:6379"

    log_info ""
    log_info "Deployment complete!"
}

usage() {
    echo "Usage: ./deploy/deploy.sh [options]"
    echo ""
    echo "Options:"
    echo "  --check       Only check prerequisites (Docker, .env)"
    echo "  --build-only  Build images but don't start services"
    echo "  --stop        Stop all services"
    echo "  --logs        Show logs for all services"
    echo "  --restart     Restart all services"
    echo ""
    echo "Environment:"
    echo "  DOMAIN=your-domain.com  Set domain non-interactively"
}

# ─── Main ────────────────────────────────────────────────────
case "${1:-}" in
    --check)
        need_root
        check_docker
        check_env
        log_info "All checks passed!"
        ;;
    --build-only)
        need_root
        check_env
        pull_latest
        build_images
        log_info "Build complete. Run without --build-only to start services."
        ;;
    --stop)
        need_root
        cd "$PROJECT_DIR"
        docker compose -f "$COMPOSE_FILE" down
        log_info "All services stopped."
        ;;
    --logs)
        cd "$PROJECT_DIR"
        docker compose -f "$COMPOSE_FILE" logs -f --tail=50
        ;;
    --restart)
        need_root
        cd "$PROJECT_DIR"
        docker compose -f "$COMPOSE_FILE" restart
        log_info "All services restarted."
        ;;
    --help|-h)
        usage
        ;;
    "")
        need_root
        check_docker
        check_env
        pull_latest
        build_images
        start_services
        verify
        ;;
    *)
        log_error "Unknown option: $1"
        usage
        exit 1
        ;;
esac
