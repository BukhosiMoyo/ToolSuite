import pdf from 'pdf-parse'

export class FNBParser {
  constructor(toggles = {}) {
    this.toggles = {
      include_running_balance: true,
      include_accrued_bank_charges: true,
      categorize: true,
      keep_card_ref: true,
      reveal_card_ref: false,
      emit_vat: true,
      parse_value_date: true,
      fail_on_balance_mismatch: false,
      ocr: false,
      ...toggles
    }
  }

  async parsePDF(pdfText, filename = '') {
    try {
      console.log('FNB Parser: Starting PDF parsing...')
      console.log('FNB Parser: Toggles:', this.toggles)
      console.log('FNB Parser: PDF text length:', pdfText.length)
      console.log('FNB Parser: First 500 chars:', pdfText.substring(0, 500))
      
      // Extract account information
      const accountMatch = pdfText.match(/Account\s+Number\s*:?\s*(\d+)/i)
      const accountNumber = accountMatch ? accountMatch[1] : null
      
      // Extract period information
      const periodMatch = pdfText.match(/Statement\s+Period\s*:?\s*(\d{2}\/\d{2}\/\d{4})\s*to\s*(\d{2}\/\d{2}\/\d{4})/i)
      const periodStart = periodMatch ? periodMatch[1] : null
      const periodEnd = periodMatch ? periodMatch[2] : null
      
      // Extract opening balance
      const openingBalanceMatch = pdfText.match(/Opening\s+Balance\s*:?\s*R\s*([\d,]+\.?\d*)/i)
      const openingBalance = openingBalanceMatch ? parseFloat(openingBalanceMatch[1].replace(/,/g, '')) : 0
      
      // Extract closing balance
      const closingBalanceMatch = pdfText.match(/Closing\s+Balance\s*:?\s*R\s*([\d,]+\.?\d*)/i)
      const closingBalance = closingBalanceMatch ? parseFloat(closingBalanceMatch[1].replace(/,/g, '')) : 0
      
      // Parse transactions
      const transactions = this.parseTransactions(pdfText)
      
      // Calculate running balance and validate
      let currentBalance = openingBalance
      const processedTransactions = []
      const warnings = []
      
      for (const transaction of transactions) {
        if (this.toggles.include_running_balance) {
          currentBalance += transaction.amount
          transaction.balance = currentBalance
        }
        
        processedTransactions.push(transaction)
      }
      
      // Validate balance reconciliation
      const reconciled = Math.abs(currentBalance - closingBalance) < 0.01
      if (!reconciled && this.toggles.fail_on_balance_mismatch) {
        throw new Error(`Balance reconciliation failed. Expected: R${closingBalance}, Calculated: R${currentBalance}`)
      }
      
      if (!reconciled) {
        warnings.push(`Balance reconciliation warning: Expected R${closingBalance}, Calculated R${currentBalance}`)
      }
      
      console.log(`FNB Parser: Parsed ${processedTransactions.length} transactions`)
      
      // Add debugging info to warnings if no transactions found
      if (processedTransactions.length === 0) {
        warnings.push('⚠️ No transactions found in PDF. This might not be a standard FNB bank statement format.')
        warnings.push('📄 PDF text preview: ' + pdfText.substring(0, 500) + '...')
      }
      
      return {
        rows: processedTransactions,
        warnings,
        meta: {
          account_number: accountNumber,
          period_start: periodStart,
          period_end: periodEnd,
          opening_balance: openingBalance,
          closing_balance: closingBalance,
          reconciled
        }
      }
      
    } catch (error) {
      console.error('FNB Parser Error:', error)
      throw new Error(`Failed to parse FNB PDF: ${error.message}`)
    }
  }
  
  parseTransactions(pdfText) {
    const transactions = []
    
    // Split text into lines and find transaction section
    const lines = pdfText.split('\n')
    let inTransactionSection = false
    let transactionStartIndex = -1
    
    // Find the start of transaction data with multiple patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Pattern 1: Standard header with Date, Description, Amount
      if (line.includes('Date') && line.includes('Description') && line.includes('Amount')) {
        inTransactionSection = true
        transactionStartIndex = i + 1
        break
      }
      
      // Pattern 2: Alternative header formats
      if (line.includes('Date') && (line.includes('Description') || line.includes('Narrative')) && (line.includes('Amount') || line.includes('Debit') || line.includes('Credit'))) {
        inTransactionSection = true
        transactionStartIndex = i + 1
        break
      }
      
      // Pattern 3: Look for "Transactions in RAND" or similar
      if (line.includes('Transactions in RAND') || line.includes('Transaction Details') || line.includes('Account Activity')) {
        inTransactionSection = true
        transactionStartIndex = i + 1
        break
      }
      
      // Pattern 4: Look for date patterns that might indicate start of transactions
      if (line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || line.match(/^\d{1,2}\s+\w{3}/)) {
        // Check if this looks like a transaction line
        if (line.includes('CARD') || line.includes('PURCHASE') || line.includes('TRANSFER') || line.includes('PAYMENT')) {
          inTransactionSection = true
          transactionStartIndex = i
          break
        }
      }
    }
    
