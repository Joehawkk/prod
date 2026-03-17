#!/usr/bin/env bash
# Deploy frontend build to VM (Python backend server).
# Usage: ./deploy-to-vm.sh [SSH_KEY_PATH]
# Example: ./deploy-to-vm.sh ../virtual-machine.pem
# Or: SSH_KEY_PATH=~/.ssh/my.pem ./deploy-to-vm.sh

set -e
VM_USER="${VM_USER:-ubuntu}"
VM_HOST="${VM_HOST:-158.160.19.182}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/t-match-frontend}"

SSH_KEY="${1:-$SSH_KEY_PATH}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
[[ -n "$SSH_KEY" && -f "$SSH_KEY" ]] && SSH_OPTS+=(-i "$SSH_KEY")

echo "Build frontend..."
npm run build

echo "Deploy dist/ to ${VM_USER}@${VM_HOST}:${REMOTE_DIR}..."
rsync -avz --delete -e "ssh ${SSH_OPTS[*]}" dist/ "${VM_USER}@${VM_HOST}:${REMOTE_DIR}/"

echo "Done. Ensure the VM serves ${REMOTE_DIR} (e.g. nginx root or Python static)."
