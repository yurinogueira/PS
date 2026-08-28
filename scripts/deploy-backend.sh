#!/usr/bin/env bash
set -euo pipefail

# Uso: ./scripts/deploy-backend.sh <IP_OU_HOST_OCI> [USUARIO_SSH (default: ubuntu)] [CAMINHO_SSH_KEY]
HOST="${1:-}"
USER="${2:-ubuntu}"
KEY="${3:-}"

if [ -z "$HOST" ]; then
    echo "Uso: $0 <IP_OU_HOST_OCI> [USUARIO_SSH] [CHAVE_SSH]"
    echo "Exemplo: $0 129.148.xx.xx ubuntu ~/.ssh/id_rsa"
    exit 1
fi

SSH_OPTS=()
if [ -n "$KEY" ]; then
    SSH_OPTS+=("-i" "$KEY")
fi

echo "==> 1. Compilando binário Go otimizado para linux/amd64..."
cd "$(dirname "$0")/../backend"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -trimpath -o ../dist/ps-api ./cmd/api

cd ..

echo "==> 2. Enviando binário e arquivos de configuração para $USER@$HOST..."
ssh "${SSH_OPTS[@]}" "$USER@$HOST" "mkdir -p /tmp/ps-deploy"
scp "${SSH_OPTS[@]}" dist/ps-api "$USER@$HOST:/tmp/ps-deploy/"
scp "${SSH_OPTS[@]}" deploy/systemd/ps-backend.service "$USER@$HOST:/tmp/ps-deploy/"
scp "${SSH_OPTS[@]}" deploy/caddy/Caddyfile "$USER@$HOST:/tmp/ps-deploy/"

echo "==> 3. Atualizando aplicação e serviços na instância OCI..."
ssh "${SSH_OPTS[@]}" "$USER@$HOST" << 'EOF'
set -euo pipefail

# Instalar binário
sudo install -m 755 -o ps -g ps /tmp/ps-deploy/ps-api /opt/ps/ps-api

# Atualizar Caddyfile e recarregar Caddy
if [ -f /tmp/ps-deploy/Caddyfile ]; then
    sudo cp /tmp/ps-deploy/Caddyfile /etc/caddy/Caddyfile
    sudo systemctl reload caddy || sudo systemctl restart caddy
fi

# Atualizar serviço Systemd
if [ -f /tmp/ps-deploy/ps-backend.service ]; then
    sudo cp /tmp/ps-deploy/ps-backend.service /etc/systemd/system/ps-backend.service
    sudo systemctl daemon-reload
fi

# Reiniciar serviço do Backend Go
sudo systemctl restart ps-backend
sudo systemctl status ps-backend --no-pager

# Limpar temporários
rm -rf /tmp/ps-deploy
EOF

echo "==> Deploy concluído com sucesso!"
