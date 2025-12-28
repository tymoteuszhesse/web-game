# OVH VPS Deployment Checklist

## Pre-Deployment Information

**VPS Details:**
- Provider: OVH Cloud
- Location: France (Gravelines)
- OS: Ubuntu 22.04 LTS
- Specs: 4 vCores, 8GB RAM, 75GB SSD
- IPv4: `[your-ipv4]`
- IPv6: `[your-ipv6]`
- Username: `[your-username]`
- Password: `[provided-by-ovh]`

**Required Information:**
- [ ] Git repository URL (GitHub/GitLab)
- [ ] Domain name (or will use IP for now)
- [ ] Database password (generate strong password)
- [ ] JWT secret key (generate with openssl)

---

## Phase 1: Initial Connection & Security (15 min)

### Step 1.1: First SSH Connection

```bash
# Connect to your VPS
ssh [your-username]@[your-ipv4]
# Enter password when prompted
```

**Expected:** You should see Ubuntu welcome message and command prompt.

### Step 1.2: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

**Expected:** System packages will update (may take 5-10 minutes).

### Step 1.3: Create Application User

```bash
# Create user for running the application
sudo adduser webgame
# Enter password when prompted (save this!)

# Add to sudo group
sudo usermod -aG sudo webgame

# Switch to new user
su - webgame
```

**Expected:** You're now logged in as 'webgame' user.

### Step 1.4: Set Up SSH Keys (Optional but Recommended)

**On your local machine (new terminal):**
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to server
ssh-copy-id webgame@[your-ipv4]
```

**Expected:** You can now login without password: `ssh webgame@[your-ipv4]`

### Step 1.5: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

**Expected:** Firewall is active with ports 22, 80, 443 open.

---

## Phase 2: Install Dependencies (15 min)

### Step 2.1: Install Python 3.11

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
python3.11 --version
```

**Expected:** Shows Python 3.11.x

### Step 2.2: Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

**Expected:** PostgreSQL is active and running.

### Step 2.3: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

**Expected:** Nginx is active. Visit `http://[your-ipv4]` - should see Nginx welcome page.

### Step 2.4: Install Git

```bash
sudo apt install -y git
git --version
```

**Expected:** Shows Git version.

---

## Phase 3: Database Setup (10 min)

### Step 3.1: Create Database and User

```bash
sudo -u postgres psql
```

**Inside PostgreSQL prompt:**
```sql
CREATE DATABASE web_game;
CREATE USER web_game_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE web_game TO web_game_user;
\q
```

**⚠️ IMPORTANT:** Replace `YOUR_STRONG_PASSWORD_HERE` with a strong password. Save it!

### Step 3.2: Configure PostgreSQL Access

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

**Add this line before other rules:**
```
local   web_game    web_game_user                   md5
```

**Save:** Ctrl+O, Enter, Ctrl+X

```bash
sudo systemctl restart postgresql
```

### Step 3.3: Test Database Connection

```bash
psql -U web_game_user -d web_game -h localhost
# Enter password when prompted
# Type \q to exit
```

**Expected:** Successfully connects to database.

---

## Phase 4: Deploy Application Code (15 min)

### Step 4.1: Clone Repository

```bash
cd /home/webgame
git clone [YOUR_GIT_REPO_URL] web_game
cd web_game/backend
```

**Expected:** Code is cloned into `/home/webgame/web_game/`

### Step 4.2: Create Virtual Environment

```bash
python3.11 -m venv venv
source venv/bin/activate
```

**Expected:** Prompt shows `(venv)` prefix.

### Step 4.3: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected:** All packages install successfully.

### Step 4.4: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**Update these values:**
```env
DATABASE_URL=postgresql://web_game_user:YOUR_DB_PASSWORD@localhost:5432/web_game
SECRET_KEY=[generate-with-command-below]
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
HOST=0.0.0.0
PORT=8000
RELOAD=False
WORKERS=9
ENVIRONMENT=production
CORS_ORIGINS=http://[your-ipv4],https://[your-domain-if-you-have-one]
```

**Generate SECRET_KEY:**
```bash
openssl rand -hex 32
```

**Save:** Ctrl+O, Enter, Ctrl+X

### Step 4.5: Run Database Migrations

```bash
source venv/bin/activate
alembic upgrade head
```

**Expected:** All migrations run successfully.

### Step 4.6: Test Application

