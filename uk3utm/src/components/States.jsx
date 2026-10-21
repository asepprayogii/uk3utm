import { AlertTriangle, Inbox } from 'lucide-react'

export function Loading({ label = 'Memuat...', fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-ink-400 ${fullScreen ? 'min-h-screen bg-paper-50' : 'py-20'}`}
    >
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
      <span className="text-xs font-medium tracking-wider uppercase">{label}</span>
    </div>
  )
}

export function ErrorState({ message = 'Data gagal dimuat.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle size={22} />
      </div>
      <p className="max-w-xs text-sm text-ink-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-brand-200 bg-white px-5 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-400">
        <Icon size={26} aria-hidden="true" />
      </div>
      {title && <div className="text-base font-bold text-ink-900">{title}</div>}
      {children && <p className="max-w-sm text-sm text-ink-500">{children}</p>}
      {action}
    </div>
  )
}
