import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import UIProvider from './context/UIProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AdminShell from './components/admin/AdminShell'
import { Loading } from './components/States'
import { ROLES } from './lib/adminNav'

// Halaman publik (ringan, dimuat langsung)
import Home from './pages/public/Home'
import Tentang from './pages/public/Tentang'
import Pengumuman from './pages/public/Pengumuman'
import Renungan from './pages/public/Renungan'
import RenunganDetail from './pages/public/RenunganDetail'
import PengumumanDetail from './pages/public/PengumumanDetail'
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
const ManageAbout = lazy(() => import('./pages/admin/ManageAbout'))
const ManageStudents = lazy(() => import('./pages/admin/ManageStudents'))
const ManageMentors = lazy(() => import('./pages/admin/ManageMentors'))
const ManageAccounts = lazy(() => import('./pages/admin/ManageAccounts'))

const { ALL, KONTEN, PENGUMUMAN, RENUNGAN, LAYANAN, PEMBINAAN, BPH } = ROLES

// Pindah halaman selalu mulai dari atas, bukan di posisi gulir halaman sebelumnya.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

const ADMIN_ROUTES = [
  { path: 'tentang', roles: KONTEN, Page: ManageAbout },
  { path: 'pengumuman', roles: PENGUMUMAN, Page: ManageAnnouncements },
  { path: 'renungan', roles: RENUNGAN, Page: ManageDevotionals },
  { path: 'kepengurusan', roles: KONTEN, Page: ManageCommittee },
  { path: 'layanan', roles: LAYANAN, Page: ManageServices },
  { path: 'galeri', roles: KONTEN, Page: ManageGallery },
  { path: 'tautan', roles: KONTEN, Page: ManageLinks },
  { path: 'sesi', roles: PEMBINAAN, Page: ManageSessions },
  { path: 'absensi/:sessionId', roles: PEMBINAAN, Page: ManageAttendance },
  { path: 'mahasiswa', roles: PEMBINAAN, Page: ManageStudents },
  { path: 'kakak-bimbing', roles: PEMBINAAN, Page: ManageMentors },
  { path: 'lokasi', roles: PEMBINAAN, Page: ManageLocations },
  { path: 'akun', roles: BPH, Page: ManageAccounts },
]

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <UIProvider>
          <Suspense fallback={<Loading fullScreen />}>
            <Routes>
              {/* Publik */}
              <Route path="/" element={<Home />} />
              <Route path="/tentang" element={<Tentang />} />
              <Route path="/pengumuman" element={<Pengumuman />} />
              <Route path="/pengumuman/:id" element={<PengumumanDetail />} />
              <Route path="/renungan" element={<Renungan />} />
              <Route path="/renungan/:id" element={<RenunganDetail />} />
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
