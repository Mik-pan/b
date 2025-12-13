#!/bin/bash
set -euo pipefail

# ========== 配置 ==========
VPS_HOST="47.79.146.102"
VPS_USER="root"
SSH_KEY="/Users/mik/.ssh/id_ed25519"
IMAGE_NAME="mikblog"
CONTAINER_NAME="mikblog"
CONTAINER_PORT=3000
DOMAIN_ROOT="miklog.space"
DOMAIN_WWW="www.miklog.space"
# 推荐填写邮箱用于证书到期提醒；留空则使用 --register-unsafely-without-email
LE_EMAIL=""

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
$SSH_CMD << EOF
  set -euo pipefail

  DOMAIN_ROOT="${DOMAIN_ROOT}"
  DOMAIN_WWW="${DOMAIN_WWW}"
  LE_EMAIL="${LE_EMAIL}"
  CONTAINER_PORT="${CONTAINER_PORT}"

  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y nginx certbot
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache nginx certbot
  else
    echo "Unsupported OS: please install nginx + certbot manually." >&2
    exit 1
  fi

  if command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now nginx || true
  else
    nginx || true
  fi

  # 443/TCP 需要给 Nginx 做 HTTPS；Hy2 常见是 443/UDP，不冲突。
  if command -v ss >/dev/null 2>&1; then
    if ss -ltnp 2>/dev/null | grep -qE 'LISTEN\\s+.*:443\\s'; then
      if ! ss -ltnp 2>/dev/null | grep -qE 'LISTEN\\s+.*:443\\s+.*nginx'; then
        echo "Error: 443/TCP is already in use by a non-nginx process; cannot enable HTTPS on nginx." >&2
        ss -ltnp 2>/dev/null | grep -E 'LISTEN\\s+.*:443\\s' || true
        exit 1
      fi
    fi
  fi

  mkdir -p /var/www/letsencrypt

  # 先写入仅 80 的配置，用于 ACME HTTP-01 校验
  if [ -d /etc/nginx/sites-available ] && [ -d /etc/nginx/sites-enabled ]; then
    NGINX_CONF="/etc/nginx/sites-available/${CONTAINER_NAME}"
    ln -sf "\${NGINX_CONF}" "/etc/nginx/sites-enabled/${CONTAINER_NAME}"
  else
    NGINX_CONF="/etc/nginx/conf.d/${CONTAINER_NAME}.conf"
  fi

  cat > "\${NGINX_CONF}" << 'NGINX_HTTP'
server {
    listen 80;
    server_name DOMAIN_ROOT DOMAIN_WWW;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
NGINX_HTTP
  sed -i "s/DOMAIN_ROOT/\${DOMAIN_ROOT}/g; s/DOMAIN_WWW/\${DOMAIN_WWW}/g" "\${NGINX_CONF}"

  nginx -t
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx
  else
    nginx -s reload
  fi

  CERTBOT_ARGS=(certonly --webroot -w /var/www/letsencrypt -d "\${DOMAIN_ROOT}" -d "\${DOMAIN_WWW}" --agree-tos --non-interactive --keep-until-expiring)
  if [ -n "\${LE_EMAIL}" ]; then
    CERTBOT_ARGS+=( -m "\${LE_EMAIL}" )
  else
    CERTBOT_ARGS+=( --register-unsafely-without-email )
  fi

  certbot "\${CERTBOT_ARGS[@]}"

  # 写入 443 反代（443/TCP），并保留 80->443 跳转
  cat > "\${NGINX_CONF}" << 'NGINX_HTTPS'
server {
    listen 80;
    server_name DOMAIN_ROOT DOMAIN_WWW;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_ROOT DOMAIN_WWW;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_ROOT/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_ROOT/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:CONTAINER_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
NGINX_HTTPS
  sed -i "s/DOMAIN_ROOT/\${DOMAIN_ROOT}/g; s/DOMAIN_WWW/\${DOMAIN_WWW}/g; s/CONTAINER_PORT/\${CONTAINER_PORT}/g" "\${NGINX_CONF}"

  nginx -t
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx
    systemctl enable --now certbot.timer >/dev/null 2>&1 || true
  else
    nginx -s reload
  fi
EOF

echo ""
echo "✅ 部署完成！"
echo "   访问: https://${DOMAIN_WWW}"
echo "   说明: 本脚本使用 443/TCP 给 Nginx 提供 HTTPS；Hy2 常见使用 443/UDP，不冲突。"
