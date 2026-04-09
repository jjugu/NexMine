#!/bin/bash
# ============================================================
# Nexmine - Oracle Cloud VM 초기 설정 스크립트
# 대상: Ubuntu 22.04 (VM.Standard.E2.1.Micro)
# 이미 .NET 9, Nginx, Swap이 설치된 서버 기준
# 한 번만 실행하면 됩니다.
# ============================================================
set -euo pipefail

echo "=== Nexmine 서버 초기 설정 시작 ==="

# 1. 사전 조건 확인
echo "[1/3] 사전 조건 확인..."
echo -n "  .NET: "; dotnet --list-runtimes 2>/dev/null | grep -c "9.0" && echo " (OK)" || { echo "미설치! sudo apt install -y aspnetcore-runtime-9.0"; exit 1; }
echo -n "  Nginx: "; nginx -v 2>&1 && echo " (OK)" || { echo "미설치! sudo apt install -y nginx"; exit 1; }
echo -n "  Swap: "; swapon --show | grep -q swap && echo "OK" || echo "없음 (권장: sudo fallocate -l 1G /swapfile)"

# 2. 앱 디렉터리 생성
echo "[2/3] 앱 디렉터리 생성..."
sudo mkdir -p /opt/nexmine/{backend,frontend,data,uploads}
sudo chown -R $USER:$USER /opt/nexmine

# 3. 방화벽 (iptables) - 포트 9090
echo "[3/3] iptables 포트 9090 개방..."
if ! sudo iptables -C INPUT -p tcp --dport 9090 -j ACCEPT 2>/dev/null; then
    REJECT_LINE=$(sudo iptables -L INPUT --line-numbers -n | grep REJECT | head -1 | awk '{print $1}')
    if [ -n "$REJECT_LINE" ]; then
        sudo iptables -I INPUT "$REJECT_LINE" -p tcp --dport 9090 -j ACCEPT
    else
        sudo iptables -A INPUT -p tcp --dport 9090 -j ACCEPT
    fi
    sudo sh -c 'iptables-save > /etc/iptables/rules.v4' 2>/dev/null || \
    sudo sh -c 'iptables-save > /etc/iptables.rules' 2>/dev/null || true
    echo "포트 9090 개방 완료"
else
    echo "포트 9090 이미 개방됨"
fi

echo ""
echo "=== 초기 설정 완료 ==="
echo ""
echo "다음 단계:"
echo "  1. OCI 콘솔 → Networking → Security Lists에서 TCP 9090 인바운드 규칙 추가"
echo "  2. appsettings.Production.json에서 JWT Secret과 CORS Origins 수정"
echo "  3. deploy.sh 실행하여 앱 배포"
