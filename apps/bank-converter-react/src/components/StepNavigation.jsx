import React from 'react'
import { useBankStore } from '../store/useBankStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function StepNavigation() {
  const { currentStep, setStep, files, previewRows } = useBankStore()

  const steps = [
    { id: 1, title: 'Upload Files', icon: '📁' },
    { id: 2, title: 'Settings', icon: '⚙️' },
    { id: 3, title: 'Preview', icon: '👁️' },
    { id: 4, title: 'Export', icon: '💾' }
  ]

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return files.length > 0
      case 2: return true
      case 3: return previewRows.length > 0
      case 4: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (canGoNext() && currentStep < 4) {
      setStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1)
    }
  }

  return (
    <div className="step-navigation">
      <div className="step-indicators">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`step-indicator ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
          >
            <span className="step-icon">{step.icon}</span>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>
      
      <div className="step-controls">
        <button
          className="btn-secondary"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="size-4" />
          Previous
        </button>
        
        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={!canGoNext() || currentStep === 4}
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
