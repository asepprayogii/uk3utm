import { useEffect } from 'react'

// Kepala halaman admin yang seragam: judul, penjelasan singkat, dan satu tombol aksi utama.
export default function AdminPage({ title, description, action, children }) {
  useEffect(() => {
    document.title = `${title} — Admin UK3`
  }, [title])
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-brand-900">{title}</h1>
          {description && <p className="mt-1 max-w-xl text-sm text-ink-500">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
}

export function Card({ className = '', children }) {
  return <div className={`rounded-2xl border border-paper-300 bg-white ${className}`}>{children}</div>
}
