#!/bin/bash
# ============================================================
# EduACAS - EC2 Initial Setup Script
# ============================================================
# Chạy script này TRƯỚC TIÊN trên EC2 mới (1 lần duy nhất)
#
# Cài đặt: Docker, Docker Compose, cấu hình swap, build containers
#
# Usage:
#   chmod +x setup-ec2.sh && ./setup-ec2.sh
#
# Chạy như root hoặc sudo.
# ============================================================

set -e

# ─── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "\n${BOLD}${CYAN}==>${NC} ${BOLD}$1${NC}"; }
log_sub()   { echo -e "${BLUE}    $1${NC}"; }

# ─── Detect OS ────────────────────────────────────────────────
detect_os() {
    log_step "Detecting OS..."

    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_ID="$ID"
        OS_ID_LIKE="$ID_LIKE"
        OS_VERSION="$VERSION_ID"
        OS_NAME="$NAME"
    else
        log_error "Cannot detect OS. /etc/os-release not found."
        exit 1
    fi

    log_info "Detected: ${BOLD}$OS_NAME${NC} ($OS_ID) v$OS_VERSION"

    case "$OS_ID" in
        amazon|amzn)
            DISTRO="amazon"
            ;;
        ubuntu)
            DISTRO="ubuntu"
            ;;
        debian)
            DISTRO="debian"
            ;;
        *)
            if [[ "$OS_ID_LIKE" == *"debian"* ]] || [[ "$OS_ID_LIKE" == *"ubuntu"* ]]; then
                DISTRO="debian"
            elif [[ "$OS_ID_LIKE" == *"amazon"* ]]; then
                DISTRO="amazon"
            else
                log_warn "OS '$OS_ID' may not be fully supported. Proceeding anyway..."
                DISTRO="unknown"
            fi
            ;;
    esac

    log_info "Distro family: $DISTRO"
}

# ─── Check root ───────────────────────────────────────────────
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Please run as root: sudo ./setup-ec2.sh"
        exit 1
    fi
}

# ─── System update ────────────────────────────────────────────
system_update() {
    log_step "Updating system packages..."

    case "$DISTRO" in
        amazon)
            yum update -y
            ;;
        ubuntu|debian)
            export DEBIAN_FRONTEND=noninteractive
            apt-get update -y
            apt-get upgrade -y -o Dpkg::Options::="--force-confold"
            ;;
        *)
            yum update -y 2>/dev/null || apt-get update -y 2>/dev/null || true
            ;;
    esac

    log_info "System updated."
}

# ─── Install Docker ───────────────────────────────────────────
install_docker() {
    log_step "Installing Docker..."

    if command -v docker &> /dev/null; then
        local ver
        ver=$(docker --version 2>/dev/null || echo "unknown")
        log_info "Docker already installed: $ver"
        return
    fi

    case "$DISTRO" in
        amazon)
            # Amazon Linux 2023 has Docker in extras
            amazon-linux-extras install docker -y 2>/dev/null || {
                log_warn "amazon-linux-extras not available, using official script..."
                curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
                sh /tmp/get-docker.sh
            }
            ;;
        ubuntu|debian)
            export DEBIAN_FRONTEND=noninteractive

            # Install prerequisites
            apt-get install -y ca-certificates curl gnupg lsb-release

            # Add Docker GPG key
            mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$DISTRO/gpg \
                -o /etc/apt/keyrings/docker.gpg 2>/dev/null \
                || curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
                -o /etc/apt/keyrings/docker.gpg

            # Add Docker repo
            local arch
            arch=$(dpkg --print-architecture)
            echo "deb [arch=$arch signed-by=/etc/apt/keyrings/docker.gpg] \
                https://download.docker.com/linux/$DISTRO $(lsb_release -cs) stable" \
                | tee /etc/apt/sources.list.d/docker.list > /dev/null

            # On Amazon Linux, adjust repo URL
            if [[ "$DISTRO" == "amazon" ]]; then
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
                    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
                    | tee /etc/apt/sources.list.d/docker.list > /dev/null
            fi

            apt-get update -y
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        *)
            # Fallback: official Docker install script
            curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
            sh /tmp/get-docker.sh
            ;;
    esac

    log_info "Docker installed."
}

# ─── Enable & start Docker ────────────────────────────────────
start_docker() {
    log_step "Enabling and starting Docker daemon..."

    systemctl enable docker --now 2>/dev/null || {
        log_warn "systemctl not available, starting dockerd directly..."
        dockerd &>/var/log/dockerd.log &
        sleep 3
    }

    # Wait for docker to be ready
    local i=0
    while ! docker info &>/dev/null; do
        sleep 2
        ((i++))
        if [[ $i -gt 15 ]]; then
            log_error "Docker daemon failed to start. Check logs: journalctl -u docker"
            exit 1
        fi
    done

    log_info "Docker daemon is running."
}

