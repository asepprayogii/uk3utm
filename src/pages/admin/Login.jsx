import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LogoMark } from '../../components/Logo'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'

export default function Login() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sudah masuk? Langsung ke dashboard.
  if (!authLoading && user) return <Navigate to="/admin" replace />

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) {
      setError('Email atau kata sandi salah. Periksa lagi, lalu coba kembali.')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="hero-bg pattern-cross relative hidden flex-col items-center justify-center p-12 text-center text-white lg:flex">
        <div className="absolute inset-0 m-auto h-96 w-96 rounded-full bg-gold-400/20 blur-3xl" aria-hidden="true" />
        <LogoMark size={260} className="relative drop-shadow-2xl" />
        <h2 className="relative mt-8 font-display text-5xl font-bold">UK3 UTM</h2>
        <p className="relative mt-3 max-w-sm text-white/70">Panel pengurus untuk mengelola website, kepengurusan, dan absensi persekutuan.</p>
      </aside>

      <main className="flex items-center justify-center bg-paper-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"><ArrowLeft size={15} /> Kembali ke situs</Link>
          <LogoMark size={56} className="mb-4 lg:hidden" />
          <h1 className="font-display text-4xl font-bold text-brand-900">Masuk Pengurus</h1>
          <p className="mt-1 mb-8 text-sm text-ink-500">Gunakan akun yang diberikan oleh BPH.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input label="Email" type="email" icon={Mail} required autoComplete="username" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="relative">
              <Input label="Kata sandi" type={show ? 'text' : 'password'} icon={Lock} required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-2 bottom-[7px] rounded-lg p-1.5 text-ink-400 hover:text-ink-900">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">Masuk</Button>
          </form>
          <p className="mt-6 text-center text-xs text-ink-400">Lupa kata sandi? Hubungi BPH atau Infokom.</p>
        </div>
      </main>
    </div>
  )
}
