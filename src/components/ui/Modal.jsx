import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const WIDTHS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

// Di ponsel tampil sebagai bottom sheet (mudah dijangkau jempol), di desktop sebagai dialog di tengah.
export default function Modal({ open, onClose, title, description, size = 'md', footer, children, dismissible = true }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && dismissible && onClose?.()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, dismissible, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-950/60 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose?.()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-[92vh] w-full animate-sheet-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift outline-none sm:rounded-3xl ${WIDTHS[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-paper-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mr-2 shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-paper-100 hover:text-ink-900"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="flex flex-col-reverse gap-2 border-t border-paper-200 bg-paper-50 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}
