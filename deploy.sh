#!/bin/bash
set -e

# 1. 버전 번호 생성 (예: v1.x_날짜_시간)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION="v1.0_${TIMESTAMP}"

# 2. 백업 디렉토리 생성
BACKUP_DIR="backups/$VERSION"
mkdir -p "$BACKUP_DIR"

# 3. 핵심 파일 백업
echo "📦 백업 생성 중... ($VERSION)"
cp public/index.html "$BACKUP_DIR/"
cp server.js "$BACKUP_DIR/"
echo "✅ 백업 완료: $BACKUP_DIR"

# 4. Git 커밋 및 푸시
echo "🚀 GitHub에 업로드 중..."
git add -A
git commit -m "deploy: automatic backup and deploy $VERSION" || echo "변경된 파일이 없습니다."
git push origin main

# 5. 오라클 서버 배포 및 재시작
echo "🌐 오라클 클라우드 서버 자동 배포 진행 중..."
ssh -o StrictHostKeyChecking=no -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 "cd /home/ubuntu/stocklens && git fetch --all && git reset --hard origin/main && pm2 restart stocklens"

echo "🎉 자동 배포 완료!"
