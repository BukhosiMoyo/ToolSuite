import { format } from '@fast-csv/format'
import fs from 'fs'
import path from 'path'
import { FNBParser } from '../../lib/fnb-parser.js'

export async function previewBankFiles(files, opts) {
  console.log('Preview request:', { files: files?.length, opts })
  
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }
  
  const allRows = []
  const allWarnings = []
  
  for (const file of files) {
    const fileExt = path.extname(file.originalname).toLowerCase()
    console.log(`Processing file: ${file.originalname} (${fileExt})`)
    
    if (fileExt === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(file.path)
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(dataBuffer)
        console.log('PDF text extracted:', pdfData.text.substring(0, 200) + '...')
        
        // Initialize FNB parser with toggles from options
        const toggles = {
          include_running_balance: opts.include_running_balance,
          include_accrued_bank_charges: opts.include_accrued_bank_charges,
          categorize: opts.categorize,
          keep_card_ref: opts.keep_card_ref,
          reveal_card_ref: opts.reveal_card_ref,
          emit_vat: opts.emit_vat,
          parse_value_date: opts.parse_value_date,
          fail_on_balance_mismatch: opts.fail_on_balance_mismatch,
          ocr: opts.ocr
        }
        
        const fnbParser = new FNBParser(toggles)
        const result = await fnbParser.parsePDF(pdfData.text, file.originalname)
        
        // Convert FNB parser result to our expected format
        allRows.push(...result.rows)
        allWarnings.push(...result.warnings)
        
        // Add meta information to warnings
        if (result.meta.account_number) {
          allWarnings.push(`Account: ${result.meta.account_number}`)
        }
        if (result.meta.period_start && result.meta.period_end) {
          allWarnings.push(`Period: ${result.meta.period_start} to ${result.meta.period_end}`)
        }
        if (result.meta.reconciled) {
          allWarnings.push('✅ Balance reconciliation passed')
        } else {
          allWarnings.push('⚠️ Balance reconciliation failed - please verify')
        }
        
        console.log(`FNB PDF parsed: ${result.rows.length} transactions, ${result.warnings.length} warnings`)
        
      } catch (error) {
        console.error('FNB PDF parsing error:', error)
        allWarnings.push(`Error processing ${file.originalname}: ${error.message}`)
      }
    } else {
      allWarnings.push(`Unsupported file type: ${fileExt}. Only PDF files are currently supported.`)
    }
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path)
    } catch (cleanupError) {
      console.warn('Failed to clean up file:', cleanupError)
    }
  }
  
  return { 
    rows: allRows, 
    warnings: allWarnings 
  }
}

export async function convertBankFiles(files, mergeMode, opts) {
  console.log('Convert request:', { files: files?.length, mergeMode, opts })
  
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }
  
  const allRows = []
  
  for (const file of files) {
    const fileExt = path.extname(file.originalname).toLowerCase()
    console.log(`Processing file for conversion: ${file.originalname} (${fileExt})`)
    
    if (fileExt === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(file.path)
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(dataBuffer)
        console.log('PDF text extracted for conversion:', pdfData.text.substring(0, 200) + '...')
        
        // Use FNB parser for PDF conversion
        const toggles = {
          include_running_balance: opts.include_running_balance,
          include_accrued_bank_charges: opts.include_accrued_bank_charges,
          categorize: opts.categorize,
          keep_card_ref: opts.keep_card_ref,
          reveal_card_ref: opts.reveal_card_ref,
          emit_vat: opts.emit_vat,
          parse_value_date: opts.parse_value_date,
          fail_on_balance_mismatch: opts.fail_on_balance_mismatch,
          ocr: opts.ocr
        }
        
        const fnbParser = new FNBParser(toggles)
        const result = await fnbParser.parsePDF(pdfData.text, file.originalname)
        
        // Convert FNB parser result to our expected format
        const processedRows = result.rows.map(row => ({
          date: row.date,
          description: row.description,
          amount: row.amount,
          balance: row.balance || 0
        }))
        
        allRows.push(...processedRows)
        console.log(`FNB PDF converted: ${processedRows.length} transaction rows`)
        
      } catch (error) {
        console.error(`Error processing PDF file ${file.originalname}:`, error)
        throw new Error(`Failed to process PDF file ${file.originalname}: ${error.message}`)
      }
    } else {
      throw new Error(`Unsupported file type: ${fileExt}. Only PDF files are currently supported.`)
    }
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path)
    } catch (cleanupError) {
      console.warn('Failed to clean up file:', cleanupError)
    }
  }
  
  // Convert to CSV format
  const csvRows = [['date', 'description', 'amount', 'balance']]
  allRows.forEach(row => {
    csvRows.push([row.date, row.description, row.amount.toString(), row.balance.toString()])
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
        metaJson: { rows: allRows.length, mergeMode }
      })
    })
    
    csvRows.forEach(r => csv.write(r))
    csv.end()
  })
}
