#!/usr/bin/env node

// Quick test to verify bank convert is working with full columns
const fs = require('fs');
const path = require('path');

// Test the bank convert endpoint
async function testBankConvert() {
  try {
    console.log('Testing bank convert endpoint...');
    
    // Check if we have a test PDF file
    const testPdfPath = path.join(__dirname, 'test/data/05-versions-space.pdf');
    if (!fs.existsSync(testPdfPath)) {
      console.log('No test PDF found, skipping test');
      return;
    }
    
    const FormData = require('form-data');
    const form = new FormData();
    form.append('files[]', fs.createReadStream(testPdfPath));
    
    const response = await fetch('http://localhost:4000/v1/bank/convert?merge=single', {
      method: 'POST',
      body: form
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Check headers
    console.log('Response headers:');
    console.log('  X-Engine:', response.headers.get('X-Engine'));
    console.log('  Content-Type:', response.headers.get('Content-Type'));
    console.log('  Content-Disposition:', response.headers.get('Content-Disposition'));
    
    // Get conversion meta
    const metaHeader = response.headers.get('X-Conversion-Meta');
    if (metaHeader) {
      const meta = JSON.parse(Buffer.from(metaHeader, 'base64').toString());
      console.log('  Conversion Meta:', {
        row_count: meta.row_count,
        columns_count: meta.columns?.length,
        columns: meta.columns
      });
    }
    
    // Get CSV content
    const csvContent = await response.text();
    const lines = csvContent.split('\n');
    const header = lines[0];
    const columnCount = header.split(',').length;
    
    console.log('\nCSV Analysis:');
    console.log(`  Total lines: ${lines.length}`);
    console.log(`  Column count: ${columnCount}`);
    console.log(`  Header: ${header}`);
    
    if (columnCount >= 15) {
      console.log('✅ SUCCESS: CSV has full column set');
    } else {
      console.log('❌ ISSUE: CSV has limited columns');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testBankConvert();
}

module.exports = { testBankConvert };
