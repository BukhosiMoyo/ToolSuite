import { create } from 'zustand'

export const useBankStore = create((set, get) => ({
  // Files
  files: [],
  addFiles: (newFiles) => set((state) => ({
    files: [...state.files, ...newFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }))]
  })),
  removeFile: (id) => set((state) => ({
    files: state.files.filter(f => f.id !== id)
  })),
  clearFiles: () => set({ files: [] }),
  reorder: (fromIndex, toIndex) => set((state) => {
    const newFiles = [...state.files]
    const [moved] = newFiles.splice(fromIndex, 1)
    newFiles.splice(toIndex, 0, moved)
    return { files: newFiles }
  }),

  // Settings
  currency: 'ZAR',
  dateFormatHint: 'YYYY-MM-DD',
  bankHint: '',
  mergeMode: 'single',
  setOption: (key, value) => set({ [key]: value }),

  // Preview
  previewRows: [],
  warnings: [],
  setPreview: (rows, warnings) => set({ previewRows: rows, warnings: warnings || [] }),

  // UI State
  currentStep: 1,
  reorderMode: false,
  setStep: (step) => set({ currentStep: step }),
  setReorderMode: (mode) => set({ reorderMode: mode }),

  // Reset
  resetWizard: () => set({
    files: [],
    previewRows: [],
    warnings: [],
    currentStep: 1,
    reorderMode: false
  })
}))
