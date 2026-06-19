import { useState, useRef } from "react"
import { XCircle } from "lucide-react"
import { Button } from "./Button"

interface ImageCropperModalProps {
  src: string
  fileName: string
  onClose: () => void
  onSave: (file: File, preview: string) => void
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",")
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

export function ImageCropperModal({ src, fileName, onClose, onSave }: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)
  const containerSize = 320

  const [dimensions, setDimensions] = useState({ width: 0, height: 0, dispW: 0, dispH: 0 })

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const w = img.naturalWidth
    const h = img.naturalHeight
    const ratio = w / h

    let dispW = containerSize
    let dispH = containerSize

    if (ratio > 1) {
      dispW = containerSize * ratio
    } else {
      dispH = containerSize / ratio
    }

    setDimensions({ width: w, height: h, dispW, dispH })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    const w = dimensions.dispW * zoom
    const h = dimensions.dispH * zoom
    const maxX = Math.max(0, (w - containerSize) / 2)
    const maxY = Math.max(0, (h - containerSize) / 2)

    setPan({
      x: Math.min(maxX, Math.max(-maxX, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    const w = dimensions.dispW * zoom
    const h = dimensions.dispH * zoom
    const maxX = Math.max(0, (w - containerSize) / 2)
    const maxY = Math.max(0, (h - containerSize) / 2)

    setPan({
      x: Math.min(maxX, Math.max(-maxX, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY)),
    })
  }

  const handleSave = () => {
    if (!imageRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = containerSize
    canvas.height = containerSize
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, containerSize, containerSize)

      const cx = containerSize / 2 + pan.x
      const cy = containerSize / 2 + pan.y
      const w = dimensions.dispW * zoom
      const h = dimensions.dispH * zoom

      ctx.drawImage(imageRef.current, cx - w / 2, cy - h / 2, w, h)

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9)
      const croppedFile = dataURLtoFile(croppedDataUrl, fileName)
      onSave(croppedFile, croppedDataUrl)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-surface-container-lowest border border-outline-variant/60 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between">
          <h3 className="text-title-md font-bold text-on-surface font-geist">Crop Image</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-5">
          <div
            style={{ width: containerSize, height: containerSize }}
            className="overflow-hidden relative rounded-xl border border-outline-variant/30 bg-surface-container-high cursor-move select-none touch-none shadow-inner animate-[fadeIn_0.2s_ease]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={src}
              alt="Crop target"
              onLoad={handleImageLoad}
              style={{
                width: dimensions.dispW * zoom,
                height: dimensions.dispH * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                maxWidth: "none",
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
            />
            <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none rounded-xl" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-white/50" />
              <div className="border-r border-white/50" />
              <div />
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-label-sm font-geist text-on-surface-variant">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => {
                const nextZoom = parseFloat(e.target.value)
                setZoom(nextZoom)

                const w = dimensions.dispW * nextZoom
                const h = dimensions.dispH * nextZoom
                const maxX = Math.max(0, (w - containerSize) / 2)
                const maxY = Math.max(0, (h - containerSize) / 2)

                setPan(prev => ({
                  x: Math.min(maxX, Math.max(-maxX, prev.x)),
                  y: Math.min(maxY, Math.max(-maxY, prev.y)),
                }))
              }}
              className="w-full accent-primary h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-outline-variant/15 flex items-center justify-end gap-3 bg-surface-container-low/30">
          <Button variant="outline" size="sm" onClick={onClose} className="px-4">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="px-4">
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  )
}
