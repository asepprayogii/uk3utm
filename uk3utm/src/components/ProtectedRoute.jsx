import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loading } from './States'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Loading fullScreen />

  if (!user) return <Navigate to="/admin/login" replace />

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 px-6">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-gold-500">Akses ditolak</div>
          <p className="mb-6 text-sm text-cream/50">
            Role Anda ({profile?.role ?? 'tidak diketahui'}) tidak memiliki akses ke halaman ini.
          </p>
          <Link
            to="/admin"
            className="rounded-full border border-gold-500/40 px-5 py-2 text-xs text-gold-500 transition-colors hover:bg-gold-500/10"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return children
}
