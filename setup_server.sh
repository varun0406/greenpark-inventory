#!/bin/bash

# ==============================================================================
# Greenpark Inventory - Ubuntu Server Setup Script
# Domain: greenpark.rovark.in
# Backend Port: 33233
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run this script as root or using sudo."
  exit 1
fi

DOMAIN="greenpark.rovark.in"
PORT=33233
PROJECT_DIR=$(pwd)

echo "Starting deployment setup for $DOMAIN..."

# 1. Install prerequisites (Nginx, Node, PM2)
echo "Installing prerequisites..."
apt update
apt install -y curl nginx
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 2. Setup Backend
echo "Setting up backend..."
cd $PROJECT_DIR/backend
npm install
npx prisma generate
npm run build

# Start or Restart PM2 backend process on port 33233
pm2 stop greenpark-backend || true
pm2 delete greenpark-backend || true
PORT=$PORT pm2 start dist/index.js --name "greenpark-backend"
pm2 save
pm2 startup | tail -n 1 | bash || true

# 3. Setup Frontend
echo "Setting up frontend..."
cd $PROJECT_DIR
# Use relative /api path so it routes through Nginx proxy
echo "REACT_APP_API_URL=/api" > .env.production
npm install
npm run build

# 4. Configure Nginx
echo "Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/greenpark"

cat > $NGINX_CONF <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Static Frontend
    root $PROJECT_DIR/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy to Node.js Backend
    location /api/ {
        proxy_pass http://localhost:$PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
# Remove default nginx config to prevent conflicts if needed
rm -f /etc/nginx/sites-enabled/default

# Test Nginx and Restart
nginx -t
systemctl restart nginx

echo "================================================================="
echo "Deployment Complete!"
echo "Backend is running on port $PORT via PM2"
echo "Frontend is built and served via Nginx"
echo "Site should now be accessible at http://$DOMAIN"
echo ""
echo "Note: If you haven't pointed your DNS A-Record to this server's IP, please do so."
echo "Once DNS is pointed, you can secure it with SSL by running:"
echo "sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d $DOMAIN"
echo "================================================================="
