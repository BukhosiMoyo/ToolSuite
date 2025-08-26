# Tool Suite Development Guide

## 🚀 Getting Started

This guide will help you set up the Tool Suite development environment on your local machine.

## 📋 Prerequisites

- **Node.js**: 18.x or 20.x LTS
- **npm**: 8.x or higher
- **Git**: Latest version
- **Ghostscript**: For PDF compression (optional, for backend testing)

### Installing Prerequisites

#### Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Windows
# Download from https://nodejs.org/
```

#### Ghostscript (Backend Testing)
```bash
# Ubuntu/Debian
sudo apt install ghostscript

# macOS
brew install ghostscript

# Windows
# Download from https://ghostscript.com/
```

## 🏗️ Project Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/tools-suite.git
cd tools-suite
```

### 2. Install Dependencies

#### Root Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd packages/backend
npm install
cd ../..
```

#### Frontend Dependencies
```bash
# Merge PDF Tool
cd apps/merge-pdf-react
npm install
cd ../..

# Compress PDF Tool
cd apps/compress-pdf-react
npm install
cd ../..
```

### 3. Environment Configuration

#### Backend Environment
```bash
cd packages/backend
cp env.example .env
```

Edit `.env` file:
```bash
# Development settings
NODE_ENV=development
PORT=4000
MAX_UPLOAD_MB=100
FILE_TTL_MIN=15

# Optional: Email configuration for testing
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend Environment
Create `.env.local` files in each frontend app:

**Merge PDF Tool** (`apps/merge-pdf-react/.env.local`):
```bash
VITE_API_BASE=http://localhost:4000
```

**Compress PDF Tool** (`apps/compress-pdf-react/.env.local`):
```bash
VITE_API_BASE=http://localhost:4000
```

## 🚀 Development Workflow

### Starting the Development Environment

#### 1. Start Backend API
```bash
cd packages/backend
npm run dev
```

The API will be available at `http://localhost:4000`

#### 2. Start Frontend Apps (in separate terminals)

**Merge PDF Tool:**
```bash
cd apps/merge-pdf-react
npm run dev
```

**Compress PDF Tool:**
```bash
cd apps/compress-pdf-react
npm run dev
```

### Development URLs
- **Backend API**: http://localhost:4000
- **Merge PDF Tool**: http://localhost:5173 (or next available port)
- **Compress PDF Tool**: http://localhost:5174 (or next available port)

## 🧪 Testing

### Backend Testing
```bash
cd packages/backend

# Test API endpoints
curl http://localhost:4000/health

# Test PDF compression (if Ghostscript is installed)
curl -X POST http://localhost:4000/v1/pdf/compress \
  -F "file=@test.pdf" \
  -F "compression=medium"
```

### Frontend Testing
- Open each app in your browser
- Test file uploads and processing
- Check console for any errors
- Verify API communication

## 🔧 Development Tools

### Code Quality
```bash
# Lint frontend apps
cd apps/merge-pdf-react && npm run lint
cd ../compress-pdf-react && npm run lint

# Lint backend (if ESLint is configured)
cd ../../packages/backend && npm run lint
```

### Building for Production
```bash
# Build Merge PDF Tool
cd apps/merge-pdf-react
npm run build

# Build Compress PDF Tool
cd ../compress-pdf-react
npm run build
```

## 📁 Project Structure

```
tools-suite/
├── 📁 apps/                          # Frontend applications
│   ├── 📁 merge-pdf-react/          # PDF merging tool
│   │   ├── 📁 src/                  # Source code
│   │   ├── 📁 public/               # Static assets
│   │   ├── 📄 package.json          # Dependencies
│   │   └── 📄 vite.config.js        # Build configuration
│   └── 📁 compress-pdf-react/       # PDF compression tool
│       ├── 📁 src/                  # Source code
│       ├── 📁 public/               # Static assets
│       ├── 📄 package.json          # Dependencies
│       └── 📄 vite.config.js        # Build configuration
├── 📁 packages/                      # Shared packages
│   └── 📁 backend/                  # Unified API backend
│       ├── 📁 src/                  # Source code
│       │   ├── 📁 routes/           # API endpoints
│       │   ├── 📁 lib/              # Utility libraries
│       │   └── 📄 server.js         # Main server
│       ├── 📄 package.json          # Dependencies
│       └── 📄 .env                  # Environment variables
├── 📄 README.md                     # Project overview
├── 📄 DEVELOPMENT.md                # This file
├── 📄 PROJECT_STRUCTURE.md          # Detailed structure
├── 📄 DEPLOYMENT.md                 # Production deployment
└── 📄 cleanup.sh                    # Cleanup script
```

## 🐛 Debugging

### Backend Debugging
```bash
# Enable debug logging
cd packages/backend
DEBUG=* npm run dev

# Check logs
pm2 logs tool-suite-api

# Monitor file system
watch -n 1 "ls -la tmp/ uploads/ outputs/"
```

### Frontend Debugging
- Use browser developer tools
- Check network tab for API calls
- Monitor console for errors
- Use React DevTools extension

### Common Issues

#### CORS Errors
- Ensure backend is running on correct port
- Check CORS configuration in `server.js`
- Verify frontend API base URL

#### File Upload Issues
- Check file size limits
- Verify file type validation
- Ensure upload directories exist

#### Build Errors
- Clear `node_modules` and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-pdf-tool

# Make changes
# Test locally
# Commit changes
git add .
git commit -m "Add new PDF tool feature"

# Push and create PR
git push origin feature/new-pdf-tool
```

### 2. Testing Changes
```bash
# Test backend changes
cd packages/backend
npm run dev
# Test API endpoints

# Test frontend changes
cd apps/merge-pdf-react
npm run dev
# Test in browser
```

### 3. Code Review
- Ensure code follows project standards
- Test all functionality locally
- Update documentation if needed
- Request review from team members

## 📚 Additional Resources

### Documentation
- [Tool Suite Project Structure](./PROJECT_STRUCTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./packages/backend/README.md)

### External Resources
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

## 🤝 Contributing

### Code Standards
- Use consistent formatting
- Add comments for complex logic
- Follow existing naming conventions
- Write meaningful commit messages

### Testing Requirements
- Test all new features locally
- Ensure backward compatibility
- Update tests if applicable
- Test on multiple browsers/devices

## 📞 Getting Help

### Internal Resources
- Check existing documentation
- Review similar implementations
- Ask team members for guidance

### External Resources
- Stack Overflow for technical issues
- GitHub Issues for bug reports
- Community forums for general questions

---

**Happy coding! 🎉**
