# Production Deployment Guide

Complete guide to deploying the Web Game backend to a self-hosted VPS.

## Overview

This guide covers deploying to an Ubuntu 22.04 VPS with:
- PostgreSQL 15
- Nginx as reverse proxy
- Gunicorn + Uvicorn workers
- Systemd for process management
- SSL/TLS with Let's Encrypt
- Automated backups

## Prerequisites

- Ubuntu 22.04 VPS (2GB RAM minimum, 4GB recommended)
- Root or sudo access
- Domain name pointing to your VPS
- Basic Linux command-line knowledge

## Step 1: Initial Server Setup

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Create Application User

```bash
sudo adduser webgame
sudo usermod -aG sudo webgame
```

### 1.3 Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 1.4 Set Up SSH Keys (Recommended)

```bash
# On your local machine
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to server
ssh-copy-id webgame@your-server-ip
```

## Step 2: Install Dependencies

### 2.1 Install Python 3.11

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
```

### 2.2 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.3 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.4 Install Git

```bash
sudo apt install -y git
```

## Step 3: Configure PostgreSQL

### 3.1 Create Database and User

```bash
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE web_game;
CREATE USER web_game_user WITH ENCRYPTED PASSWORD 'your-secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE web_game TO web_game_user;
\q
```

### 3.2 Configure PostgreSQL for Local Access

Edit `/etc/postgresql/15/main/pg_hba.conf`:

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Add this line (if not already present):

```
local   web_game    web_game_user                   md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 3.3 Test Connection

```bash
psql -U web_game_user -d web_game -h localhost
# Enter password when prompted
# Type \q to exit
```

## Step 4: Deploy Application Code

### 4.1 Clone Repository

```bash
cd /home/webgame
git clone <your-repo-url> web_game
cd web_game/backend
```

### 4.2 Create Virtual Environment

```bash
python3.11 -m venv venv
source venv/bin/activate
```

### 4.3 Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 4.4 Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Update with production values:

```env
DATABASE_URL=postgresql://web_game_user:your-secure-password@localhost:5432/web_game
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
HOST=0.0.0.0
PORT=8000
RELOAD=False
WORKERS=4
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com
```

Generate SECRET_KEY:

```bash
openssl rand -hex 32
```

### 4.5 Run Database Migrations

```bash
source venv/bin/activate
alembic upgrade head
```

### 4.6 Test Application

```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Test in another terminal:

```bash
curl http://localhost:8000/health
```

If working, stop with Ctrl+C.

## Step 5: Configure Systemd Service

### 5.1 Create Service File

```bash
sudo nano /etc/systemd/system/webgame.service
```

Add this configuration:

```ini
[Unit]
Description=Web Game API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=notify
User=webgame
Group=webgame
WorkingDirectory=/home/webgame/web_game/backend
Environment="PATH=/home/webgame/web_game/backend/venv/bin"
ExecStart=/home/webgame/web_game/backend/venv/bin/gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile /var/log/webgame/access.log \
    --error-logfile /var/log/webgame/error.log \
    --log-level info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5.2 Create Log Directory

```bash
sudo mkdir -p /var/log/webgame
sudo chown webgame:webgame /var/log/webgame
```

### 5.3 Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable webgame
sudo systemctl start webgame
sudo systemctl status webgame
```

### 5.4 Check Logs

```bash
sudo journalctl -u webgame -f
```

## Step 6: Configure Nginx Reverse Proxy

### 6.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/webgame
```

