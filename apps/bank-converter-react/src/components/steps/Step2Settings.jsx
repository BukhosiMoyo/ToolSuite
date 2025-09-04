import React from 'react'
import { useBankStore } from '../../store/useBankStore'
import { Settings, Globe, Calendar, Building2 } from 'lucide-react'

export function Step2Settings() {
  const { currency, dateFormatHint, bankHint, setOption } = useBankStore()

  return (
    <div className="step-content">
      <div className="step-header">
        <Settings className="size-6 opacity-80" />
        <div>
          <h2 className="text-xl font-semibold">Configure Settings</h2>
          <p className="text-sm opacity-70">Set your preferences for data processing</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="settings-grid">
          <div className="setting-group">
            <div className="setting-label">
              <Globe className="size-4" />
              <span>Currency</span>
            </div>
            <select 
              className="select" 
              value={currency} 
              onChange={(e) => setOption('currency', e.target.value)}
            >
              <option value="ZAR">ZAR - South African Rand</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
            <p className="setting-description">
              Default currency for amounts without explicit currency
            </p>
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <Calendar className="size-4" />
              <span>Date Format</span>
            </div>
            <select 
              className="select" 
              value={dateFormatHint} 
              onChange={(e) => setOption('dateFormatHint', e.target.value)}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (European)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY (Alternative)</option>
            </select>
            <p className="setting-description">
              Expected date format in your bank statements
            </p>
          </div>

          <div className="setting-group">
            <div className="setting-label">
              <Building2 className="size-4" />
              <span>Bank Hint</span>
            </div>
            <input 
              className="input" 
              placeholder="e.g., fnb, absa, standard bank" 
              value={bankHint} 
              onChange={(e) => setOption('bankHint', e.target.value)}
            />
            <p className="setting-description">
              Optional: Bank name to help with parsing (case-insensitive)
            </p>
          </div>
        </div>

        <div className="settings-info">
          <div className="info-card">
            <h3 className="text-sm font-medium mb-2">🏦 Multi-Bank Support</h3>
            <div className="text-xs space-y-2 opacity-80">
              <p><strong>Supported Banks:</strong></p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">FNB</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Capitec</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Absa</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Standard Bank</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Nedbank</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Generic</span>
              </div>
              <p className="mt-2">The system automatically detects your bank and uses the appropriate parser. If your bank isn't specifically supported, it will fall back to a generic table parser that works with most bank statement formats.</p>
            </div>
          </div>
          
          <div className="info-card">
            <h3 className="text-sm font-medium mb-2">💡 Processing Tips</h3>
            <ul className="text-xs space-y-1 opacity-80">
              <li>• Currency setting applies to amounts without explicit currency symbols</li>
              <li>• Date format helps parse dates correctly from different bank formats</li>
              <li>• Bank hints improve parsing accuracy for specific bank statement formats</li>
              <li>• You can change these settings later if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
