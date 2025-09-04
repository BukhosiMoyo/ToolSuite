// Debug fee-only rows in the FNB PDF
import fs from 'fs'
import pdf from 'pdf-parse'

async function debugFees() {
  try {
    console.log('🔍 Debugging fee-only rows...')
    
    const dataBuffer = fs.readFileSync('apps/e5f6df60f779a59700c81ff21953d41f.pdf')
    const pdfData = await pdf(dataBuffer)
    
    const lines = pdfData.text.split('\n')
    
    console.log('📄 Looking for fee-only patterns (DD Mon + single number + balance):')
    lines.forEach((line, i) => {
      // Look for patterns like "14 Jul6.003,848.13Cr"
      if (line.match(/\d{1,2}\s*(Jul|Aug)\d+\.\d{2}\d+\.\d{2}Cr/)) {
        console.log(`Line ${i}: "${line}"`)
        
        // Test our regex patterns
        const dateMatch = line.match(/(\d{1,2})\s*(Jul|Aug)/)
        if (dateMatch) {
          console.log(`  Date match: "${dateMatch[0]}" (day: ${dateMatch[1]}, month: ${dateMatch[2]})`)
          
          // Extract the rest after the date
          const after = line.slice(dateMatch.index + dateMatch[0].length).trim()
          console.log(`  After date: "${after}"`)
          
          // Test number extraction
          const numbers = after.match(/\d+\.\d{2}/g)
          console.log(`  Numbers found: ${numbers}`)
          
          if (numbers && numbers.length === 2) {
            console.log(`  Fee: ${numbers[0]}, Balance: ${numbers[1]}`)
          }
        }
        console.log('---')
      }
    })
    
    console.log('\n📄 Testing our parsers on fee-only rows...')
    
    const pages = pdfData.text.split(/\f/g).map((t, i) => ({ pageNumber: i + 1, text: t }))
    
    try {
      const fnbAdapter = (await import('./packages/backend/src/services/bank/adapters/fnbPdf.js')).default
      const fnbResult = await fnbAdapter.tryParse(pages, { pdfData })
      
      console.log('FNB Parser Result:')
      console.log('- Total rows:', fnbResult.rows.length)
      
      // Look for fee-only rows in results
      const feeRows = fnbResult.rows.filter(row => 
        row.description === 'Bank Charge' || 
        (row.fee_amount && row.fee_amount > 0) ||
        (row.amount && row.amount < 0 && Math.abs(row.amount) < 10) // Small negative amounts likely fees
      )
      
      console.log('- Fee rows found:', feeRows.length)
      if (feeRows.length > 0) {
        console.log('- First 5 fee rows:')
        feeRows.slice(0, 5).forEach((row, i) => {
          console.log(`  ${i+1}. ${row.date} | ${row.description} | ${row.amount} | ${row.balance} | Fee: ${row.fee_amount}`)
        })
      }
      
    } catch (error) {
      console.error('FNB Parser Error:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugFees()
