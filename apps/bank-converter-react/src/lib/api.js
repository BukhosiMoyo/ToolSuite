const API_BASE = 'http://localhost:4000'

export async function fetchPreview({ 
  files, 
  currency, 
  dateFormatHint, 
  bankHint,
  include_running_balance,
  include_accrued_bank_charges,
  categorize,
  keep_card_ref,
  reveal_card_ref,
  emit_vat,
  parse_value_date,
  fail_on_balance_mismatch,
  ocr
}) {
  console.log('API_BASE:', API_BASE)
  console.log('fetchPreview called with:', { 
    files: files?.length, 
    currency, 
    dateFormatHint, 
    bankHint,
    toggles: {
      include_running_balance,
      include_accrued_bank_charges,
      categorize,
      keep_card_ref,
      reveal_card_ref,
      emit_vat,
      parse_value_date,
      fail_on_balance_mismatch,
      ocr
    }
  })
  
  const formData = new FormData()
  
  files.forEach(fileItem => {
    formData.append('files[]', fileItem.file)
  })
  
  formData.append('currency', currency)
  formData.append('date_format_hint', dateFormatHint)
  formData.append('bank_hint', bankHint)
  
  // Add FNB parser toggles
  formData.append('include_running_balance', include_running_balance)
  formData.append('include_accrued_bank_charges', include_accrued_bank_charges)
  formData.append('categorize', categorize)
  formData.append('keep_card_ref', keep_card_ref)
  formData.append('reveal_card_ref', reveal_card_ref)
  formData.append('emit_vat', emit_vat)
  formData.append('parse_value_date', parse_value_date)
  formData.append('fail_on_balance_mismatch', fail_on_balance_mismatch)
  formData.append('ocr', ocr)

  const url = `${API_BASE}/v1/bank/preview`
  console.log('Making request to:', url)
  
  // Add new multi-bank options
  formData.append('date_format', 'YYYY-MM-DD')
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Preview failed')
  }

  return response.json()
}

export async function downloadConvert({ 
  files, 
  mergeMode, 
  currency, 
  dateFormatHint, 
  bankHint,
  include_running_balance,
  include_accrued_bank_charges,
  categorize,
  keep_card_ref,
  reveal_card_ref,
  emit_vat,
  parse_value_date,
  fail_on_balance_mismatch,
  ocr
}) {
  const formData = new FormData()
  
  files.forEach(fileItem => {
    formData.append('files[]', fileItem.file)
  })
  
  formData.append('currency', currency)
  formData.append('date_format_hint', dateFormatHint)
  formData.append('bank_hint', bankHint)
  
  // Add FNB parser toggles
  formData.append('include_running_balance', include_running_balance)
  formData.append('include_accrued_bank_charges', include_accrued_bank_charges)
  formData.append('categorize', categorize)
  formData.append('keep_card_ref', keep_card_ref)
  formData.append('reveal_card_ref', reveal_card_ref)
  formData.append('emit_vat', emit_vat)
  formData.append('parse_value_date', parse_value_date)
  formData.append('fail_on_balance_mismatch', fail_on_balance_mismatch)
  formData.append('ocr', ocr)

  // Add new multi-bank options
  formData.append('date_format', 'YYYY-MM-DD')
  
  const response = await fetch(`${API_BASE}/v1/bank/convert?merge=${mergeMode}`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Conversion failed')
  }

  const blob = await response.blob()
  const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'bank-converted.csv'
  
  return { blob, filename }
}
