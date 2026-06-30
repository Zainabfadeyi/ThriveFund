#!/usr/bin/env bash
# EC2 bootstrap script — run once on a fresh Ubuntu 22.04 instance
# Usage: bash ec2-setup.sh
set -euo pipefail

echo "==> Updating system packages"
sudo apt-get update -y && sudo apt-get upgrade -y

# ── Node.js 20 via NodeSource ──────────────────────────────────────────────
echo "==> Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Node: $(node -v) | npm: $(npm -v)"

# ── PM2 (process manager) ──────────────────────────────────────────────────
echo "==> Installing PM2"
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash

# ── Nginx (reverse proxy) ──────────────────────────────────────────────────
echo "==> Installing Nginx"
sudo apt-get install -y nginx

# ── Git ────────────────────────────────────────────────────────────────────
echo "==> Installing Git"
sudo apt-get install -y git

# ── Clone repo ─────────────────────────────────────────────────────────────
echo "==> Cloning ThriveFund repository"
cd /home/ubuntu
git clone https://github.com/YOUR_GITHUB_USERNAME/ThriveFund.git
cd ThriveFund/backend

# ── Create .env from template ──────────────────────────────────────────────
echo "==> Writing .env (edit this file with real values!)"
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3002

# Database (AWS RDS)
DB_HOST=thrivefund-db.c4hs6um4wrpt.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASS="Zain_1234$"
DB_NAME=thrivefund

# JWT
JWT_SECRET=CHANGE_ME_32_CHARS_MIN
JWT_REFRESH_SECRET=CHANGE_ME_32_CHARS_MIN
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS — set to your frontend domain in production
CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN

# Brevo
BREVO_API_KEY=
BREVO_SENDER_NAME=ThriveFund
BREVO_SENDER_EMAIL=thryvenode@gmail.com

FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN

# Nomba
NOMBA_BASE_URL=https://api.nomba.com
NOMBA_API_KEY=
NOMBA_ACCOUNT_ID=
NOMBA_WEBHOOK_SECRET=
ENVEOF

echo "==> Installing backend dependencies and building"
npm ci --include=dev
npm run build

# ── Create log directory ────────────────────────────────────────────────────
mkdir -p /home/ubuntu/logs

# ── Start with PM2 ─────────────────────────────────────────────────────────
echo "==> Starting app with PM2"
pm2 start ecosystem.config.js --env production
pm2 save

# ── Nginx config ───────────────────────────────────────────────────────────
echo "==> Configuring Nginx"
sudo cp /home/ubuntu/ThriveFund/backend/scripts/nginx.conf /etc/nginx/sites-available/thrivefund
sudo ln -sf /etc/nginx/sites-available/thrivefund /etc/nginx/sites-enabled/thrivefund
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "========================================="
echo " Setup complete!"
echo " App running on port 3002 (via PM2)"
echo " Nginx proxying port 80 → 3002"
echo ""
echo " NEXT STEPS:"
echo " 1. Edit /home/ubuntu/ThriveFund/backend/.env with real secrets"
echo " 2. Point your domain DNS to this EC2 IP"
echo " 3. Run: sudo certbot --nginx (for HTTPS)"
echo " 4. In GitHub: add EC2_HOST, EC2_USERNAME, EC2_SSH_KEY secrets"
echo "========================================="
