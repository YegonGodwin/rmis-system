import { useState, useRef, useCallback } from 'react'
import { studiesService } from '../../services/studies.service'
import type { Study, StudyImageUpload } from '../../services/studies.service'

type Props = {
  study: Study
  onClose: () => void
  onSuccess: () => void
}

type PreviewImage = StudyImageUpload & {
  previewUrl: string
  fileName: string
  sizeKB: number
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 5

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const ImageUploadModal = ({ study, onClose, onSuccess }: Props) => {
  const [images, setImages] = useState<PreviewImage[]>([])
  const [seriesDescription, setSeriesDescription] = useState('Series 1')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError('')
    const fileArray = Array.from(files)
    const valid = fileArray.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a supported format (JPEG, PNG, WebP only)`)
        return false
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${f.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit`)
        return false
      }
      return true
    })

    const previews = await Promise.all(
      valid.map(async (file, idx) => {
        const dataUrl = await readFileAsDataURL(file)
        return {
          imageData: dataUrl,
          previewUrl: dataUrl,
          mimeType: file.type as PreviewImage['mimeType'],
          seriesDescription,
          seriesNumber: 1,
          instanceNumber: images.length + idx + 1,
          fileName: file.name,
          sizeKB: Math.round(file.size / 1024),
        }
      }),
    )

    setImages((prev) => [...prev, ...previews].slice(0, 20))
  }, [images.length, seriesDescription])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx).map((img, i) => ({ ...img, instanceNumber: i + 1 })))
  }

  const handleSubmit = async () => {
    if (images.length === 0) {
      setError('Please add at least one image before submitting.')
      return
    }
    try {
      setUploading(true)
      setError('')
      const payload: StudyImageUpload[] = images.map((img) => ({
        imageData: img.imageData,
        mimeType: img.mimeType,
        seriesDescription: seriesDescription || 'Series 1',
        seriesNumber: 1,
        instanceNumber: img.instanceNumber,
        notes: notes || undefined,
      }))
      await studiesService.uploadImages(study._id, payload, true)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Submit Scan Images</h3>
            <p className="mt-1 text-sm text-slate-500">
              {study.modality} {study.bodyPart} &mdash; {study.patient.fullName} &mdash;{' '}
              <span className="font-mono text-xs">{study.accessionNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Series info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Series Description</label>
              <input
                type="text"
                value={seriesDescription}
                onChange={(e) => setSeriesDescription(e.target.value)}
                placeholder="e.g. Axial T1, PA Chest"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Technician Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any relevant scan notes..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
              dragOver
                ? 'border-teal-500 bg-teal-50'
                : 'border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50'
            }`}
          >
            <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-slate-700">Drop images here or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP &mdash; up to {MAX_FILE_SIZE_MB}MB each &mdash; max 20 images</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Preview grid */}
          {images.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{images.length} image{images.length !== 1 ? 's' : ''} ready</p>
                <button
                  onClick={() => setImages([])}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <img
                      src={img.previewUrl}
                      alt={img.fileName}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                      <button
                        onClick={() => removeImage(idx)}
                        className="hidden rounded-full bg-red-600 p-1 text-white group-hover:flex"
                        title="Remove"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-[10px] text-white">
                      #{idx + 1} &bull; {img.sizeKB}KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 p-5">
          <p className="text-xs text-slate-500">
            Submitting will mark this study as <span className="font-semibold text-emerald-600">Completed</span> and notify the radiologist.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || images.length === 0}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit & Complete Study
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageUploadModal
