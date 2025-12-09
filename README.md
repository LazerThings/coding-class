# CodingClass

A Vue 3 coding education platform where users create courses with interactive JavaScript exercises, and students take them. Think Codecademy-style but self-hosted.

## Features

- **Interactive Code Exercises** - Write and run JavaScript directly in the browser
- **Course Builder** - Create courses with lessons containing markdown, code blocks, quizzes, videos, and images
- **Progress Tracking** - Track student progress through courses and lessons
- **Self-Service Instructor Mode** - Any user can enable instructor features to create courses
- **Role-Based Access** - Owner, admin, and student roles with hierarchical permissions
- **Real Authentication** - Secure password hashing with bcrypt, session-based auth

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite 7 + Tailwind CSS
- **Backend**: Express 5 + better-sqlite3
- **Auth**: bcrypt password hashing, express-session

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev servers (frontend + backend)
pnpm dev

# Production build
pnpm build

# Run production server
pnpm start
```

## Development

- Frontend runs on `http://localhost:5173` (Vite)
- Backend API runs on `http://localhost:3000`
- Vite proxies `/api/*` requests to the backend in dev mode

## Deploying on Ubuntu 22.04 LTS

### 1. Install Node.js 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install pnpm

```bash
sudo npm install -g pnpm
```

### 3. Clone and build

```bash
git clone <your-repo-url> /opt/codingclass
cd /opt/codingclass
pnpm install
pnpm build
```

### 4. Create systemd service

```bash
sudo nano /etc/systemd/system/codingclass.service
```

Paste:

```ini
[Unit]
Description=CodingClass
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/codingclass
ExecStart=/usr/bin/node --import tsx server/index.ts
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=SESSION_SECRET=your-secret-here-change-this

[Install]
WantedBy=multi-user.target
```

### 5. Set permissions and start

```bash
sudo chown -R www-data:www-data /opt/codingclass
sudo systemctl daemon-reload
sudo systemctl enable codingclass
sudo systemctl start codingclass
```

### 6. Set up Nginx reverse proxy

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/codingclass
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/codingclass /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. (Optional) Add SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Useful commands

```bash
sudo systemctl status codingclass    # Check status
sudo journalctl -u codingclass -f    # View logs
sudo systemctl restart codingclass   # Restart after updates
```

## Notes

- First user to sign up becomes the owner
- Data persists to SQLite database in `data/codingclass.db`
- See `CLAUDE.md` for detailed architecture documentation