# ─── Docker Compose v2 plugin ────────────────────────────────
install_docker_compose() {
    log_step "Ensuring Docker Compose plugin..."

    # Docker Compose v2 is installed as docker-compose-plugin on newer Docker
    if docker compose version &>/dev/null; then
        log_info "Docker Compose plugin: $(docker compose version)"
        return
    fi

    # Fallback: standalone docker-compose binary
    log_warn "Docker Compose plugin not found, installing standalone binary..."
    curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose 2>/dev/null || true

    log_info "Docker Compose: $(docker-compose version 2>/dev/null || /usr/local/bin/docker-compose version)"
}

# ─── Add ubuntu user to docker group ─────────────────────────
setup_docker_group() {
    log_step "Configuring Docker group..."

    # Find the primary non-root user
    DEPLOY_USER=$(whoami | grep -v root | head -1)
    if [[ -z "$DEPLOY_USER" ]] && [[ -n "$SUDO_USER" ]]; then
        DEPLOY_USER="$SUDO_USER"
    fi

    if [[ -n "$DEPLOY_USER" ]]; then
        usermod -aG docker "$DEPLOY_USER"
        log_info "User '$DEPLOY_USER' added to docker group."
        log_info "Log out and log back in for group changes to take effect."
    else
        log_warn "Could not detect user. You may need to run: usermod -aG docker <username>"
    fi
}

# ─── Configure swap for JPlag ─────────────────────────────────
setup_swap() {
    log_step "Configuring swap space for JPlag..."

    local swap_total
    swap_total=$(free -m | awk '/^Mem:/{print $2}')
    local swap_current
    swap_current=$(free -m | awk '/^Swap:/{print $2}')

    if [[ "$swap_current" -gt 0 ]]; then
        log_info "Swap already configured: ${swap_current}MB."
        return
    fi

    log_info "Current RAM: ${swap_total}MB. Adding 4GB swap for JPlag..."

    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    # Make swap persistent
    if ! grep -q "/swapfile" /etc/fstab 2>/dev/null; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi

    # Tune swappiness (prefer RAM over swap)
    sysctl -w vm.swappiness=10 2>/dev/null || true
    if ! grep -q "vm.swappiness" /etc/sysctl.conf 2>/dev/null; then
        echo "vm.swappiness=10" >> /etc/sysctl.conf
    fi

    log_info "Swap configured: 4GB at /swapfile"
}

# ─── Install git & utilities ──────────────────────────────────
install_utils() {
    log_step "Installing utilities..."

    case "$DISTRO" in
        amazon)
            yum install -y git unzip wget curl
            ;;
        ubuntu|debian)
            export DEBIAN_FRONTEND=noninteractive
            apt-get install -y git unzip wget curl ca-certificates
            ;;
        *)
            yum install -y git unzip wget curl 2>/dev/null || \
            apt-get install -y git unzip wget curl 2>/dev/null || true
            ;;
    esac

    log_info "Utilities installed."
}

# ─── Configure firewall (optional) ────────────────────────────
setup_firewall() {
    log_step "Configuring firewall (UFW)..."

    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        # Internal ports — only from localhost
        ufw allow from 127.0.0.1 to any port 6379 proto tcp
        ufw allow from 127.0.0.1 to any port 5672 proto tcp
        ufw allow from 127.0.0.1 to any port 15672 proto tcp
        ufw --force reload
        log_info "UFW enabled with Docker port rules."
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --reload
        log_info "firewalld configured."
    else
        log_warn "No firewall detected (UFW/firewalld). Please configure manually."
    fi
}

# ─── Pull latest code ─────────────────────────────────────────
pull_code() {
    log_step "Checking project source..."

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

    # If this script is inside the project dir, we're already there
    if [[ -f "$PROJECT_DIR/docker-compose.prod.yml" ]]; then
        log_info "Project found at: $PROJECT_DIR"
        if [[ -d "$PROJECT_DIR/.git" ]]; then
            cd "$PROJECT_DIR"
            log_info "Pulling latest from git..."
            git pull origin main 2>/dev/null || log_warn "Git pull failed (may need git config)"
        fi
    else
        log_warn "Project source not found at $PROJECT_DIR"
        log_info "Clone the repo or copy source files, then run deploy/deploy.sh"
    fi
}

