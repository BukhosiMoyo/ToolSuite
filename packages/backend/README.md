# Tool Suite API

Unified backend API for the Tool Suite PDF manipulation tools.

## 🚀 Features

- **PDF Compression** - Reduce file sizes using Ghostscript
- **PDF Merging** - Combine multiple PDFs into one
- **Email Integration** - Send processed files via email
- **File Management** - Secure file upload/download with TTL
- **Statistics Tracking** - Usage analytics for all tools
- **Review System** - User feedback collection

## 🛠️ API Endpoints

### PDF Compression
- `POST /v1/pdf/compress` - Compress PDF files
- `GET /v1/jobs/:jobId/download` - Download compressed files
- `POST /v1/jobs/zip` - Create ZIP archives of multiple files

### PDF Merging
- `POST /v1/pdf/merge` - Merge multiple PDFs
- `GET /v1/pdf/merge/stats` - Get merge tool statistics

### Statistics & Analytics
- `GET /v1/stats/summary` - Overall compression statistics
- `GET /v1/mergepdf/stats/summary` - Merge tool statistics
- `GET /v1/reviews/summary` - User review summary

### Health & Monitoring
- `GET /health` - API health check

## 🔧 Environment Variables

```bash
# Server Configuration
PORT=4000                           # API server port
NODE_ENV=production                 # Environment mode

# File Management
MAX_UPLOAD_MB=100                   # Maximum upload size in MB
FILE_TTL_MIN=15                     # File retention time in minutes

# CORS Configuration
# Add your domains to the allowlist in server.js
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📁 Project Structure

```
packages/backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── merge.js      # PDF merging endpoints
│   │   └── email.js      # Email functionality
│   ├── lib/              # Utility libraries
│   ├── server.js         # Main server file
│   └── stats-multi.js    # Multi-tool statistics
├── data/                 # Persistent data storage
├── uploads/              # Temporary file uploads
├── tmp/                  # Processing temporary files
└── outputs/              # Generated PDF outputs
```

## 🔒 Security Features

- File type validation (PDF only)
- File size limits
- Secure token-based downloads
- Automatic file cleanup
- CORS protection
- Rate limiting considerations

## 📊 Monitoring

- Request logging with Pino
- File processing statistics
- Error tracking and reporting
- Health check endpoints

## 🚀 Deployment

The API is designed to run behind a reverse proxy (Apache/Nginx) for HTTPS termination. Configure your web server to proxy requests to `127.0.0.1:4000`.

## 🔄 Future Enhancements

- [ ] User authentication system
- [ ] Rate limiting per IP/user
- [ ] Webhook notifications
- [ ] Advanced PDF manipulation tools
- [ ] Real-time processing status
- [ ] Batch processing queues
