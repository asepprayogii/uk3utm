import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { UIContext } from './uiContext'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const TOAST_STYLES = {
  success: { icon: CheckCircle2, cls: 'border-green-200 bg-green-50 text-green-800' },
  error: { icon: XCircle, cls: 'border-red-200 bg-red-50 text-red-800' },
  info: { icon: Info, cls: 'border-brand-200 bg-brand-50 text-brand-800' },
}

// Menyediakan notifikasi (toast) dan dialog konfirmasi ke seluruh aplikasi,
// menggantikan alert()/confirm() bawaan browser yang kaku.
export default function UIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const idRef = useRef(0)
  const resolverRef = useRef(null)

  const push = useCallback((type, message) => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3500)
  }, [])

  const toast = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolverRef.current = resolve
        setDialog({
          title: 'Yakin?',
          message: '',
          confirmLabel: 'Ya, lanjutkan',
          cancelLabel: 'Batal',
          tone: 'danger',
          ...options,
        })
      }),
    [],
  )

  function close(result) {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])

  return (
    <UIContext.Provider value={value}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 left-4 z-[200] flex flex-col items-center gap-2 sm:left-auto sm:items-end">
        {toasts.map((t) => {
          const { icon: Icon, cls } = TOAST_STYLES[t.type]
          return (
            <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex w-full max-w-sm animate-sheet-in items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lift ${cls}`}>
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>

      <Modal
        open={!!dialog}
        onClose={() => close(false)}
        size="sm"
        title={dialog?.title ?? ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              {dialog?.cancelLabel}
            </Button>
            <Button variant={dialog?.tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)}>
              {dialog?.confirmLabel}
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${dialog?.tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}>
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <div className="text-sm leading-relaxed text-ink-700">{dialog?.message}</div>
        </div>
      </Modal>
    </UIContext.Provider>
  )
}
