import { useId } from 'react'

const CONTROL =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-paper-100 disabled:text-ink-400'

function controlClass(error, extra = '') {
  return `${CONTROL} ${error ? 'border-red-400 focus:border-red-500' : 'border-paper-300 focus:border-brand-500'} ${extra}`
}

function Wrapper({ id, label, hint, error, required, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  )
}

export function Input({ label, hint, error, className = '', wrapperClassName = '', icon: Icon, ...props }) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={props.required} className={wrapperClassName}>
      <div className="relative">
        {Icon && <Icon size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-300" />}
        <input id={id} className={controlClass(error, `${Icon ? 'pl-10' : ''} ${className}`)} {...props} />
      </div>
    </Wrapper>
  )
}

export function Textarea({ label, hint, error, className = '', wrapperClassName = '', rows = 4, ...props }) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={props.required} className={wrapperClassName}>
      <textarea id={id} rows={rows} className={controlClass(error, `resize-y ${className}`)} {...props} />
    </Wrapper>
  )
}

export function Select({ label, hint, error, className = '', wrapperClassName = '', children, ...props }) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={props.required} className={wrapperClassName}>
      <select id={id} className={controlClass(error, className)} {...props}>
        {children}
      </select>
    </Wrapper>
  )
}

/** Saklar on/off yang jelas, menggantikan checkbox kecil. */
export function Toggle({ checked, onChange, label, hint, disabled }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-paper-300 bg-white px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-semibold text-ink-900">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-brand-600' : 'bg-paper-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}
