import { useState, useRef } from "react"
import { Upload, Trash2, Crop } from "lucide-react"
import { ImageCropperModal } from "./ImageCropperModal"
import { cn } from "../../lib/utils"

interface ImageUploadProps {
  preview: string | null
  shape: "circle" | "rect"
  label: string
  onChange: (file: File | null) => void
  onCrop?: (file: File, preview: string) => void
  accept?: string
  maxSizeBytes?: number
  className?: string
}

export function ImageUpload({
  preview,
  shape,
  label,
  onChange,
  onCrop,
  accept = "image/*",
  maxSizeBytes = 5 * 1024 * 1024,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [rawPreview, setRawPreview] = useState<string | null>(null)
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (file: File | null) => {
    setError(null)
    if (!file) return

    if (!file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setError("Only image files are allowed.")
      return
    }

    if (file.size > maxSizeBytes) {
      setError(`File size must be under ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`)
      return
    }

    setRawFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setRawPreview(base64)
      if (onCrop) {
        setCropModalSrc(base64)
      } else {
        onChange(file)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCropSave = (croppedFile: File, croppedPreview: string) => {
    setCropModalSrc(null)
    setRawFile(croppedFile)
    setRawPreview(croppedPreview)
    onChange(croppedFile)
  }

  const handleClear = () => {
    setRawFile(null)
    setRawPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
    onChange(null)
  }

  const displayPreview = preview || rawPreview

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-label-md font-geist font-medium text-on-surface">{label}</label>

      <div
        className={cn(
          "relative group cursor-pointer overflow-hidden border-2 border-dashed border-outline-variant/30 hover:border-primary/50 transition-colors bg-surface-container-lowest",
          shape === "circle"
            ? "w-24 h-24 rounded-full"
            : "w-full h-32 rounded-xl",
        )}
        onClick={() => inputRef.current?.click()}
      >
        {displayPreview ? (
          <>
            <img
              src={displayPreview}
              alt="Preview"
              className={cn(
                "w-full h-full object-cover",
                shape === "circle" && "rounded-full",
              )}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                className="p-1.5 bg-white/90 rounded-full text-surface hover:bg-white transition-colors"
                title="Change"
              >
                <Upload size={14} />
              </button>
              {onCrop && rawPreview && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCropModalSrc(rawPreview) }}
                  className="p-1.5 bg-white/90 rounded-full text-surface hover:bg-white transition-colors"
                  title="Crop"
                >
                  <Crop size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClear() }}
                className="p-1.5 bg-white/90 rounded-full text-error hover:bg-white transition-colors"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/50 group-hover:text-primary/60 transition-colors">
            <Upload size={shape === "circle" ? 20 : 24} />
            <span className="text-label-sm mt-1 font-geist">Upload</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
      />

      {error && (
        <p className="text-body-xs text-error font-inter">{error}</p>
      )}

      {cropModalSrc && rawFile && (
        <ImageCropperModal
          src={cropModalSrc}
          fileName={rawFile.name}
          onClose={() => setCropModalSrc(null)}
          onSave={handleCropSave}
        />
      )}
    </div>
  )
}
