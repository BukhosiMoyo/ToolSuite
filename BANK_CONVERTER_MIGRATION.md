# Bank Converter Migration to Tools Suite Backend

## Overview
Successfully migrated the bank converter functionality from the standalone `bank-converter` project to the unified `tools-suite` backend API.

## What Was Migrated

### 1. FNB Parser
- **From**: `bank-converter/api/parsers/fnb-parser.js`
- **To**: `tools-suite/packages/backend/src/lib/fnb-parser.js`
- **Features**: Full FNB PDF parsing with configurable toggles

### 2. Backend Dependencies
- **Updated**: `tools-suite/packages/backend/package.json`
- **Added**: `@fast-csv/parse` dependency
- **Existing**: All other required dependencies were already present

### 3. Bank Routes
- **Created**: `tools-suite/packages/backend/src/routes/bank.js`
- **Endpoints**:
  - `POST /v1/bank/preview` - Preview parsed bank data
  - `POST /v1/bank/convert` - Convert and download bank files
  - `GET /v1/bank/healthz` - Health check

### 4. Bank Services
- **Created**: `tools-suite/packages/backend/src/services/bank.js`
- **Functions**:
  - `previewBankFiles()` - Process files for preview
  - `convertBankFiles()` - Convert files to CSV

### 5. Server Integration
- **Updated**: `tools-suite/packages/backend/src/server.js`
- **Added**: Bank router mounting at `/v1/bank`
- **Updated**: CORS allowlist to include bank converter domains
- **Added**: Development localhost ports for bank converter

### 6. Frontend API Configuration
- **Updated**: `tools-suite/apps/bank-converter-react/src/lib/api.js`
- **Changed**: API base URL from `localhost:3001` to `localhost:4000`
- **Added**: FNB parser toggle parameters

## API Endpoints

### Bank Converter Endpoints
- `POST /v1/bank/preview` - Preview bank statement data
- `POST /v1/bank/convert` - Convert bank statements to CSV
- `GET /v1/bank/healthz` - Health check

### Request Format
```javascript
// Preview Request
{
  files: File[], // Array of uploaded files
  currency: "ZAR",
  dateFormatHint: "DD/MM/YYYY",
  bankHint: "auto",
  // FNB Parser Toggles
  include_running_balance: true,
  include_accrued_bank_charges: true,
  categorize: true,
  keep_card_ref: true,
  reveal_card_ref: false,
  emit_vat: true,
  parse_value_date: true,
  fail_on_balance_mismatch: false,
  ocr: false
}
```

### Response Format
```javascript
// Preview Response
{
  rows: [
    {
      date: "2024-01-01",
      description: "CARD PURCHASE",
      amount: 123.45,
      balance: 1000.00
    }
  ],
  warnings: ["File processed successfully"]
}
```

## Testing

### 1. Backend Test
```bash
cd tools-suite/packages/backend
node test-bank-integration.js
```

### 2. Full Integration Test
```bash
# Terminal 1: Start Backend
cd tools-suite/packages/backend
npm run dev

# Terminal 2: Start Frontend
cd tools-suite/apps/bank-converter-react
npm run dev
```

### 3. Access Points
- **Backend API**: http://localhost:4000
- **Frontend App**: http://localhost:5175
- **Health Check**: http://localhost:4000/v1/bank/healthz

## Configuration

### Environment Variables
- `MAX_FILE_MB`: Maximum file size in MB (default: 50)
- `MAX_FILES`: Maximum files per request (default: 10)
- `ENABLE_OCR`: Enable OCR processing (default: false)

### CORS Configuration
The backend automatically allows:
- Production domains: `compresspdf.co.za`, `mergepdf.co.za`, `bank-converter.vercel.app`
- Development: `localhost:5175` (bank converter frontend)

## File Support
- **CSV**: Standard CSV bank statements
- **PDF**: FNB bank statements with advanced parsing
- **Future**: XLS, XLSX, OFX, QFX, MT940 support planned

## Benefits of Migration

1. **Unified API**: Single backend for all tools
2. **Shared Infrastructure**: Common CORS, rate limiting, logging
3. **Consistent Patterns**: Same error handling and response formats
4. **Easier Deployment**: Single backend deployment
5. **Better Security**: Centralized security policies

## Next Steps

1. Test the integration thoroughly
2. Deploy the updated backend
3. Update frontend deployment to use new API
4. Remove old standalone bank-converter API
5. Add additional bank parsers as needed

## Files Modified/Created

### New Files
- `tools-suite/packages/backend/src/lib/fnb-parser.js`
- `tools-suite/packages/backend/src/routes/bank.js`
- `tools-suite/packages/backend/src/services/bank.js`
- `tools-suite/packages/backend/test-bank-integration.js`
- `tools-suite/BANK_CONVERTER_MIGRATION.md`

### Modified Files
- `tools-suite/packages/backend/package.json`
- `tools-suite/packages/backend/src/server.js`
- `tools-suite/apps/bank-converter-react/src/lib/api.js`

