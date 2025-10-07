#!/usr/bin/env bash
# Unified deployment script for Fataplus-Agritech-Platform
# - Provides a single entrypoint to build, test and deploy to multiple targets
# - Supports: dry-run, build, docker-compose, cloudflare, cloudron
# - Designed to be idempotent and safe for CI use

set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="Fataplus-Agritech-Platform"
SCRIPT_NAME="$(basename "$0")"

# Defaults
TARGET="docker-compose"
ENV="production"
DRY_RUN=false
SKIP_TESTS=false
FORCE=false
VERBOSE=false

usage() {
  cat <<-EOF
Usage: $SCRIPT_NAME [options]

Options:
  -t, --target TARGET      Deployment target: docker-compose|cloudflare|cloudron|local|build (default: docker-compose)
  -e, --env ENV            Environment (development|staging|production) (default: production)
  -n, --dry-run            Print actions without executing (safe for CI checks)
  -s, --skip-tests         Skip running tests before deploy
  -f, --force              Skip confirmations
  -v, --verbose            Verbose output
  -h, --help               Show this help

Examples:
  $SCRIPT_NAME -t docker-compose -e staging
  $SCRIPT_NAME --target cloudflare --dry-run

This script centralizes existing deployment logic found in deployment/ and related folders.
It intentionally calls the existing specialized scripts where appropriate.
EOF
}

log() { echo "[info] $*"; }
err() { echo "[error] $*" >&2; }
warn() { echo "[warn] $*" >&2; }

confirm() {
  if [ "$FORCE" = true ]; then
    return 0
  fi
  read -r -p "$1 [y/N]: " ans
  case "$ans" in
    [Yy]*) return 0 ;;
    *) return 1 ;;
  esac
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -t|--target)
        TARGET="$2"; shift 2 ;;
      -e|--env)
        ENV="$2"; shift 2 ;;
      -n|--dry-run)
        DRY_RUN=true; shift ;;
      -s|--skip-tests)
        SKIP_TESTS=true; shift ;;
      -f|--force)
        FORCE=true; shift ;;
      -v|--verbose)
        VERBOSE=true; set -x; shift ;;
      -h|--help)
        usage; exit 0 ;;
      *)
        err "Unknown argument: $1"; usage; exit 2 ;;
    esac
  done
}

run_or_echo() {
  if [ "$DRY_RUN" = true ]; then
    echo "DRY-RUN: $*"
  else
    eval "$*"
  fi
}

check_prereqs() {
  log "Checking prerequisites for target=$TARGET env=$ENV"
  case "$TARGET" in
    docker-compose|build|local)
      command -v docker >/dev/null 2>&1 || warn "docker not found; docker-based deploys will fail"
      command -v docker-compose >/dev/null 2>&1 || warn "docker-compose not found; some compose files use docker-compose"
      ;;
    cloudflare)
      command -v node >/dev/null 2>&1 || warn "node not found; cloudflare scripts may require node"
      command -v wrangler >/dev/null 2>&1 || warn "wrangler not found; Cloudflare deploys use wrangler"
      ;;
    cloudron)
      command -v cloudron >/dev/null 2>&1 || warn "cloudron CLI not found; cloudron deploys require it"
      ;;
    *) warn "Unknown target: $TARGET" ;;
  esac
}

run_tests() {
  if [ "$SKIP_TESTS" = true ]; then
    log "Skipping tests"
    return
  fi
  log "Running quick smoke tests"
  # Prefer repository-level tests if present (fast)
  if [ -f "$ROOT_DIR/web-backend/requirements.txt" ]; then
    if command -v python3 >/dev/null 2>&1; then
      if [ "$DRY_RUN" = true ]; then
        echo "DRY-RUN: python3 -m pytest -q";
      else
        (cd "$ROOT_DIR/web-backend" && python3 -m pytest -q || warn "backend tests failed")
      fi
    fi
  fi
}

deploy_docker_compose() {
  log "Using unified docker-compose in deployment/docker/docker-compose.unified.yml"
  COMPOSE_FILE="$ROOT_DIR/deployment/docker/docker-compose.unified.yml"
  if [ ! -f "$COMPOSE_FILE" ]; then
    err "Compose file not found: $COMPOSE_FILE"; return 1
  fi
  run_or_echo "docker-compose -f '$COMPOSE_FILE' up -d --build"
}

deploy_cloudflare() {
  SCRIPT="$ROOT_DIR/deployment/scripts/deploy-cloudflare.sh"
  if [ ! -x "$SCRIPT" ]; then
    warn "Cloudflare deploy script missing/executable: $SCRIPT"
  fi
  run_or_echo "$SCRIPT -e $ENV"
}

deploy_cloudron() {
  SCRIPT="$ROOT_DIR/deployment/scripts/deploy-cloudron.sh"
  if [ ! -x "$SCRIPT" ]; then
    warn "Cloudron deploy script missing/executable: $SCRIPT"
  fi
  run_or_echo "$SCRIPT"
}

deploy_local() {
  # Use local-deploy.sh if available
  SCRIPT="$ROOT_DIR/deployment/local-deploy.sh"
  if [ -x "$SCRIPT" ]; then
    run_or_echo "$SCRIPT"
  else
    warn "Local deploy script not found; falling back to docker-compose"
    deploy_docker_compose
  fi
}

main() {
  parse_args "$@"
  check_prereqs
  run_tests

  case "$TARGET" in
    docker-compose)
      confirm "Proceed to deploy via docker-compose?" || { log "Cancelled"; exit 0; }
      deploy_docker_compose
      ;;
    cloudflare)
      confirm "Proceed to deploy to Cloudflare?" || { log "Cancelled"; exit 0; }
      deploy_cloudflare
      ;;
    cloudron)
      confirm "Proceed to deploy to Cloudron?" || { log "Cancelled"; exit 0; }
      deploy_cloudron
      ;;
    local)
      confirm "Proceed to local deployment?" || { log "Cancelled"; exit 0; }
      deploy_local
      ;;
    build)
      log "Running build steps for all components"
      run_or_echo "(cd '$ROOT_DIR/web-frontend' && npm install && npm run build)"
      run_or_echo "(cd '$ROOT_DIR/web-backend' && pip install -r requirements.txt)"
      ;;
    *)
      err "Unknown target: $TARGET"; usage; exit 2 ;;
  esac

  log "Unified deploy finished"
}

main "$@"
