import { AlertTriangle } from 'lucide-react'

export function Loading({ label = 'Memuat...', fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-cream/40 ${
        fullScreen ? 'min-h-screen bg-navy-950' : 'py-20'
      }`}
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold-500/20 border-t-gold-500" />
      <span className="text-xs tracking-widest uppercase">{label}</span>
    </div>
  )
}

export function ErrorState({ message = 'Data gagal dimuat.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
        <AlertTriangle size={20} className="text-red-400" />
      </div>
      <p className="max-w-xs text-sm text-cream/50">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-gold-500/40 px-5 py-2 text-xs text-gold-500 transition-colors hover:bg-gold-500/10"
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}

export function EmptyState({ children }) {
  return <div className="py-20 text-center text-sm text-cream/30">{children}</div>
}
