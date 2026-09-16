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

# 1. Install prerequisites (Nginx, Node, PM2, PostgreSQL)
echo "Installing prerequisites..."
apt update
apt install -y curl nginx postgresql postgresql-contrib
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 2. Setup Database
echo "Setting up PostgreSQL Database..."
DB_USER="greenpark_user"
DB_PASS="greenpark1234" # Hardcoded password per user request
DB_NAME="greenpark_inventory"

# Run postgres commands as the postgres user to create db and user
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" || true

# 3. Setup Backend
echo "Setting up backend..."
cd $PROJECT_DIR/backend
npm install

# Setup env vars for backend
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public\"" > .env
echo "PORT=$PORT" >> .env
echo "JWT_SECRET=\"$(openssl rand -hex 32)\"" >> .env

# Generate Prisma Client and Push Schema to Database
npx prisma generate
npx prisma db push

npm run build

# Start or Restart PM2 backend process on port 33233
pm2 stop greenpark-backend || true
pm2 delete greenpark-backend || true
pm2 start dist/index.js --name "greenpark-backend"
pm2 save
pm2 startup | tail -n 1 | bash || true

# 4. Setup Frontend
echo "Setting up frontend..."
cd $PROJECT_DIR
# Use relative /api path so it routes through Nginx proxy
echo "REACT_APP_API_URL=/api" > .env.production
npm install
npm run build

# 5. Configure Nginx
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
echo "Database '$DB_NAME' created successfully"
echo "Frontend is built and served via Nginx"
echo "Site should now be accessible at http://$DOMAIN"
echo ""
echo "Note: If you haven't pointed your DNS A-Record to this server's IP, please do so."
echo "Once DNS is pointed, you can secure it with SSL by running:"
echo "sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d $DOMAIN"
echo "================================================================="
