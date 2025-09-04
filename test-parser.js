// Test our parsers with sample FNB bank statement data
import fnbAdapter from './packages/backend/src/services/bank/adapters/fnbPdf.js'
import genericAdapter from './packages/backend/src/services/bank/adapters/genericTable.js'

const sampleFNBText = `
FNB GOLD BUSINESS ACCOUNT
Account: 63150947746
Statement Period: July 2025

Transactions in RAND (ZAR)

14 Jul FNB App Transfer from John Doe 400.00Cr 1,654.13Cr
15 Jul POS Purchase at Shoprite 150.00 1,504.13Cr 2.50
16 Jul Send Money App Dr to Jane Smith 200.00 1,304.13Cr
17 Jul 6.00 1,298.13Cr
18 Jul Fuel Purchase at Shell 85.50 1,212.63Cr
19 Jul Prepaid Airtime Vodacom 50.00 1,162.63Cr
20 Jul Electricity Payment 300.00 862.63Cr
21 Jul Debit Order Netflix 15.99 846.64Cr
`

async function testParsers() {
  console.log('🧪 Testing FNB Parser with sample data...')
  
  const pages = [{ pageNumber: 1, text: sampleFNBText }]
  const pdfData = { text: sampleFNBText }
  
  try {
    const fnbResult = await fnbAdapter.tryParse(pages, { pdfData })
    console.log('FNB Parser Result:')
    console.log('- Rows found:', fnbResult.rows.length)
    console.log('- Warnings:', fnbResult.warnings)
    if (fnbResult.rows.length > 0) {
      console.log('- First row:', fnbResult.rows[0])
    }
  } catch (error) {
    console.error('FNB Parser Error:', error.message)
  }
  
  console.log('\n🧪 Testing Generic Parser with sample data...')
  
  try {
    const genericResult = await genericAdapter.tryParse(pages, { pdfData })
    console.log('Generic Parser Result:')
    console.log('- Rows found:', genericResult.rows.length)
    console.log('- Warnings:', genericResult.warnings)
    if (genericResult.rows.length > 0) {
      console.log('- First row:', genericResult.rows[0])
    }
  } catch (error) {
    console.error('Generic Parser Error:', error.message)
  }
}

testParsers()
