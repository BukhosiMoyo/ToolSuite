# Tool Suite — PDF Tools Monorepo

A comprehensive suite of PDF manipulation tools built with modern web technologies.

## 🛠️ Tools

- **Merge PDF** (`apps/merge-pdf-react`) — Combine multiple PDFs into one
- **Compress PDF** (`apps/compress-pdf-react`) — Reduce PDF file sizes
- **Tool Suite API** (`packages/backend`) — Unified backend for all tools

## 🚀 Development

### Frontend Apps
```bash
# Merge PDF Tool
cd apps/merge-pdf-react && npm install && npm run dev

# Compress PDF Tool  
cd apps/compress-pdf-react && npm install && npm run dev
```

### Backend API
```bash
cd packages/backend && npm install && npm run dev
```

## 📁 Repository Structure

This project consists of multiple repositories:

- **ToolSuite** (this repo) - Unified API backend for all PDF tools
- **MergePdfReact** - Frontend for PDF merging tool
- **CompressPdfReact** - Frontend for PDF compression tool

## 🏗️ Build

```bash
# Build Merge PDF Tool
cd apps/merge-pdf-react && npm run build

# Build Compress PDF Tool
cd apps/compress-pdf-react && npm run build
```

## 🌐 Environment

- **Frontend Apps**: Configure `VITE_API_BASE` to point to your Tool Suite API domain
- **Backend**: Set up `.env` file on server (see backend README)

## 📁 Project Structure

```
tools-suite/
├── apps/                    # Frontend applications
│   ├── merge-pdf-react/    # PDF merging tool
│   └── compress-pdf-react/ # PDF compression tool
├── packages/                # Shared packages
│   └── backend/            # Unified API backend
└── README.md               # This file
```

## 🎯 Roadmap

- [ ] Add more PDF tools (split, rotate, watermark)
- [ ] Unified user dashboard
- [ ] Shared authentication system
- [ ] Analytics and usage tracking
