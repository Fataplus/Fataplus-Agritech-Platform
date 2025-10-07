# Unified deployment for Fataplus-Agritech-Platform

This document explains the new `unified-deploy.sh` script added to `deployment/` and how it centralizes the repo's deployment workflows.

What it does
- Single entrypoint to build, test and deploy the platform.
- Delegates to existing scripts where appropriate (Cloudflare, Cloudron, local, docker-compose).
- Supports dry-run, environment selection, skipping tests, and forcing operations.

Location
- Script: `deployment/unified-deploy.sh`

Usage (examples)
- Dry-run a compose deploy for staging:
  - `deployment/unified-deploy.sh -t docker-compose -e staging -n`
- Deploy to Cloudflare (prompt will ask to continue):
  - `deployment/unified-deploy.sh -t cloudflare -e production`
- Local development deploy (uses `local-deploy.sh` if present):
  - `deployment/unified-deploy.sh -t local -e development`

Notes and design decisions
- The script is intentionally conservative: it checks prerequisites and warns if CLIs are missing.
- It aims to reuse existing specialized scripts in `deployment/scripts/` to minimize duplication.
- Dry-run mode prints the commands instead of executing them so CI can validate the plan.

Next steps (recommendations)
1. Add a small integration test that runs the script in dry-run mode in CI (e.g., GitHub Actions) to ensure changes to components don't break deploy flow.
2. Add `--non-interactive` or `--yes` and richer flags for each target to support full automation in CI/CD.
3. Replace direct calls to script files with small wrapper functions that normalize environment variables and logging for consistency.
