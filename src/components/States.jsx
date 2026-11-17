import { AlertTriangle, Inbox } from 'lucide-react'

export function Loading({ label = 'Memuat...', fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-ink-400 ${fullScreen ? 'min-h-screen bg-paper-50' : 'py-20'}`}
    >
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-paper-300 border-t-brand-600" />
      <span className="text-xs font-medium tracking-wider uppercase">{label}</span>
    </div>
  )
}

export function ErrorState({ message = 'Data gagal dimuat.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center border border-brand-600 text-brand-600">
        <AlertTriangle size={22} />
      </div>
      <p className="max-w-xs text-sm text-ink-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="border border-ink-900 px-5 py-2 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-paper-50"
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center border border-paper-300 text-ink-400">
        <Icon size={26} aria-hidden="true" />
      </div>
      {title && <div className="display text-2xl text-ink-900">{title}</div>}
      {children && <p className="max-w-sm text-sm text-ink-500">{children}</p>}
      {action}
    </div>
  )
}
