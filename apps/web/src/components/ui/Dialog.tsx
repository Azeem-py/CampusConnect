import { type ReactNode, useEffect, useRef } from "react"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.15s ease-out" }}
    >
      <div
        className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/20 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
        style={{ animation: "fadeIn 0.2s ease-out" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
          <h2 className="text-headline-sm font-geist font-semibold text-on-surface">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
