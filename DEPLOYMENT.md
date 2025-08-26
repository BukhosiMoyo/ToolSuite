# Tool Suite Deployment Guide

## 🚀 Overview

This guide covers deploying the Tool Suite to production, including the unified API backend and frontend applications.

## 🌐 Domain Configuration

### Primary Domain
- **Main Domain**: `toolsuite.co.za`
- **API Subdomain**: `api.toolsuite.co.za` (recommended)
- **Alternative**: Use path-based routing (`toolsuite.co.za/api`)

### Legacy Domains (for backward compatibility)
- `mergepdf.co.za` → Merge PDF tool
- `compresspdf.co.za` → Compress PDF tool

## 🔧 Backend API Deployment

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Node.js**: 18.x or 20.x LTS
- **Memory**: Minimum 2GB RAM
- **Storage**: 20GB+ available space
- **Ports**: 4000 (API), 80/443 (HTTP/HTTPS)

### Installation Steps

1. **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Ghostscript (for PDF compression)
sudo apt install -y ghostscript

# Install PM2 for process management
sudo npm install -g pm2
```

2. **Application Deployment**
```bash
# Clone repository
git clone https://github.com/yourusername/tools-suite.git
cd tools-suite

# Install backend dependencies
cd packages/backend
npm install --production

# Create environment file
cp env.example .env
nano .env
```

3. **Environment Configuration**
```bash
# .env file contents
NODE_ENV=production
PORT=4000
MAX_UPLOAD_MB=100
FILE_TTL_MIN=15

# Email configuration (if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. **Start Application**
```bash
# Start with PM2
pm2 start src/server.js --name "tool-suite-api"

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs tool-suite-api
```

### Web Server Configuration (Apache)

1. **Install Apache**
```bash
sudo apt install apache2
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod rewrite
```

2. **Create Virtual Host**
```bash
sudo nano /etc/apache2/sites-available/toolsuite.conf
```

3. **Virtual Host Configuration**
```apache
<VirtualHost *:80>
    ServerName toolsuite.co.za
    ServerAlias www.toolsuite.co.za
    Redirect permanent / https://toolsuite.co.za/
</VirtualHost>

<VirtualHost *:443>
    ServerName toolsuite.co.za
    ServerAlias www.toolsuite.co.za
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    SSLCertificateChainFile /path/to/your/chain.crt
    
    # Proxy to Node.js API
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:4000/
    ProxyPassReverse /api/ http://127.0.0.1:4000/
    
    # Static file serving (if needed)
    DocumentRoot /var/www/toolsuite
    
    # Security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    
    # CORS headers
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</VirtualHost>
```

4. **Enable Site and Restart**
```bash
sudo a2ensite toolsuite.conf
sudo systemctl restart apache2
```

## 🎨 Frontend Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure build settings for each app

2. **Environment Variables**
```bash
# For Merge PDF Tool
VITE_API_BASE=https://toolsuite.co.za/api

# For Compress PDF Tool  
VITE_API_BASE=https://toolsuite.co.za/api
```

3. **Build Commands**
```bash
# Merge PDF Tool
cd apps/merge-pdf-react && npm run build

# Compress PDF Tool
cd apps/compress-pdf-react && npm run build
```

### Alternative: Self-Hosted Frontend

1. **Build Applications**
```bash
# Build both apps
cd apps/merge-pdf-react && npm run build
cd ../compress-pdf-react && npm run build
```

2. **Deploy to Web Server**
```bash
# Copy build outputs to web server
sudo cp -r apps/merge-pdf-react/dist /var/www/toolsuite/merge
sudo cp -r apps/compress-pdf-react/dist /var/www/toolsuite/compress
```

3. **Apache Configuration for Frontend**
```apache
# Add to your virtual host
Alias /merge /var/www/toolsuite/merge
Alias /compress /var/www/toolsuite/compress

<Directory /var/www/toolsuite/merge>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>

<Directory /var/www/toolsuite/compress>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

## 🔒 SSL Certificate Setup

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d toolsuite.co.za -d www.toolsuite.co.za

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Commercial Certificates
- Purchase from your domain registrar or certificate authority
- Upload certificate files to `/etc/ssl/certs/`
- Update Apache configuration with correct paths

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# API health
curl https://toolsuite.co.za/api/health

# Check PM2 status
pm2 status
pm2 logs tool-suite-api

# Check Apache status
sudo systemctl status apache2
```

### Log Monitoring
```bash
# Application logs
pm2 logs tool-suite-api --lines 100

# Apache access logs
sudo tail -f /var/log/apache2/access.log

# Apache error logs
sudo tail -f /var/log/apache2/error.log
```

### Backup Strategy
```bash
# Backup application data
sudo cp -r /path/to/tools-suite/packages/backend/data /backup/
sudo cp -r /path/to/tools-suite/packages/backend/uploads /backup/

# Backup configuration
sudo cp /etc/apache2/sites-available/toolsuite.conf /backup/
sudo cp /path/to/tools-suite/packages/backend/.env /backup/
```

## 🚨 Troubleshooting

### Common Issues

1. **API Not Responding**
   - Check PM2 status: `pm2 status`
   - Check port availability: `netstat -tlnp | grep :4000`
   - Check firewall: `sudo ufw status`

2. **CORS Errors**
   - Verify domain in CORS allowlist
   - Check Apache proxy configuration
   - Ensure SSL certificates are valid

3. **File Upload Issues**
   - Check disk space: `df -h`
   - Verify upload directory permissions
   - Check file size limits in .env

4. **SSL Issues**
   - Verify certificate paths in Apache config
   - Check certificate expiration: `openssl x509 -in cert.crt -text -noout`
   - Restart Apache after certificate changes

## 🔄 Updates & Maintenance

### Regular Maintenance
- **Weekly**: Check logs for errors
- **Monthly**: Update system packages
- **Quarterly**: Review and rotate SSL certificates
- **Annually**: Review security configurations

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Install dependencies
cd packages/backend && npm install

# Restart application
pm2 restart tool-suite-api

# Check status
pm2 status
```

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify server configuration
3. Test endpoints individually
4. Review firewall and network settings
