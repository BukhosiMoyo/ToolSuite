# 🚀 Compress PDF Development Guide

## 📋 **Project Overview**
This is a PDF compression tool with a React frontend and Node.js backend API. The frontend is deployed on Vercel, and the backend runs on a Ubuntu server.

## 🏗️ **Project Structure**
```
tools-suite/
├── packages/
│   └── backend/           # Node.js API server
│       ├── src/
│       │   └── server.js  # Main server file
│       └── data/          # JSON data files
├── apps/
│   └── compress-pdf-react/ # React frontend app
└── DEVELOPMENT.md         # This file
```

## 🌐 **API Endpoints**

### Base URL
- **Production**: `https://api.compresspdf.co.za`
- **Local**: `http://localhost:4000`

### Available Endpoints
```
GET  /health                    # Health check
GET  /v1/compress-pdf/stats    # Get compression stats
GET  /v1/compress-pdf/reviews  # Get review stats
GET  /v1/merge-pdf/stats       # Get merge PDF stats
GET  /v1/merge-pdf/reviews     # Get merge PDF reviews
GET  /v1/stats/combined        # Get combined stats
GET  /v1/reviews/combined      # Get combined reviews
POST /v1/reviews               # Submit a review
POST /v1/pdf/compress          # Compress PDF file
POST /v1/jobs/zip              # Download multiple files as ZIP
```

## 🖥️ **Local Development**

### Backend (Node.js API)
```bash
# Navigate to backend directory
cd packages/backend

# Install dependencies
npm install

# Start development server
npm run dev
# OR
node src/server.js

# Server runs on http://localhost:4000
```

### Frontend (React App)
```bash
# Navigate to frontend directory
cd apps/compress-pdf-react

# Install dependencies
npm install

# Start development server
npm run dev

# App runs on http://localhost:5173
```

## 🚀 **Server Deployment**

### Server Details
- **Host**: Ubuntu server (vm8347.domain.com)
- **User**: maxx
- **Project Location**: `/home/maxx/ToolSuite`
- **PM2 Process Name**: `compress-pdf-backend` (NOT `tool-suite-api`)

### Backend Deployment Steps
```bash
# 1. SSH into server
ssh maxx@your-server-ip

# 2. Navigate to project
cd ~/ToolSuite

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies
cd packages/backend
npm install --production

# 5. Restart PM2 process
pm2 restart compress-pdf-backend

# 6. Check status
pm2 status
pm2 logs compress-pdf-backend
```

### PM2 Commands
```bash
# Check all processes
pm2 status

# Restart backend
pm2 restart compress-pdf-backend

# View logs
pm2 logs compress-pdf-backend

# Stop backend
pm2 stop compress-pdf-backend

# Start backend
pm2 start compress-pdf-backend
```

## 🔧 **Server Configuration**

### Apache Virtual Host
- **Config File**: `/etc/apache2/sites-available/api-compresspdf.conf`
- **Domains**: `api.compresspdf.co.za` and `www.api.compresspdf.co.za`
- **SSL**: Let's Encrypt certificates
- **Proxy**: Forwards HTTPS requests to `http://127.0.0.1:4000`

### SSL Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Get certificates
sudo certbot --apache -d api.compresspdf.co.za -d www.api.compresspdf.co.za

# Enable site
sudo a2ensite api-compresspdf.conf

# Restart Apache
sudo systemctl restart apache2
```

### Apache Modules Required
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod rewrite
```

## 📱 **Frontend Deployment**

### Vercel Deployment
- **Repository**: `https://github.com/BukhosiMoyo/compress-pdf-react`
- **Domain**: `compresspdf.co.za`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Git Commands for Frontend
```bash
# Navigate to frontend
cd apps/compress-pdf-react

# Check remote
git remote -v

# Set correct remote (if needed)
git remote remove origin
git remote add origin https://github.com/BukhosiMoyo/compress-pdf-react.git

# Force push (if remote is bare)
git push -u origin main --force

# Normal push
git add -f .
git commit -m "Your commit message"
git push origin main
```

## 🔍 **Troubleshooting**

### Common Issues

#### 1. API Not Accessible
```bash
# Check if backend is running
pm2 status
curl http://localhost:4000/health

# Check Apache status
sudo systemctl status apache2
sudo tail -f /var/log/apache2/error.log
```

#### 2. SSL Issues
```bash
# Check certificate paths
sudo apache2ctl configtest

# Check enabled sites
sudo a2query -s

# Disable conflicting sites
sudo a2dissite 000-default-le-ssl
sudo a2dissite 000-default
```

#### 3. Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (Vite requires 20.19+)
node --version
```

### Environment Variables
```bash
# Backend (.env)
NODE_ENV=production
PORT=4000

# Frontend (Vite)
VITE_API_BASE=https://api.compresspdf.co.za
```

## 📊 **Data Files**

### Backend Data Structure
```json
// data/compress-pdf-stats.json
{
  "tool": "compress-pdf",
  "total_compressed": 1250,
  "updated_at": "2025-08-26T19:35:00.000Z"
}

// data/compress-pdf-reviews.json
{
  "tool": "compress-pdf",
  "reviewCount": 57,
  "ratingValue": 5,
  "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 57},
  "updated_at": "2025-08-26T19:55:00.000Z"
}
```

## 🔄 **Update Process**

### When Making Changes
1. **Update this file** with any new information
2. **Test locally** first
3. **Commit and push** to GitHub
4. **Deploy to server** using PM2
5. **Verify** the changes work

### Git Workflow
```bash
# 1. Make changes
# 2. Update this file
# 3. Commit
git add .
git commit -m "feat: Description of changes"

# 4. Push to GitHub
git push origin main

# 5. Deploy to server
ssh maxx@server
cd ~/ToolSuite
git pull origin main
pm2 restart compress-pdf-backend
```

## 📞 **Important Notes**

- **ALWAYS check this file first** before making changes
- **PM2 process name is `compress-pdf-backend`** (not `tool-suite-api`)
- **Backend runs on port 4000**, Apache proxies HTTPS to it
- **Frontend is deployed on Vercel**, not on the server
- **API base URL is `https://api.compresspdf.co.za`** in production
- **Live counters update every 5-10 seconds** automatically

---

**Last Updated**: 2025-08-26
**Maintainer**: Development Team
**Version**: 1.0.0