    if (transactionStartIndex === -1) {
      // If we can't find a clear transaction section, try to find any date patterns
      console.log('Could not find clear transaction section, trying to parse any date patterns...')
      console.log('Available lines:', lines.slice(0, 20).map((line, i) => `${i}: ${line}`).join('\n'))
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || line.match(/^\d{1,2}\s+\w{3}/)) {
          console.log(`Found potential transaction line at ${i}: ${line}`)
          transactionStartIndex = i
          inTransactionSection = true
          break
        }
      }
    }
    
    if (transactionStartIndex === -1) {
      throw new Error('Could not find transaction section in PDF. Please ensure this is a valid FNB bank statement.')
    }
    
    // Parse transactions
    console.log(`Starting transaction parsing from line ${transactionStartIndex}`)
    for (let i = transactionStartIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) continue
      
      // Stop if we hit a summary section
      if (line.includes('Summary') || line.includes('Total') || line.includes('Balance')) {
        console.log(`Stopping at summary section: ${line}`)
        break
      }
      
      // Parse transaction line
      console.log(`Parsing line ${i}: ${line}`)
      const transaction = this.parseTransactionLine(line)
      if (transaction) {
        console.log(`Successfully parsed transaction:`, transaction)
        transactions.push(transaction)
      } else {
        console.log(`Failed to parse line as transaction: ${line}`)
      }
    }
    
    console.log(`Total transactions parsed: ${transactions.length}`)
    
    return transactions
  }
  
  parseTransactionLine(line) {
    try {
      // FNB transaction format: Date Description Amount
      // Example: "01/01/2024 CARD PURCHASE 123.45"
      
      console.log(`  Attempting to parse: "${line}"`)
      
      // Try different date patterns
      let dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/)
      if (!dateMatch) {
        // Try DD Mon format
        dateMatch = line.match(/^(\d{1,2}\s+\w{3})/)
      }
      if (!dateMatch) {
        // Try DD-MM-YYYY format
        dateMatch = line.match(/^(\d{1,2}-\d{1,2}-\d{4})/)
      }
      
      if (!dateMatch) {
        console.log(`  No date pattern found in: "${line}"`)
        return null
      }
      
      console.log(`  Found date: ${dateMatch[1]}`)
      
      const date = dateMatch[1]
      const remaining = line.substring(dateMatch[0].length).trim()
      console.log(`  Remaining after date: "${remaining}"`)
      
      // Extract amount (last number in the line, with optional Cr suffix)
      const amountMatch = remaining.match(/([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(Cr)?\s*$/)
      if (!amountMatch) {
        // Try simpler amount pattern
        console.log(`  Trying simpler amount pattern for: "${remaining}"`)
        const simpleAmountMatch = remaining.match(/([+-]?\d+\.?\d*)\s*(Cr)?\s*$/)
        if (!simpleAmountMatch) {
          console.log(`  No amount pattern found in: "${remaining}"`)
          return null
        }
        
        const amount = parseFloat(simpleAmountMatch[1])
        const isCredit = !!simpleAmountMatch[2]
        const description = remaining.substring(0, remaining.lastIndexOf(simpleAmountMatch[0])).trim()
        
        return {
          date: this.formatDate(date),
          description: this.cleanDescription(description),
          amount: amount * (isCredit ? 1 : -1),
          balance: 0 // Will be calculated later
        }
      }
      
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
      const isCredit = !!amountMatch[2]
      const description = remaining.substring(0, remaining.lastIndexOf(amountMatch[0])).trim()
      
      return {
        date: this.formatDate(date),
        description: this.cleanDescription(description),
        amount: amount * (isCredit ? 1 : -1),
        balance: 0 // Will be calculated later
      }
      
    } catch (error) {
      console.warn('Failed to parse transaction line:', line, error)
      return null
    }
  }
  
  formatDate(dateStr) {
    // Handle different date formats
    if (dateStr.includes('/')) {
      // DD/MM/YYYY format
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } else if (dateStr.includes('-')) {
      // DD-MM-YYYY format
      const [day, month, year] = dateStr.split('-')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } else if (dateStr.match(/^\d{1,2}\s+\w{3}/)) {
      // DD Mon format - assume current year
      const monthMap = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      }
      
      const match = dateStr.match(/^(\d{1,2})\s+(\w{3})/)
      if (match) {
        const day = match[1].padStart(2, '0')
        const month = monthMap[match[2].toLowerCase()]
        if (month) {
          const year = new Date().getFullYear()
          return `${year}-${month}-${day}`
        }
      }
    }
    
    // Return as-is if we can't parse it
    return dateStr
  }
  
  cleanDescription(description) {
    // Clean up description text
    return description
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100) // Limit length
  }
}
