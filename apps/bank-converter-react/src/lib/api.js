const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4000'

export async function fetchPreview({ 
  files, 
  currency, 
  dateFormatHint, 
  bankHint,
  columns,
  toggles
}) {
  console.log('API_BASE:', API_BASE)
  console.log('fetchPreview called with:', { 
    files: files?.length, 
    currency, 
    dateFormatHint, 
    bankHint,
    toggles
  })
  
  const formData = new FormData()
  
  files.forEach(fileItem => {
    formData.append('files[]', fileItem.file)
  })
  
  formData.append('currency', currency)
  formData.append('date_format_hint', dateFormatHint)
  formData.append('bank_hint', bankHint)
  
  if (Array.isArray(columns) && columns.length) {
    formData.append('columns', JSON.stringify(columns))
  }
  if (toggles) {
    formData.append('toggles', JSON.stringify(toggles))
  }

  const url = `${API_BASE}/v1/bank/preview`
  console.log('Making request to:', url)
  
  // Unified date format field used by backend
  formData.append('date_format', dateFormatHint || 'YYYY-MM-DD')
  
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
  columns,
  toggles
}) {
  const formData = new FormData()
  
  files.forEach(fileItem => {
    formData.append('files[]', fileItem.file)
  })
  
  formData.append('currency', currency)
  formData.append('date_format_hint', dateFormatHint)
  formData.append('bank_hint', bankHint)
  
  if (Array.isArray(columns) && columns.length) {
    formData.append('columns', JSON.stringify(columns))
  }
  if (toggles) {
    formData.append('toggles', JSON.stringify(toggles))
  }

  // Unified date format field used by backend
  formData.append('date_format', dateFormatHint || 'YYYY-MM-DD')
  
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
