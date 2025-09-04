import React from 'react'
import { useBankStore } from '../store/useBankStore'
import { Step1Upload } from './steps/Step1Upload'
import { Step2Settings } from './steps/Step2Settings'
import { Step3Preview } from './steps/Step3Preview'
import { Step4Export } from './steps/Step4Export'
import { StepNavigation } from './StepNavigation'

export function Wizard() {
  const { currentStep, setStep } = useBankStore()

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Upload />
      case 2:
        return <Step2Settings />
      case 3:
        return <Step3Preview />
      case 4:
        return <Step4Export />
      default:
        return <Step1Upload />
    }
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <h1>Bank Statement Converter</h1>
        <p>Convert your bank statements to standardized CSV format</p>
      </div>
      
      <StepNavigation />
      
      <div className="wizard-content">
        {renderCurrentStep()}
      </div>
    </div>
  )
}
