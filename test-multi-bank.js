// Quick test script for multi-bank parser
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testMultiBank() {
  try {
    console.log('🧪 Testing Multi-Bank Parser...\n');
    
    // Test with sample PDF
    const form = new FormData();
    form.append('files[]', fs.createReadStream('apps/CoR39_60007869111.pdf'));
    form.append('date_format', 'YYYY-MM-DD');
    
    console.log('📤 Sending request to http://localhost:4000/v1/bank/preview');
    const response = await fetch('http://localhost:4000/v1/bank/preview', {
      method: 'POST',
      body: form
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Response received!');
    console.log(`📊 Rows found: ${result.rows?.length || 0}`);
    console.log(`⚠️  Warnings: ${result.warnings?.length || 0}`);
    
    if (result.warnings?.length > 0) {
      console.log('\n📝 Warnings:');
      result.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
    
    if (result.rows?.length > 0) {
      console.log('\n📋 Sample transactions:');
      result.rows.slice(0, 3).forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.date} | ${row.description} | R${row.amount} | ${row.type || 'unknown'}`);
      });
    }
    
    console.log('\n🎉 Multi-bank parser test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMultiBank();