# ─── Build containers ──────────────────────────────────────────
build_containers() {
    log_step "Building Docker containers..."

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
    cd "$PROJECT_DIR"

    # Check for .env
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.production" ]]; then
            log_warn ".env not found. Creating from .env.production template..."
            cp .env.production .env
            log_error "Please edit .env and fill in your credentials, then re-run."
            log_info "  nano .env"
            exit 1
        else
            log_error ".env and .env.production not found. Cannot build."
            exit 1
        fi
    fi

    # Check for placeholders
    if grep -q "your_\|change_this\|placeholder" .env 2>/dev/null; then
        log_warn ".env contains placeholder values. Please update first:"
        grep -n "your_\|change_this\|placeholder" .env | head -10
        log_error "Edit .env and re-run this script."
        exit 1
    fi

    log_info "Building images (first run takes 10-20 minutes)..."
    log_info "Services being built:"
    log_sub "  - acas-api-gateway  (Ocelot API Gateway)"
    log_sub "  - acas-auth-service (JWT Authentication)"
    log_sub "  - acas-service      (Core ACAS logic + JPlag)"
    log_sub "  - acas-web-app      (Next.js frontend)"
    log_sub "  - acas-nginx        (Reverse proxy)"
    log_sub "  - acas-redis        (Cache)"
    log_sub "  - acas-rabbitmq     (Message broker)"
    log_sub "  - acas-code-runner  (Code execution)"
    echo ""

    docker compose -f docker-compose.prod.yml build --pull

    log_info "Build complete."
}

# ─── Start services ───────────────────────────────────────────
start_services() {
    log_step "Starting services..."

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
    cd "$PROJECT_DIR"

    docker compose -f docker-compose.prod.yml up -d

    log_info "Waiting 15s for services to initialize..."
    sleep 15

    echo ""
    docker compose -f docker-compose.prod.yml ps
}

# ─── Print summary ────────────────────────────────────────────
print_summary() {
    local domain
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
    cd "$PROJECT_DIR"

    if [[ -f ".env" ]]; then
        domain=$(grep "^DOMAIN=" .env 2>/dev/null | cut -d'=' -f2 | tr -d ' \r')
        domain=${domain:-localhost}
    else
        domain="your-domain.com"
    fi

    echo ""
    echo "============================================================"
    echo "  ${GREEN}${BOLD}EduACAS Setup Complete!${NC}"
    echo "============================================================"
    echo ""
    echo "  ${BOLD}Access URLs:${NC}"
    echo "  ${GREEN}  Frontend:  http://$domain${NC}"
    echo "  ${GREEN}  API:       http://$domain/api/${NC}"
    echo "  ${GREEN}  Swagger:   http://$domain/swagger/acas/${NC}"
    echo ""
    echo "  ${BOLD}Internal (localhost only):${NC}"
    echo "  ${YELLOW}  RabbitMQ:  http://localhost:15672${NC}"
    echo "  ${YELLOW}  Redis:     localhost:6379${NC}"
    echo ""
    echo "  ${BOLD}Next steps:${NC}"
    echo "  ${CYAN}  1.${NC} Point your domain DNS A record to this EC2 IP"
    echo "  ${CYAN}  2.${NC} Update Google OAuth Authorized URIs in Google Cloud Console"
    echo "  ${CYAN}  3.${NC} Create DynamoDB tables in AWS (or they may be auto-created)"
    echo "  ${CYAN}  4.${NC} Update S3 bucket CORS if needed"
    echo ""
    echo "  ${BOLD}Useful commands:${NC}"
    echo "  ${BLUE}  View logs:    ./deploy/deploy.sh --logs${NC}"
    echo "  ${BLUE}  Restart:      ./deploy/deploy.sh --restart${NC}"
    echo "  ${BLUE}  Stop:         ./deploy/deploy.sh --stop${NC}"
    echo "  ${BLUE}  Rebuild:      ./deploy/deploy.sh --build-only && ./deploy/deploy.sh${NC}"
    echo "============================================================"
}

# ─── Usage ────────────────────────────────────────────────────
usage() {
    echo "Usage: sudo ./setup-ec2.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-build    Chỉ cài đặt Docker, không build containers"
    echo "  --no-firewall   Bỏ qua cấu hình firewall"
    echo "  --help, -h      Hiển thị trợ giúp"
    echo ""
    echo "Default: Cài đặt Docker + Docker Compose + Build & Start containers"
}

# ─── Main ─────────────────────────────────────────────────────
main() {
    echo "============================================================"
    echo "  EduACAS — EC2 Initial Setup"
    echo "============================================================"

    local skip_build=false
    local no_firewall=false

    for arg in "$@"; do
        case "$arg" in
            --skip-build) skip_build=true ;;
            --no-firewall) no_firewall=true ;;
            --help|-h) usage; exit 0 ;;
        esac
    done

    check_root
    detect_os
    system_update
    install_utils
    install_docker
    start_docker
    install_docker_compose
    setup_docker_group
    setup_swap

    if [[ "$no_firewall" != "true" ]]; then
        setup_firewall
    fi

    pull_code

    if [[ "$skip_build" != "true" ]]; then
        build_containers
        start_services
    fi

    print_summary
}

main "$@"
