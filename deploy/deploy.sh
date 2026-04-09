#!/bin/bash
# ============================================================
# Nexmine - 배포 스크립트
# Windows(Git Bash/WSL)에서 실행하여 OCI VM으로 배포
#
# 사용법:
#   ./deploy/deploy.sh <서버IP> [SSH키경로]
#
# 예시:
#   ./deploy/deploy.sh 129.154.xxx.xxx ~/.ssh/oci_key
#   ./deploy/deploy.sh 129.154.xxx.xxx "C:/Users/km/SSH KEY/ssh-key.key"
# ============================================================
set -euo pipefail

# 매개변수
SERVER_IP="${1:?사용법: ./deploy/deploy.sh <서버IP> [SSH키경로]}"
SSH_KEY="${2:-~/.ssh/id_rsa}"
SSH_USER="${3:-ubuntu}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=no)

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

echo "=== Nexmine 배포 시작 ==="
echo "서버: $SSH_USER@$SERVER_IP"
echo ""

# -------------------------------------------------------
# 1. 백엔드 빌드 (로컬에서 Linux x64용으로 publish)
# -------------------------------------------------------
echo "[1/5] 백엔드 빌드 (linux-x64)..."
cd "$BACKEND_DIR"
dotnet publish src/Nexmine.Api/Nexmine.Api.csproj \
    -c Release \
    -r linux-x64 \
    --self-contained false \
    -o "$DEPLOY_DIR/publish/backend"

echo "백엔드 빌드 완료"

# -------------------------------------------------------
# 2. 프론트엔드 빌드
# -------------------------------------------------------
echo "[2/5] 프론트엔드 빌드..."
cd "$FRONTEND_DIR"
npm run build

echo "프론트엔드 빌드 완료"

# -------------------------------------------------------
# 3. 파일 전송
# -------------------------------------------------------
echo "[3/5] 서버로 파일 전송..."

# 백엔드 파일 압축
cd "$DEPLOY_DIR/publish"
tar czf backend.tar.gz -C backend .

# 프론트엔드 빌드 결과 압축
tar czf frontend.tar.gz -C "$FRONTEND_DIR/dist" .

# SCP로 전송
scp "${SSH_OPTS[@]}" backend.tar.gz "$SSH_USER@$SERVER_IP:/tmp/"
scp "${SSH_OPTS[@]}" frontend.tar.gz "$SSH_USER@$SERVER_IP:/tmp/"
scp "${SSH_OPTS[@]}" "$DEPLOY_DIR/nexmine.conf" "$SSH_USER@$SERVER_IP:/tmp/"
scp "${SSH_OPTS[@]}" "$DEPLOY_DIR/nexmine.service" "$SSH_USER@$SERVER_IP:/tmp/"

echo "파일 전송 완료"

# -------------------------------------------------------
# 4. 서버에서 배포
# -------------------------------------------------------
echo "[4/5] 서버에서 배포 실행..."

ssh "${SSH_OPTS[@]}" "$SSH_USER@$SERVER_IP" bash -s << 'REMOTE_SCRIPT'
set -euo pipefail

# nexmine 사용자 생성 (없으면)
if ! id nexmine &>/dev/null; then
    sudo useradd -r -s /sbin/nologin -d /opt/nexmine nexmine
fi

# 서비스 중지
sudo systemctl stop nexmine 2>/dev/null || true

# 디렉터리 생성
sudo mkdir -p /opt/nexmine/{backend,frontend,data,uploads}

# 백엔드 배포
sudo rm -rf /opt/nexmine/backend/*
sudo tar xzf /tmp/backend.tar.gz -C /opt/nexmine/backend/

# 프론트엔드 배포
sudo rm -rf /opt/nexmine/frontend/*
sudo tar xzf /tmp/frontend.tar.gz -C /opt/nexmine/frontend/

# 권한 설정
sudo chown -R nexmine:nexmine /opt/nexmine

# Nginx 설정 (기존 사이트 건드리지 않음, nexmine 설정만 추가)
sudo cp /tmp/nexmine.conf /etc/nginx/conf.d/nexmine.conf

# systemd 서비스 설정
sudo cp /tmp/nexmine.service /etc/systemd/system/nexmine.service
sudo systemctl daemon-reload
sudo systemctl enable nexmine

# 임시 파일 정리
rm -f /tmp/backend.tar.gz /tmp/frontend.tar.gz /tmp/nexmine.conf /tmp/nexmine.service

# iptables 포트 개방 (9090, REJECT 규칙 앞에 삽입)
if ! sudo iptables -C INPUT -p tcp --dport 9090 -j ACCEPT 2>/dev/null; then
    # REJECT 규칙 번호 찾아서 그 앞에 삽입
    REJECT_LINE=$(sudo iptables -L INPUT --line-numbers -n | grep REJECT | head -1 | awk '{print $1}')
    if [ -n "$REJECT_LINE" ]; then
        sudo iptables -I INPUT "$REJECT_LINE" -p tcp --dport 9090 -j ACCEPT
    else
        sudo iptables -A INPUT -p tcp --dport 9090 -j ACCEPT
    fi
    # 영구 저장
    sudo sh -c 'iptables-save > /etc/iptables/rules.v4' 2>/dev/null || \
    sudo sh -c 'iptables-save > /etc/iptables.rules' 2>/dev/null || true
    echo "iptables: 포트 9090 개방 완료"
fi

# 서비스 시작
sudo systemctl start nexmine
sudo systemctl reload nginx

echo ""
echo "=== 서비스 상태 확인 ==="
sudo systemctl status nexmine --no-pager -l || true
sudo systemctl status nginx --no-pager -l || true
REMOTE_SCRIPT

# -------------------------------------------------------
# 5. 로컬 정리
# -------------------------------------------------------
echo "[5/5] 로컬 빌드 파일 정리..."
rm -rf "$DEPLOY_DIR/publish"

echo ""
echo "=== 배포 완료 ==="
echo "접속: http://$SERVER_IP:9090"
echo ""
echo "유용한 명령어:"
echo "  ssh -i \"$SSH_KEY\" $SSH_USER@$SERVER_IP"
echo "  sudo journalctl -u nexmine -f         # 백엔드 로그"
echo "  sudo systemctl restart nexmine         # 백엔드 재시작"
echo "  sudo systemctl restart nginx           # Nginx 재시작"
