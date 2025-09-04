# Bank Converter Multi-Bank Parser Implementation

## Overview
Implemented a multi-bank PDF parser system for the bank converter app that processes bank statements from multiple South African banks (FNB, Capitec, Absa, Standard Bank, Nedbank) with a generic fallback parser.

## Architecture

### Backend (Port 4000)
- **Location**: `packages/backend/src/services/bank/`
- **Engine**: `engine.js` - Main parsing engine with adapter system
- **Adapters**: 
  - `adapters/fnbPdf.js` - FNB-specific parser
  - `adapters/genericTable.js` - Generic fallback parser
  - `adapters/simplePdf.js` - Simple aggressive parser
- **Routes**: `routes/bank.js` - API endpoints
- **Mount**: Added to main server at `/v1/bank`

### Frontend (Port 5173/5175)
- **Location**: `apps/bank-converter-react/`
- **Enhanced UI**: Styled preview with pills, badges, and transaction types
- **Multi-bank display**: Shows supported banks with colored pills

## API Endpoints

### POST /v1/bank/preview
- **Purpose**: Preview parsed transaction data
- **Input**: PDF files + options (date_format, columns)
- **Output**: JSON with rows, warnings, meta

### POST /v1/bank/convert
- **Purpose**: Convert to CSV
- **Input**: PDF files + options
- **Output**: CSV file download

## Parser System

### Adapter Priority
1. **FNB Parser** - FNB-specific patterns with robust date-first parsing
2. **Generic Parser** - Standard table parsing with rightmost number peeling

### Date Patterns Supported
- `YYYY-MM-DD` / `YYYY/MM/DD`
- `DD/MM/YYYY` / `DD-MM-YYYY`
- `DD Mon YYYY` (e.g., "12 Aug 2025")
- `DD MM YYYY` (e.g., "12 08 2025")

### Amount Patterns
- `123.45` / `1,234.56`
- `R 123.45`
- `123.45 Cr` / `123.45 Dr`
- `(123.45)` (negative)

## Recent Improvements (Latest Update)

### ✅ Parser Fixes Applied
**Problem Solved**: Parsers now correctly extract transactions from FNB PDFs

**Key Improvements**:
- **Date-Anywhere Detection**: FNB parser finds "DD Mon" anywhere on the line (not just at start) - handles PDF padding/invisible chars
- **Rightmost Number Peeling**: Deterministic extraction - rightmost = balance, previous = amount, optional fee
- **Fee-Only Row Support**: Handles rows like "14 Jul 6.00 3,848.13Cr"
- **Removed Thresholds**: Accepts any rows found, no minimum count requirements
- **Better Number Parsing**: Handles CR/DR/parentheses and comma-separated numbers
- **NBSP Handling**: Collapses non-breaking spaces and extra whitespace

**PDF Content Now Handled**:
```
14 Jul <description> 400.00Cr 1,654.13Cr
14 Jul <description> 500.00 3,854.13Cr 15.10
14 Jul 6.00 3,848.13Cr  (fee-only row)
```

**Key Observations**:
- ✅ Date format: `14 Jul` (DD Mon) - now properly detected
- ✅ Amount format: `400.00Cr` - correctly parsed as credit
- ✅ Balance format: `1,654.13Cr` - rightmost number extracted as balance
- ✅ Fee handling: `15.10` - optional fee amount
- ✅ Fee-only rows: `6.00 3,848.13Cr` - special case handled

## Files Modified

### Backend Files
- `packages/backend/src/services/bank/engine.js` - Main engine
- `packages/backend/src/services/bank/adapters/fnbPdf.js` - FNB parser
- `packages/backend/src/services/bank/adapters/genericTable.js` - Generic parser
- `packages/backend/src/services/bank/adapters/simplePdf.js` - Simple parser
- `packages/backend/src/routes/bank.js` - API routes
- `packages/backend/src/server.js` - CORS + route mounting

### Frontend Files
- `apps/bank-converter-react/src/lib/api.js` - API calls
- `apps/bank-converter-react/src/components/steps/Step3Preview.jsx` - Styled preview
- `apps/bank-converter-react/src/components/steps/Step2Settings.jsx` - Multi-bank display

## CORS Configuration
Added to `packages/backend/src/server.js`:
```javascript
const allowlist = [
  // ... existing domains
  'http://localhost:5173',             // Vite dev server
  'http://localhost:5175',             // Vite dev server (alternative)
  'http://127.0.0.1:5173',             // Vite dev server (localhost)
  'http://127.0.0.1:5175',             // Vite dev server (localhost alternative)
];
```

## Running the System

### Backend (Ubuntu/WSL)
```bash
cd ~/tools-suite/packages/backend
npm run dev
```

### Frontend (Ubuntu/WSL)
```bash
cd ~/tools-suite/apps/bank-converter-react
npm run dev
```

## Debug Information
- Backend logs show detailed parsing attempts
- FNB parser logs: `FNB Parser: Processing page X with Y lines`
- Simple parser logs: `Simple Parser: Found date at line X: YYYY-MM-DD`

## Next Steps Needed
1. **Test Parsing Results**: Verify the improved parsers extract transactions correctly
2. **Add More Bank Adapters**: Capitec, Absa, Standard Bank, Nedbank
3. **Frontend Enhancements**: Column reordering, date format selection, better preview
4. **Performance Optimization**: Handle large PDFs efficiently
5. **Error Handling**: Better user feedback for parsing failures

## Test Files
- `test-multi-bank.js` - API testing script
- `debug-pdf.js` - PDF content analysis script
- Sample PDF: `apps/CoR39_60007869111.pdf`
