import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Loading } from './States'
import { EmptyState } from './States'
import Button from './ui/Button'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Loading fullScreen />
  if (!user) return <Navigate to="/admin/login" replace />

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses ditolak"
        action={<Button to="/admin" variant="secondary">Kembali ke Dashboard</Button>}
      >
        Peran Anda ({profile?.role ?? 'tidak diketahui'}) tidak memiliki akses ke halaman ini.
      </EmptyState>
    )
  }
  return children
}
