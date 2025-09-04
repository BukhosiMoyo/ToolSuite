import { format } from '@fast-csv/format'
import { parse } from '@fast-csv/parse'
import pdf from 'pdf-parse'
import path from 'path'
import fs from 'fs'
import { FNBParser } from '../lib/fnb-parser.js'

export async function previewBankFiles(files, options) {
  console.log('Bank preview service called:', { files: files?.length, options })
  
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }

  const file = files[0] // Process first file for preview
  const filePath = file.path
  const fileExt = path.extname(file.originalname).toLowerCase()
  
  console.log('Processing file for preview:', file.originalname, 'type:', fileExt)

  // Check if it's a supported file type
  if (!['.csv', '.pdf'].includes(fileExt)) {
    // Clean up uploaded file
    fs.unlinkSync(filePath)
    throw new Error(`File type ${fileExt} is not supported. Only CSV and PDF files are supported.`)
  }

  // Parse file based on type
  const rows = []
  const warnings = []
  
  if (fileExt === '.csv') {
    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ headers: true }))
        .on('data', (row) => {
          // Convert row to standard format
          const processedRow = {
            date: row.date || row.Date || row.DATE || '',
            description: row.description || row.Description || row.DESCRIPTION || row.narrative || row.Narrative || '',
            amount: parseFloat(row.amount || row.Amount || row.AMOUNT || row.debit || row.Debit || row.credit || row.Credit || 0),
            balance: parseFloat(row.balance || row.Balance || row.BALANCE || 0),
            card_reference: row.card_reference || row.Card_Reference || row.CARD_REFERENCE || '',
            fees: parseFloat(row.fees || row.Fees || row.FEES || 0),
            vat: parseFloat(row.vat || row.VAT || 0),
            category: row.category || row.Category || row.CATEGORY || '',
            transaction_type: row.transaction_type || row.Transaction_Type || row.TRANSACTION_TYPE || '',
            value_date: row.value_date || row.Value_Date || row.VALUE_DATE || '',
            bank_charges: parseFloat(row.bank_charges || row.Bank_Charges || row.BANK_CHARGES || 0)
          }
          rows.push(processedRow)
        })
        .on('end', () => {
          console.log(`Parsed ${rows.length} rows from CSV`)
          resolve()
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error)
          reject(new Error(`Failed to parse CSV file: ${error.message}`))
        })
    })
      } else if (fileExt === '.pdf') {
      // Use FNB-specific parser for PDF files
      try {
        const dataBuffer = fs.readFileSync(filePath)
        const pdfData = await pdf(dataBuffer)
        console.log('PDF text extracted:', pdfData.text.substring(0, 200) + '...')
        
        // Initialize FNB parser with toggles from options
        const toggles = {
          include_running_balance: options.include_running_balance,
          include_accrued_bank_charges: options.include_accrued_bank_charges,
          categorize: options.categorize,
          keep_card_ref: options.keep_card_ref,
          reveal_card_ref: options.reveal_card_ref,
          emit_vat: options.emit_vat,
          parse_value_date: options.parse_value_date,
          fail_on_balance_mismatch: options.fail_on_balance_mismatch,
          ocr: options.ocr
        }
        
        const fnbParser = new FNBParser(toggles)
        const result = await fnbParser.parsePDF(pdfData.text, file.originalname)
        
        // Convert FNB parser result to our expected format
        // Ensure all rows have the expected structure with additional columns
        const processedRows = result.rows.map(row => ({
          date: row.date || '',
          description: row.description || '',
          amount: row.amount || 0,
          balance: row.balance || 0,
          card_reference: row.card_reference || '',
          fees: row.fees || 0,
          vat: row.vat || 0,
          category: row.category || '',
          transaction_type: row.transaction_type || '',
          value_date: row.value_date || '',
          bank_charges: row.bank_charges || 0
        }))
        
        rows.push(...processedRows)
        warnings.push(...result.warnings)
        
        // Add meta information to warnings
        if (result.meta.account_number) {
          warnings.push(`Account: ${result.meta.account_number}`)
        }
        if (result.meta.period_start && result.meta.period_end) {
          warnings.push(`Period: ${result.meta.period_start} to ${result.meta.period_end}`)
        }
        if (result.meta.reconciled) {
          warnings.push('✅ Balance reconciliation passed')
        } else {
          warnings.push('⚠️ Balance reconciliation failed - please verify')
        }
        
        console.log(`FNB PDF parsed: ${rows.length} transactions, ${warnings.length} warnings`)
        
      } catch (error) {
        console.error('FNB PDF parsing error:', error)
        
        // If FNB parsing fails, try to provide a helpful error message
        if (error.message.includes('Could not find transaction section')) {
          warnings.push('⚠️ Could not parse PDF as FNB statement. Please ensure this is a valid FNB bank statement PDF.')
          warnings.push('💡 Tip: Try uploading a CSV file instead, or ensure the PDF contains transaction data.')
          
          // Return empty result instead of throwing error
          return {
            rows: [],
            warnings: warnings
          }
        }
        
        // If parsing fails but we have some data, try to extract basic info
        console.log('FNB parsing failed, attempting basic extraction...')
        const basicRows = this.extractBasicTransactions(pdfData.text)
        if (basicRows.length > 0) {
          warnings.push('⚠️ Used basic PDF extraction - some data may be missing')
          warnings.push(`📊 Extracted ${basicRows.length} basic transactions`)
          return {
            rows: basicRows,
            warnings: warnings
          }
        }
        
        throw new Error(`Failed to parse FNB PDF file: ${error.message}`)
      }
    }

  // Clean up uploaded file
  fs.unlinkSync(filePath)

  return {
    rows: rows,
    warnings: warnings.length > 0 ? warnings : ['File processed successfully']
  }
}

