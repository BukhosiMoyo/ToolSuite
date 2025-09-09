import React, { useState } from 'react'
import { useBankStore } from '../../store/useBankStore'
import { downloadConvert } from '../../lib/api'
import { Download, Loader2, CheckCircle, FileSpreadsheet, Archive, AlertTriangle } from 'lucide-react'

export function Step4Export() {
  const { files, previewRows, mergeMode, setOption } = useBankStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleDownload = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const state = useBankStore.getState()
      const { blob, filename } = await downloadConvert({ 
        files, 
        mergeMode, 
        currency: state.currency, 
        dateFormatHint: state.dateFormatHint, 
        bankHint: state.bankHint,
        columns: state.columns,
        toggles: state.toggles
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      
      setSuccess(`Successfully downloaded ${filename}`)
    } catch (e) {
      setError(e.message || 'Download failed')
    } finally {
      setLoading(false)
    }
  }

  const hasData = previewRows && previewRows.length > 0
  const canExport = hasData && files.length > 0

  return (
    <div className="step-content">
      <div className="step-header">
        <Download className="size-6 opacity-80" />
        <div>
          <h2 className="text-xl font-semibold">Export Results</h2>
          <p className="text-sm opacity-70">Download your converted bank statement data</p>
        </div>
      </div>

      <div className="grid gap-6">
        {hasData ? (
          <div className="export-summary">
            <div className="summary-card">
              <h3 className="text-lg font-medium mb-4">Export Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="summary-item">
                  <span className="summary-label">Transactions</span>
                  <span className="summary-value">{previewRows.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Source Files</span>
                  <span className="summary-value">{files.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Currency</span>
                  <span className="summary-value">{useBankStore.getState().currency}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Format</span>
                  <span className="summary-value">{mergeMode === 'single' ? 'Single CSV' : 'ZIP Archive'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="export-placeholder">
            <FileSpreadsheet className="size-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium mb-2">No data to export</p>
            <p className="text-sm opacity-70">
              Please go back to the preview step and generate a preview first
            </p>
          </div>
        )}

        <div className="export-options">
          <h3 className="text-lg font-medium mb-4">Export Options</h3>
          
          <div className="option-group">
            <label className="option-label">
              <input
                type="radio"
                name="exportFormat"
                value="single"
                checked={mergeMode === 'single'}
                onChange={(e) => setOption('mergeMode', e.target.value)}
                className="option-radio"
              />
              <div className="option-content">
                <div className="option-header">
                  <FileSpreadsheet className="size-5" />
                  <span className="option-title">Single CSV File</span>
                </div>
                <p className="option-description">
                  All transactions from all files merged into one CSV file
                </p>
              </div>
            </label>

            <label className="option-label">
              <input
                type="radio"
                name="exportFormat"
                value="zip"
                checked={mergeMode === 'zip'}
                onChange={(e) => setOption('mergeMode', e.target.value)}
                className="option-radio"
              />
              <div className="option-content">
                <div className="option-header">
                  <Archive className="size-5" />
                  <span className="option-title">ZIP Archive</span>
                </div>
                <p className="option-description">
                  Separate CSV file for each source file, packaged in a ZIP archive
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="export-actions">
          <button 
            className="btn-primary btn-large" 
            onClick={handleDownload} 
            disabled={!canExport || loading}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Download className="size-5" />
            )}
            {loading ? 'Preparing Download...' : 'Download Converted Data'}
          </button>
        </div>

        {error && (
          <div className="alert-error">
            <AlertTriangle className="size-4" />
            <div>
              <strong>Export Error:</strong> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="alert-success">
            <CheckCircle className="size-4" />
            <div>
              <strong>Success:</strong> {success}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
