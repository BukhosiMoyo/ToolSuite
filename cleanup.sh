#!/bin/bash

echo "🧹 Tool Suite Cleanup Script"
echo "=============================="

# Remove test PDF files
echo "📄 Removing test PDF files..."
rm -f isu-compressed.pdf
rm -f apps/INVOICE_651.pdf
rm -f apps/CoR39_60007869111.pdf

# Remove Zone.Identifier files (Windows security files)
echo "🔒 Removing Zone.Identifier files..."
find . -name "*Zone.Identifier" -type f -delete

# Remove build directories
echo "🏗️ Removing build directories..."
rm -rf apps/*/dist/
rm -rf packages/backend/outputs/
rm -rf packages/backend/tmp/
rm -rf packages/backend/uploads/

# Remove node_modules (can be regenerated)
echo "📦 Removing node_modules directories..."
rm -rf node_modules/
rm -rf apps/*/node_modules/
rm -rf packages/*/node_modules/

# Remove package-lock files (can be regenerated)
echo "🔒 Removing package-lock files..."
rm -f package-lock.json
rm -f apps/*/package-lock.json
rm -f packages/*/package-lock.json

# Remove runtime data
echo "📊 Removing runtime data..."
rm -rf packages/backend/data/

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To restore dependencies, run:"
echo "  npm install"
echo "  cd apps/merge-pdf-react && npm install"
echo "  cd apps/compress-pdf-react && npm install"
echo "  cd packages/backend && npm install"
echo ""
echo "Note: Build directories and runtime data will be recreated automatically."