// Basic PDF text extraction for fallback
function extractBasicTransactions(pdfText) {
  const lines = pdfText.split('\n')
  const transactions = []
  
  // Look for lines that might contain transaction data
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Look for lines with dates and amounts
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+\w{3}|\d{1,2}-\d{1,2}-\d{4})/)
    const amountMatch = line.match(/([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(Cr)?\s*$/)
    
    if (dateMatch && amountMatch) {
      const date = dateMatch[1]
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
      const isCredit = !!amountMatch[2]
      const description = line.substring(dateMatch[0].length, line.lastIndexOf(amountMatch[0])).trim()
      
      transactions.push({
        date: formatBasicDate(date),
        description: description || 'Transaction',
        amount: amount * (isCredit ? 1 : -1),
        balance: 0
      })
    }
  }
  
  return transactions
}

function formatBasicDate(dateStr) {
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  } else if (dateStr.includes('-')) {
    const [day, month, year] = dateStr.split('-')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  } else if (dateStr.match(/^\d{1,2}\s+\w{3}/)) {
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
  
  return dateStr
}

export async function convertBankFiles(files, mergeMode, options) {
  console.log('Bank convert service called:', { files: files?.length, mergeMode, options })
  
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }

  const allRows = []
  
  // Process all uploaded files
  for (const file of files) {
    const fileExt = path.extname(file.originalname).toLowerCase()
    console.log('Processing file for conversion:', file.originalname, 'type:', fileExt)
    
    // Process CSV and PDF files
    if (!['.csv', '.pdf'].includes(fileExt)) {
      console.log(`Skipping unsupported file: ${file.originalname}`)
      // Clean up uploaded file
      fs.unlinkSync(file.path)
      continue
    }
    
    const fileRows = []
    
    if (fileExt === '.csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(file.path)
          .pipe(parse({ headers: true }))
          .on('data', (row) => {
            const processedRow = {
              date: row.date || row.Date || row.DATE || '',
              description: row.description || row.Description || row.DESCRIPTION || row.narrative || row.Narrative || '',
              amount: parseFloat(row.amount || row.Amount || row.AMOUNT || row.debit || row.Debit || row.credit || row.Credit || 0),
              balance: parseFloat(row.balance || row.Balance || row.BALANCE || 0),
              card_reference: row.card_reference || row.Card_Reference || row.CARD_REFERENCE || '',
              fees: parseFloat(row.fees || row.Fees || row.FEES || 0),
              vat: parseFloat(row.vat || row.VAT || 0),
              category: row.category || row.Category || row.CATEGORY || '',
              transaction_type: row.transaction_type || row.Transaction_Type || row.TRANSACTION_TYPE || '',
              value_date: row.value_date || row.Value_Date || row.VALUE_DATE || '',
              bank_charges: parseFloat(row.bank_charges || row.Bank_Charges || row.BANK_CHARGES || 0)
            }
            fileRows.push(processedRow)
          })
          .on('end', () => {
            allRows.push(...fileRows)
            resolve()
          })
          .on('error', (error) => {
            console.error(`Error processing CSV file ${file.originalname}:`, error)
            reject(new Error(`Failed to process CSV file ${file.originalname}: ${error.message}`))
          })
      })
    } else if (fileExt === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(file.path)
        const pdfData = await pdf(dataBuffer)
        console.log('PDF text extracted for conversion:', pdfData.text.substring(0, 200) + '...')
        
        // Use FNB parser for PDF conversion
        const toggles = {
          include_running_balance: options.include_running_balance,
          include_accrued_bank_charges: options.include_accrued_bank_charges,
          categorize: options.categorize,
          keep_card_ref: options.keep_card_ref,
          reveal_card_ref: options.reveal_card_ref,
          emit_vat: options.emit_vat,
          parse_value_date: options.parse_value_date,
          fail_on_balance_mismatch: options.fail_on_balance_mismatch,
          ocr: options.ocr
        }
        
        const fnbParser = new FNBParser(toggles)
        const result = await fnbParser.parsePDF(pdfData.text, file.originalname)
        
        // Convert FNB parser result to our expected format
        const processedRows = result.rows.map(row => ({
          date: row.date || '',
          description: row.description || '',
          amount: row.amount || 0,
          balance: row.balance || 0,
          card_reference: row.card_reference || '',
          fees: row.fees || 0,
          vat: row.vat || 0,
          category: row.category || '',
          transaction_type: row.transaction_type || '',
          value_date: row.value_date || '',
          bank_charges: row.bank_charges || 0
        }))
        
        fileRows.push(...processedRows)
        allRows.push(...fileRows)
        console.log(`FNB PDF converted: ${fileRows.length} transaction rows`)
        
      } catch (error) {
        console.error(`Error processing PDF file ${file.originalname}:`, error)
        throw new Error(`Failed to process PDF file ${file.originalname}: ${error.message}`)
      }
    }
    
    // Clean up uploaded file
    fs.unlinkSync(file.path)
  }

  // Convert to CSV format with all available columns
  const csvHeaders = [
    'date', 
    'description', 
    'amount', 
    'balance',
    'card_reference',
    'fees',
    'vat',
    'category',
    'transaction_type',
    'value_date',
    'bank_charges'
  ]
  
  const csvRows = [csvHeaders]
  allRows.forEach(row => {
    csvRows.push([
      row.date || '',
      row.description || '',
      row.amount?.toString() || '0',
      row.balance?.toString() || '0',
      row.card_reference || '',
      row.fees?.toString() || '0',
      row.vat?.toString() || '0',
      row.category || '',
      row.transaction_type || '',
      row.value_date || '',
      row.bank_charges?.toString() || '0'
    ])
  })

  const chunks = []
  const csv = format({ headers: false })

  return new Promise((resolve) => {
    csv.on('data', d => chunks.push(d))
    csv.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve({
        buffer,
        filename: mergeMode === 'single' ? 'bank-converted.csv' : 'bank-converted.zip',
        contentType: mergeMode === 'single' ? 'text/csv' : 'application/zip',
        metaJson: { 
          rows: allRows.length, 
          mergeMode,
          processedFiles: files.length,
          timestamp: new Date().toISOString()
        }
      })
    })
    
    csvRows.forEach(r => csv.write(r))
    csv.end()
  })
}
