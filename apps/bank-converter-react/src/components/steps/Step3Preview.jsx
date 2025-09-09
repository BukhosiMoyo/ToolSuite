import React, { useState } from 'react'
import { useBankStore } from '../../store/useBankStore'
import { fetchPreview } from '../../lib/api'
import { Eye, Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

export function Step3Preview() {
  const { files, previewRows, warnings, currency, dateFormatHint, bankHint, columns, toggles, setPreview } = useBankStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generatePreview = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await fetchPreview({ files, currency, dateFormatHint, bankHint, columns, toggles })
      setPreview(result.rows, result.warnings)
    } catch (e) {
      setError(e.message || 'Preview generation failed')
    } finally {
      setLoading(false)
    }
  }

  const hasPreview = previewRows && previewRows.length > 0
  const hasWarnings = warnings && warnings.length > 0

  return (
    <div className="step-content">
      <div className="step-header">
        <Eye className="size-6 opacity-80" />
        <div>
          <h2 className="text-xl font-semibold">Preview Data</h2>
          <p className="text-sm opacity-70">Review parsed transaction data before export</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="preview-controls">
          <div className="flex items-center gap-4">
            <button 
              className="btn-primary" 
              onClick={generatePreview} 
              disabled={loading || files.length === 0}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : hasPreview ? (
                <RefreshCw className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              {loading ? 'Generating Preview...' : hasPreview ? 'Refresh Preview' : 'Generate Preview'}
            </button>
            
            {files.length > 0 && (
              <div className="text-sm opacity-80">
                Processing {files.length} file{files.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <AlertTriangle className="size-4" />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {hasWarnings && (
          <div className="alert-warning">
            <AlertTriangle className="size-4" />
            <div>
              <strong>Warnings:</strong>
              <ul className="mt-2 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-sm">• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {hasPreview ? (
          <div className="preview-results">
            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-number">{previewRows.length}</span>
                <span className="stat-label">Transactions</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{files.length}</span>
                <span className="stat-label">Files Processed</span>
              </div>
              {hasWarnings && (
                <div className="stat-item warning">
                  <span className="stat-number">{warnings.length}</span>
                  <span className="stat-label">Warnings</span>
                </div>
              )}
            </div>
            
            <div className="preview-table">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Date
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Description
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Amount
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Balance
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Type
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {row.date || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate" title={row.description}>
                          {row.description || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (row.amount && parseFloat(row.amount) < 0) 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {row.amount ? `R ${Math.abs(parseFloat(row.amount)).toFixed(2)}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {row.balance ? `R ${parseFloat(row.balance).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {row.type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {row.type.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 10 && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Showing first 10 of {previewRows.length} transactions
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="preview-placeholder">
            <Eye className="size-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium mb-2">No preview yet</p>
            <p className="text-sm opacity-70">
              Click "Generate Preview" to process your uploaded files and see the parsed data
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
