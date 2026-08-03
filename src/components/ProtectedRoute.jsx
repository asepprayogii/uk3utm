import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#080d17]">
      <div className="text-[#C9A84C] text-sm">Memuat...</div>
    </div>
  )

  if (!user) return <Navigate to="/admin/login" replace />

  // Temporary: log role untuk debug
  console.log('Profile:', profile)
  console.log('Role:', profile?.role)

  if (allowedRoles && !allowedRoles.includes(profile?.role)) return (
    <div className="min-h-screen flex items-center justify-center bg-[#080d17]">
      <div className="text-center">
        <div className="text-[#C9A84C] text-lg font-medium mb-2">Akses ditolak</div>
        <div className="text-[#F5F0E8]/50 text-sm">Role Anda ({profile?.role}) tidak memiliki akses ke halaman ini.</div>
      </div>
    </div>
  )

  return children
}