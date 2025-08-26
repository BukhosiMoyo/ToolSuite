# Tool Suite Project Structure

## 📁 Root Directory Structure

```
tools-suite/
├── 📁 apps/                          # Frontend applications
│   ├── 📁 merge-pdf-react/          # PDF merging tool
│   └── 📁 compress-pdf-react/       # PDF compression tool
├── 📁 packages/                      # Shared packages and backend
│   └── 📁 backend/                  # Unified API backend
├── 📄 README.md                     # Main project documentation
├── 📄 PROJECT_STRUCTURE.md          # This file
├── 📄 .gitignore                    # Git ignore rules
├── 📄 package.json                  # Root package configuration
└── 📄 publish-merge.sh              # Deployment script
```

## 🚀 Frontend Applications

### Merge PDF Tool (`apps/merge-pdf-react/`)
- **Purpose**: Combine multiple PDF files into one
- **Tech Stack**: React 19, Vite, PDF.js
- **Features**: Drag & drop, reordering, preview
- **Deployment**: Vercel

### Compress PDF Tool (`apps/compress-pdf-react/`)
- **Purpose**: Reduce PDF file sizes
- **Tech Stack**: React 19, Vite
- **Features**: Multiple compression levels, metadata removal
- **Deployment**: Vercel

## 🔧 Backend API (`packages/backend/`)

### Core Structure
```
packages/backend/
├── 📁 src/
│   ├── 📁 routes/                   # API endpoints
│   │   ├── 📄 merge.js              # PDF merging logic
│   │   └── 📄 email.js              # Email functionality
│   ├── 📁 lib/                      # Utility libraries
│   ├── 📄 server.js                 # Main server file
│   └── 📄 stats-multi.js            # Multi-tool statistics
├── 📁 data/                         # Persistent data
├── 📁 uploads/                      # File uploads
├── 📁 tmp/                          # Temporary processing
├── 📁 outputs/                      # Generated files
└── 📄 README.md                     # Backend documentation
```

### API Endpoints
- **PDF Compression**: `/v1/pdf/compress`
- **PDF Merging**: `/v1/pdf/merge`
- **File Downloads**: `/v1/jobs/:jobId/download`
- **Statistics**: `/v1/stats/summary`
- **Reviews**: `/v1/reviews/summary`

## 🗂️ Data Management

### File Storage
- **Uploads**: Temporary storage with TTL
- **Outputs**: Generated PDFs with secure access
- **Data**: Statistics, reviews, and configuration

### Security Features
- File type validation (PDF only)
- Size limits and rate limiting
- Secure token-based downloads
- Automatic cleanup of expired files

## 🌐 Domain Structure

### Current Domains
- **Main**: `toolsuite.co.za` (planned)
- **Legacy**: `mergepdf.co.za`, `compresspdf.co.za`
- **Development**: Localhost for development

### CORS Configuration
- Supports multiple domains
- Development-friendly localhost access
- Secure production restrictions

## 🚀 Deployment

### Frontend Apps
- **Build**: `npm run build`
- **Deploy**: Vercel (automatic from Git)
- **Environment**: Configure API endpoints

### Backend API
- **Runtime**: Node.js with Express
- **Port**: 4000 (configurable)
- **Proxy**: Apache/Nginx for HTTPS
- **Process Manager**: PM2 or systemd

## 🔄 Development Workflow

### Local Development
1. Clone repository
2. Install dependencies in each app
3. Start backend: `npm run dev`
4. Start frontend: `npm run dev`
5. Configure environment variables

### Building & Testing
1. Test individual apps locally
2. Build production versions
3. Deploy backend to server
4. Deploy frontend to Vercel

## 📊 Monitoring & Analytics

### Built-in Features
- Request logging with Pino
- File processing statistics
- User review collection
- Health check endpoints

### Future Enhancements
- Real-time processing status
- Advanced analytics dashboard
- Error tracking and alerting
- Performance monitoring

## 🎯 Roadmap

### Short Term
- [ ] Complete Tool Suite rebranding
- [ ] Unified domain deployment
- [ ] Enhanced error handling
- [ ] Performance optimization

### Long Term
- [ ] Additional PDF tools
- [ ] User authentication system
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Webhook system
