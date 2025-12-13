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
$SSH_CMD "CONTAINER_NAME='${CONTAINER_NAME}' IMAGE_NAME='${IMAGE_NAME}' CONTAINER_PORT='${CONTAINER_PORT}' bash -s" << 'EOF'
set -euo pipefail

DATA_DIR="/var/lib/${CONTAINER_NAME}"
mkdir -p "${DATA_DIR}"

docker stop "${CONTAINER_NAME}" 2>/dev/null || true
docker rm "${CONTAINER_NAME}" 2>/dev/null || true
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 127.0.0.1:${CONTAINER_PORT}:3000 \
  -v "${DATA_DIR}:/data" \
  -e DATABASE_URL="file:/data/dev.db" \
  --restart unless-stopped \
  "${IMAGE_NAME}:latest"
EOF

echo "⚙️ 配置 Nginx 反向代理..."
$SSH_CMD "CONTAINER_NAME='${CONTAINER_NAME}' DOMAIN_ROOT='${DOMAIN_ROOT}' DOMAIN_WWW='${DOMAIN_WWW}' LE_EMAIL='${LE_EMAIL}' CONTAINER_PORT='${CONTAINER_PORT}' bash -s" << 'EOF'
set -euo pipefail

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

  # 443/TCP 必须留给 Nginx 做 HTTPS；Hy2 常见使用 443/UDP，不冲突。
  if command -v ss >/dev/null 2>&1; then
    if ss -ltnp 2>/dev/null | grep -qE '[:.]443[[:space:]]'; then
      if ! ss -ltnp 2>/dev/null | grep -qE '[:.]443[[:space:]].*nginx'; then
        echo "Error: 443/TCP is already in use by a non-nginx process; cannot enable HTTPS on nginx." >&2
        ss -ltnp 2>/dev/null | grep -E '[:.]443[[:space:]]' || true
        exit 1
      fi
    fi
  fi

mkdir -p /var/www/letsencrypt

if [ -d /etc/nginx/sites-available ] && [ -d /etc/nginx/sites-enabled ]; then
  NGINX_CONF="/etc/nginx/sites-available/${CONTAINER_NAME}"
  ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${CONTAINER_NAME}"
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
else
  NGINX_CONF="/etc/nginx/conf.d/${CONTAINER_NAME}.conf"
fi

# 先写 80 配置用于签发证书
cat > "${NGINX_CONF}" << NGINX_HTTP
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_ROOT} ${DOMAIN_WWW};

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/letsencrypt;
    default_type "text/plain";
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}
NGINX_HTTP

nginx -t
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  nginx -s reload
fi

CERTBOT_ARGS=(certonly --webroot -w /var/www/letsencrypt -d "${DOMAIN_ROOT}" -d "${DOMAIN_WWW}" --agree-tos --non-interactive --keep-until-expiring)
if [ -n "${LE_EMAIL}" ]; then
  CERTBOT_ARGS+=( -m "${LE_EMAIL}" )
else
  CERTBOT_ARGS+=( --register-unsafely-without-email )
fi
certbot "${CERTBOT_ARGS[@]}"

# 写 443 反代 + 80 跳转
cat > "${NGINX_CONF}" << NGINX_HTTPS
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_ROOT} ${DOMAIN_WWW};

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/letsencrypt;
    default_type "text/plain";
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_ROOT} ${DOMAIN_WWW};

  ssl_certificate /etc/letsencrypt/live/${DOMAIN_ROOT}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_ROOT}/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;

  location / {
    proxy_pass http://127.0.0.1:${CONTAINER_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
NGINX_HTTPS

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
