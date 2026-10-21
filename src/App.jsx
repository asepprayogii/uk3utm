import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import UIProvider from './context/UIProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AdminShell from './components/admin/AdminShell'
import { Loading } from './components/States'
import { ROLES } from './lib/adminNav'

// Halaman publik (ringan, dimuat langsung)
import Home from './pages/public/Home'
import Pengumuman from './pages/public/Pengumuman'
import Renungan from './pages/public/Renungan'
import Kepengurusan from './pages/public/Kepengurusan'
import Layanan from './pages/public/Layanan'
import Galeri from './pages/public/Galeri'
import NotFound from './pages/public/NotFound'

// Dimuat on-demand supaya bundle awal pengunjung tetap kecil
const ScanAbsensi = lazy(() => import('./pages/public/ScanAbsensi'))
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ManageAnnouncements = lazy(() => import('./pages/admin/ManageAnnouncements'))
const ManageDevotionals = lazy(() => import('./pages/admin/ManageDevotionals'))
const ManageCommittee = lazy(() => import('./pages/admin/ManageCommittee'))
const ManageLinks = lazy(() => import('./pages/admin/ManageLinks'))
const ManageSessions = lazy(() => import('./pages/admin/ManageSessions'))
const ManageAttendance = lazy(() => import('./pages/admin/ManageAttendance'))
const ManageLocations = lazy(() => import('./pages/admin/ManageLocations'))
const ManageServices = lazy(() => import('./pages/admin/ManageServices'))
const ManageGallery = lazy(() => import('./pages/admin/ManageGallery'))
const ManageStudents = lazy(() => import('./pages/admin/ManageStudents'))
const ManageMentors = lazy(() => import('./pages/admin/ManageMentors'))

const { ALL, INFOKOM, PEMBINAAN } = ROLES

const ADMIN_ROUTES = [
  { path: 'pengumuman', roles: INFOKOM, Page: ManageAnnouncements },
  { path: 'renungan', roles: INFOKOM, Page: ManageDevotionals },
  { path: 'kepengurusan', roles: INFOKOM, Page: ManageCommittee },
  { path: 'layanan', roles: INFOKOM, Page: ManageServices },
  { path: 'galeri', roles: INFOKOM, Page: ManageGallery },
  { path: 'tautan', roles: INFOKOM, Page: ManageLinks },
  { path: 'sesi', roles: PEMBINAAN, Page: ManageSessions },
  { path: 'absensi/:sessionId', roles: PEMBINAAN, Page: ManageAttendance },
  { path: 'mahasiswa', roles: PEMBINAAN, Page: ManageStudents },
  { path: 'kakak-bimbing', roles: PEMBINAAN, Page: ManageMentors },
  { path: 'lokasi', roles: PEMBINAAN, Page: ManageLocations },
]

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <Suspense fallback={<Loading fullScreen />}>
            <Routes>
              {/* Publik */}
              <Route path="/" element={<Home />} />
              <Route path="/pengumuman" element={<Pengumuman />} />
              <Route path="/renungan" element={<Renungan />} />
              <Route path="/kepengurusan" element={<Kepengurusan />} />
              <Route path="/layanan" element={<Layanan />} />
              <Route path="/galeri" element={<Galeri />} />
              <Route path="/album" element={<Navigate to="/galeri" replace />} />

              {/* Absensi — tanpa login */}
              <Route path="/scan/:token" element={<ScanAbsensi />} />

              {/* Admin */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<ProtectedRoute><AdminShell /></ProtectedRoute>}>
                <Route index element={<ProtectedRoute allowedRoles={ALL}><Dashboard /></ProtectedRoute>} />
                {ADMIN_ROUTES.map(({ path, roles, Page }) => (
                  <Route key={path} path={path} element={<ProtectedRoute allowedRoles={roles}><Page /></ProtectedRoute>} />
                ))}
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
