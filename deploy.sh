#!/bin/bash
set -e

# ========== 配置 ==========
VPS_HOST="47.79.146.102"
VPS_USER="root"
SSH_KEY="/Users/mik/.ssh/id_ed25519"
IMAGE_NAME="mikblog"
CONTAINER_NAME="mikblog"
CONTAINER_PORT=3000

SSH_CMD="ssh -i $SSH_KEY $VPS_USER@$VPS_HOST"

echo "🔨 本地构建 Docker 镜像 (linux/amd64)..."
docker build --platform linux/amd64 -t $IMAGE_NAME:latest .

echo "📦 导出并传输镜像到 VPS..."
docker save $IMAGE_NAME:latest | $SSH_CMD "docker load"

echo "🚀 启动容器（端口 3000，仅本地访问）..."
$SSH_CMD << 'EOF'
  docker stop mikblog 2>/dev/null || true
  docker rm mikblog 2>/dev/null || true
  docker run -d \
    --name mikblog \
    -p 127.0.0.1:3000:3000 \
    --restart unless-stopped \
    mikblog:latest
EOF

echo "⚙️ 配置 Nginx 反向代理..."
$SSH_CMD << 'EOF'
  # 创建 Nginx 配置
  cat > /etc/nginx/sites-available/mikblog << 'NGINX'
server {
    listen 80;
    server_name www.miklog.space miklog.space;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

  # 启用站点
  ln -sf /etc/nginx/sites-available/mikblog /etc/nginx/sites-enabled/
  
  # 测试并重载 Nginx
  nginx -t && systemctl reload nginx
EOF

echo ""
echo "✅ 部署完成！"
echo "   访问: http://www.miklog.space"
echo "   Hysteria2 代理保持不变（443/UDP）"
