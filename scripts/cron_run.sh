#!/usr/bin/env bash
# Cron-wrapper for produkt-bilde automasjon på kosttest.no
set -euo pipefail

cd "$(dirname "$0")/.."

LOG_DIR="data/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M).log"

echo "=== Kosttest bilde-automasjon $(date -Iseconds) ===" | tee "$LOG_FILE"

# Behandle maks 10 produkter per kjøring for å unngå rate limiting
python3 run_automation.py --limit 10 2>&1 | tee -a "$LOG_FILE"

echo "=== Ferdig $(date -Iseconds) ===" | tee -a "$LOG_FILE"