```bash
# Test run (Ctrl+C to stop after confirming it works)
gunicorn app.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**In another terminal on your local machine:**
```bash
curl http://[your-ipv4]:8000/health
```

**Expected:** Returns health check response.

**Stop the test server:** Ctrl+C

---

## Phase 5: Systemd Service Setup (10 min)

### Step 5.1: Create Systemd Service File

```bash
sudo nano /etc/systemd/system/webgame.service
```

**Paste this configuration:**
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
    --workers 9 \
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

**Save:** Ctrl+O, Enter, Ctrl+X

### Step 5.2: Create Log Directory

```bash
sudo mkdir -p /var/log/webgame
sudo chown webgame:webgame /var/log/webgame
```

### Step 5.3: Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable webgame
sudo systemctl start webgame
sudo systemctl status webgame
```

**Expected:** Service is active and running.

### Step 5.4: Check Logs

```bash
sudo journalctl -u webgame -f
# Ctrl+C to exit
```

**Expected:** No errors, shows "Application startup complete".

---

## Phase 6: Nginx Configuration (15 min)

### Step 6.1: Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/webgame
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name [your-ipv4] [your-domain-if-you-have];

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

    # API Docs
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
        root /home/webgame/web_game;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Replace:** `[your-ipv4]` and optionally `[your-domain-if-you-have]`

**Save:** Ctrl+O, Enter, Ctrl+X

### Step 6.2: Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/webgame /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Expected:** "nginx: configuration file test is successful"

### Step 6.3: Set Frontend Permissions

```bash
sudo chown -R webgame:webgame /home/webgame/web_game
```

---

## Phase 7: Final Testing (10 min)

### Step 7.1: Test API

```bash
# On your local machine
curl http://[your-ipv4]/health
curl http://[your-ipv4]/docs
```

**Expected:** Health check responds, docs page loads.

### Step 7.2: Test Frontend

Open in browser: `http://[your-ipv4]`

**Expected:** Your game loads!

### Step 7.3: Check All Services

```bash
sudo systemctl status webgame
sudo systemctl status nginx
sudo systemctl status postgresql
```

**Expected:** All services are active and running.

---

## Phase 8: SSL/HTTPS (Optional - If You Have Domain)

### Step 8.1: Point Domain to VPS

In your domain registrar, create A record:
```
@ or yourdomain.com → [your-ipv4]
```

Wait 5-10 minutes for DNS propagation.

### Step 8.2: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 8.3: Get SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts, choose redirect HTTP to HTTPS.

### Step 8.4: Update CORS in .env

```bash
cd /home/webgame/web_game/backend
nano .env
```

Update:
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Restart service:
```bash
sudo systemctl restart webgame
```

---

## Post-Deployment

### Monitoring Commands

```bash
# View application logs
sudo journalctl -u webgame -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View application logs
tail -f /var/log/webgame/access.log
tail -f /var/log/webgame/error.log

# Check service status
sudo systemctl status webgame
```

### Maintenance Commands

```bash
# Restart application
sudo systemctl restart webgame

# Restart Nginx
sudo systemctl restart nginx

# Update application
cd /home/webgame/web_game
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart webgame
```

---

## Troubleshooting

### Application won't start
```bash
sudo journalctl -u webgame -n 50
# Check logs for errors
```

### Can't connect to database
```bash
psql -U web_game_user -d web_game -h localhost
# Test manual connection
```

### Nginx errors
```bash
sudo nginx -t
# Test configuration
sudo tail -f /var/log/nginx/error.log
# Check error logs
```

---

## Security Checklist

- [ ] Firewall enabled (ufw)
- [ ] SSH keys configured
- [ ] Strong database password
- [ ] Strong JWT secret key
- [ ] Non-root user for application
- [ ] HTTPS enabled (if domain available)
- [ ] Regular backups configured

---

## Backup Setup (Recommended)

### Create Backup Script

```bash
sudo nano /usr/local/bin/backup-webgame-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/webgame/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="web_game_backup_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR
pg_dump -U web_game_user -h localhost web_game | gzip > "$BACKUP_DIR/$FILENAME"
find $BACKUP_DIR -name "web_game_backup_*.sql.gz" -mtime +7 -delete
echo "Backup completed: $FILENAME"
```

```bash
sudo chmod +x /usr/local/bin/backup-webgame-db.sh
```

### Set Up .pgpass

```bash
echo "localhost:5432:web_game:web_game_user:YOUR_DB_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass
```

### Schedule Daily Backups

```bash
crontab -e
```

Add:
```
0 2 * * * /usr/local/bin/backup-webgame-db.sh >> /var/log/webgame/backup.log 2>&1
```

---

## Success Criteria

✅ All services running
✅ API accessible at `http://[your-ipv4]/health`
✅ Frontend loads at `http://[your-ipv4]`
✅ Can register/login users
✅ WebSocket connections work
✅ Database persists data

---

**Estimated Total Time:** 90-120 minutes

**Next Steps After Deployment:**
1. Test all game features
2. Monitor logs for errors
3. Set up SSL if domain available
4. Configure backups
5. Share with first users!
