#!/usr/bin/env node

/**
 * Simple test script to verify bank converter integration
 */

import { FNBParser } from './src/lib/fnb-parser.js'

console.log('🧪 Testing Bank Converter Integration...\n')

// Test 1: FNB Parser instantiation
console.log('1. Testing FNB Parser instantiation...')
try {
  const parser = new FNBParser({
    include_running_balance: true,
    categorize: true,
    fail_on_balance_mismatch: false
  })
  console.log('✅ FNB Parser created successfully')
  console.log('   Toggles:', parser.toggles)
} catch (error) {
  console.log('❌ FNB Parser creation failed:', error.message)
}

// Test 2: Sample PDF text parsing
console.log('\n2. Testing PDF text parsing...')
try {
  const samplePdfText = `
    FNB Bank Statement
    Account Number: 12345678
    Statement Period: 01 Jan 2024 to 31 Jan 2024
    Opening Balance: 1,000.00
    Closing Balance: 1,200.00
    
    Transactions in RAND (ZAR)
    Date Description Amount
    01 Jan CARD PURCHASE 123.45
    02 Jan FUEL PURCHASE 50.00
    03 Jan TRANSFER IN 200.00 Cr
  `
  
  const parser = new FNBParser()
  const result = await parser.parsePDF(samplePdfText, 'test-statement.pdf')
  
  console.log('✅ PDF parsing successful')
  console.log('   Transactions found:', result.rows.length)
  console.log('   Warnings:', result.warnings.length)
  console.log('   Account:', result.meta.account_number)
  console.log('   Reconciled:', result.meta.reconciled)
  
  if (result.rows.length > 0) {
    console.log('   Sample transaction:', result.rows[0])
  }
} catch (error) {
  console.log('❌ PDF parsing failed:', error.message)
}

// Test 3: Service imports
console.log('\n3. Testing service imports...')
try {
  const { previewBankFiles, convertBankFiles } = await import('./src/services/bank.js')
  console.log('✅ Bank services imported successfully')
  console.log('   previewBankFiles:', typeof previewBankFiles)
  console.log('   convertBankFiles:', typeof convertBankFiles)
} catch (error) {
  console.log('❌ Service import failed:', error.message)
}

// Test 4: Route imports
console.log('\n4. Testing route imports...')
try {
  const bankRouter = await import('./src/routes/bank.js')
  console.log('✅ Bank router imported successfully')
  console.log('   Router type:', typeof bankRouter.default)
} catch (error) {
  console.log('❌ Route import failed:', error.message)
}

console.log('\n🎉 Bank Converter Integration Test Complete!')
console.log('\nTo test the full integration:')
console.log('1. Start the backend server: npm run dev')
console.log('2. Start the frontend: cd ../../apps/bank-converter-react && npm run dev')
console.log('3. Open http://localhost:5175 and test file upload')

