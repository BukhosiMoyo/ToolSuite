import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useBankStore } from '../../store/useBankStore'
import { UploadCloud, GripVertical, Trash2, FileText } from 'lucide-react'

export function Step1Upload() {
  const { files, addFiles, removeFile, clearFiles, reorder, reorderMode, setReorderMode } = useBankStore()

  const onDrop = useCallback((acceptedFiles) => {
    addFiles(acceptedFiles)
  }, [addFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/x-ofx': ['.ofx', '.qfx'],
      'text/plain': ['.txt', '.mt940']
    }
  })

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <UploadCloud className="size-6 opacity-80" />
        <div>
          <h2 className="text-xl font-semibold">Upload Bank Statements</h2>
          <p className="text-sm opacity-70">Select your bank statement files to convert</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <UploadCloud className="size-12 mx-auto mb-4 opacity-60" />
            <p className="text-lg font-medium mb-2">Drag & drop statements here</p>
            <p className="text-sm opacity-80 mb-1">or click to browse files</p>
            <p className="text-xs opacity-60">PDF, CSV, XLS/XLSX, OFX/QFX, MT940 · Max 50MB each</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className={`btn-subtle ${reorderMode ? 'btn-on' : ''}`} 
                  onClick={() => setReorderMode(!reorderMode)}
                >
                  <GripVertical className="size-4"/> Reorder
                </button>
                <button 
                  className="btn-danger" 
                  onClick={clearFiles}
                >
                  <Trash2 className="size-4"/> Clear all
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              {files.map((fileItem, index) => (
                <div key={fileItem.id} className="file-tile">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 opacity-60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.name}</p>
                      <p className="text-xs opacity-60">{formatFileSize(fileItem.size)}</p>
                    </div>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => removeFile(fileItem.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
