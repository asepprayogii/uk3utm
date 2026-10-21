import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { ADMIN_GROUPS, ROLE_LABEL } from '../../lib/adminNav'
import { Brand } from '../Logo'

function SidebarContent({ role, email, onNavigate, onLogout }) {
  return (
    <div className="hero-bg flex h-full flex-col text-white">
      <div className="px-5 pt-6 pb-4">
        <Link to="/admin" onClick={onNavigate}><Brand light showTagline={false} /></Link>
        <div className="mt-3 text-[11px] font-semibold tracking-widest text-gold-400 uppercase">Panel Pengurus</div>
      </div>

      <nav aria-label="Menu admin" className="flex-1 overflow-y-auto px-3 pb-4">
        {ADMIN_GROUPS.map((g) => {
          const items = g.items.filter((i) => i.roles.includes(role))
          if (items.length === 0) return null
          return (
            <div key={g.label} className="mt-4">
              <div className="px-3 pb-1.5 text-[11px] font-bold tracking-widest text-white/40 uppercase">{g.label}</div>
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} aria-hidden="true" /> {label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 min-w-0">
          <div className="truncate text-sm font-semibold">{email}</div>
          <div className="text-xs text-gold-400">{ROLE_LABEL[role] ?? role}</div>
        </div>
        <div className="flex gap-2">
          <Link to="/" target="_blank" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 py-2 text-xs font-semibold hover:bg-white/10">
            <ExternalLink size={13} /> Lihat situs
          </Link>
          <button type="button" onClick={onLogout} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 py-2 text-xs font-semibold hover:bg-white/10">
            <LogOut size={13} /> Keluar
          </button>
        </div>
      </div>
    </div>
  )
}

// Kerangka semua halaman admin: sidebar (laci di ponsel) + area konten.
export default function AdminShell() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const role = profile?.role

  async function logout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarContent role={role} email={user?.email} onLogout={logout} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-paper-300 bg-white px-4 lg:hidden">
        <Brand size={32} showTagline={false} />
        <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu admin" className="rounded-lg p-2 text-ink-900 hover:bg-paper-100">
          <Menu size={22} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <SidebarContent role={role} email={user?.email} onNavigate={() => setOpen(false)} onLogout={logout} />
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="absolute top-4 right-3 rounded-lg p-1.5 text-white/70 hover:bg-white/10"><X size={20} /></button>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
