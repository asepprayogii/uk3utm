import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email atau password salah.')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-[#080d17] flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 mb-4">
            <span className="text-[#C9A84C] text-xl font-bold" style={{fontFamily:'Cinzel,serif'}}>UK3</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F0E8]" style={{fontFamily:'Cinzel,serif'}}>Admin Panel</h1>
          <p className="text-[#F5F0E8]/40 text-sm mt-1">UK3 UTM — Masuk sebagai pengurus</p>
        </div>

        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-[#F5F0E8]/60 text-xs tracking-widest uppercase block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@utm.ac.id"
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-[#F5F0E8] text-sm placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
              />
            </div>

            <div>
              <label className="text-[#F5F0E8]/60 text-xs tracking-widest uppercase block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#0d1525] border border-[#C9A84C]/20 rounded-xl px-4 py-3 text-[#F5F0E8] text-sm placeholder-[#F5F0E8]/20 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] text-[#080d17] font-semibold py-3 rounded-xl hover:bg-[#D4B483] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-1"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#F5F0E8]/20 text-xs mt-6">
          Hanya pengurus yang memiliki akun yang bisa masuk.
        </p>
      </div>
    </div>
  )
}