Add this configuration:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API Proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket Proxy
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health Check
    location /health {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }

    # Docs
    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Frontend (static files)
    location / {
        root /home/webgame/web_game/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/webgame /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: SSL/TLS with Let's Encrypt

### 7.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtain Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts:
- Enter email address
- Agree to Terms of Service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 7.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Certificates will auto-renew via systemd timer.

## Step 8: Database Backups

### 8.1 Create Backup Script

```bash
sudo nano /usr/local/bin/backup-webgame-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/webgame/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="web_game_backup_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U web_game_user -h localhost web_game | gzip > "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "web_game_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/backup-webgame-db.sh
```

### 8.2 Create .pgpass for Automated Backups

```bash
nano ~/.pgpass
```

Add:

```
localhost:5432:web_game:web_game_user:your-password
```

Set permissions:

```bash
chmod 600 ~/.pgpass
```

### 8.3 Schedule Daily Backups

```bash
crontab -e
```

Add:

```cron
0 2 * * * /usr/local/bin/backup-webgame-db.sh >> /var/log/webgame/backup.log 2>&1
```

## Step 9: Monitoring & Logging

### 9.1 View Application Logs

```bash
# Follow live logs
sudo journalctl -u webgame -f

# View recent logs
sudo journalctl -u webgame -n 100

# View logs from today
sudo journalctl -u webgame --since today
```

### 9.2 View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 9.3 View Application Logs

```bash
tail -f /var/log/webgame/access.log
tail -f /var/log/webgame/error.log
```

### 9.4 Monitor System Resources

```bash
# Install htop
sudo apt install -y htop

# Monitor
htop
```

## Step 10: Deploy Frontend

### 10.1 Build Frontend

On your local machine:

```bash
cd web_game
# Add Vite build configuration (see frontend setup)
npm install
npm run build
```

### 10.2 Copy to Server

```bash
scp -r dist/ webgame@your-server:/home/webgame/web_game/
```

### 10.3 Set Permissions

```bash
sudo chown -R webgame:webgame /home/webgame/web_game/dist
```

## Maintenance Tasks

### Update Application

```bash
cd /home/webgame/web_game
git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart webgame
```

### Restart Services

```bash
# Restart API
sudo systemctl restart webgame

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### View Service Status

```bash
sudo systemctl status webgame
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Restore Database Backup

```bash
# Stop application
sudo systemctl stop webgame

# Restore from backup
gunzip -c /home/webgame/backups/web_game_backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U web_game_user -h localhost -d web_game

# Start application
sudo systemctl start webgame
```

## Security Hardening

### 1. Configure Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 2. Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config
```

Change:

```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

### 3. Enable Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Rate Limiting in Nginx

Add to Nginx config:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    # API endpoints
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        # ... rest of config
    }

    # Auth endpoints
    location /api/auth {
        limit_req zone=auth_limit burst=5 nodelay;
        # ... rest of config
    }
}
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
sudo journalctl -u webgame -n 50

# Check service status
sudo systemctl status webgame

# Test manually
cd /home/webgame/web_game/backend
source venv/bin/activate
gunicorn app.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U web_game_user -d web_game -h localhost

# Check pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

### WebSocket Connection Fails

- Ensure Nginx WebSocket config is correct
- Check firewall allows port 443
- Verify SSL certificate is valid
- Check browser console for errors

## Performance Tuning

### Increase Gunicorn Workers

Edit `/etc/systemd/system/webgame.service`:

```
# Formula: (2 x CPU cores) + 1
ExecStart=... --workers 9 ...  # For 4 CPU cores
```

### PostgreSQL Tuning

Edit `/etc/postgresql/15/main/postgresql.conf`:

```
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 50-75% of RAM
maintenance_work_mem = 64MB
wal_buffers = 16MB
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Monitoring Setup (Optional)

Consider adding:
- **Sentry** for error tracking
- **Prometheus + Grafana** for metrics
- **Uptime Robot** or **Pingdom** for uptime monitoring
- **CloudFlare** for DDoS protection and CDN

## Estimated Costs

- **VPS**: $10-20/month (DigitalOcean, Linode, Vultr)
- **Domain**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)
- **Total**: ~$120-250/year

## Next Steps

1. Set up error tracking (Sentry)
2. Configure monitoring dashboards
3. Implement database replication
4. Set up staging environment
5. Create CI/CD pipeline
6. Load testing with Artillery or Locust

## Support

For issues or questions, refer to:
- Application logs: `/var/log/webgame/`
- System logs: `journalctl -u webgame`
- Nginx logs: `/var/log/nginx/`
