import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import { Loading } from './components/States'

// Halaman publik (ringan, dimuat langsung)
import Home from './pages/public/Home'
import Pengumuman from './pages/public/Pengumuman'
import Renungan from './pages/public/Renungan'
import Kepengurusan from './pages/public/Kepengurusan'
import Layanan from './pages/public/Layanan'
import Album from './pages/public/Album'
import NotFound from './pages/public/NotFound'

// Dimuat on-demand supaya bundle awal pengunjung tetap kecil
const ScanAbsensi = lazy(() => import('./pages/public/ScanAbsensi'))
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ManageAnnouncements = lazy(() => import('./pages/admin/ManageAnnouncements'))
const ManageDevotionals = lazy(() => import('./pages/admin/ManageDevotionals'))
const ManageCommittee = lazy(() => import('./pages/admin/ManageCommittee'))
const ManageSessions = lazy(() => import('./pages/admin/ManageSessions'))
const ManageAttendance = lazy(() => import('./pages/admin/ManageAttendance'))
const ManageLocations = lazy(() => import('./pages/admin/ManageLocations'))
const ManageServices = lazy(() => import('./pages/admin/ManageServices'))
const ManageAlbum = lazy(() => import('./pages/admin/ManageAlbum'))
const ManageStudents = lazy(() => import('./pages/admin/ManageStudents'))
const ManageMentors = lazy(() => import('./pages/admin/ManageMentors'))

const ALL = ['bph', 'infokom', 'pembinaan']
const INFOKOM = ['bph', 'infokom']
const PEMBINAAN = ['bph', 'pembinaan']

const ADMIN_ROUTES = [
  { path: '/admin', roles: ALL, Page: Dashboard },
  { path: '/admin/pengumuman', roles: INFOKOM, Page: ManageAnnouncements },
  { path: '/admin/renungan', roles: INFOKOM, Page: ManageDevotionals },
  { path: '/admin/kepengurusan', roles: INFOKOM, Page: ManageCommittee },
  { path: '/admin/layanan', roles: INFOKOM, Page: ManageServices },
  { path: '/admin/album', roles: INFOKOM, Page: ManageAlbum },
  { path: '/admin/sesi', roles: PEMBINAAN, Page: ManageSessions },
  { path: '/admin/absensi/:sessionId', roles: PEMBINAAN, Page: ManageAttendance },
  { path: '/admin/mahasiswa', roles: PEMBINAAN, Page: ManageStudents },
  { path: '/admin/kakak-bimbing', roles: PEMBINAAN, Page: ManageMentors },
  { path: '/admin/lokasi', roles: PEMBINAAN, Page: ManageLocations },
]

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading fullScreen />}>
          <Routes>
            {/* Publik */}
            <Route path="/" element={<Home />} />
            <Route path="/pengumuman" element={<Pengumuman />} />
            <Route path="/renungan" element={<Renungan />} />
            <Route path="/kepengurusan" element={<Kepengurusan />} />
            <Route path="/layanan" element={<Layanan />} />
            <Route path="/album" element={<Album />} />

            {/* Absensi — tanpa login */}
            <Route path="/scan/:token" element={<ScanAbsensi />} />

            {/* Admin */}
            <Route path="/admin/login" element={<Login />} />
            {ADMIN_ROUTES.map(({ path, roles, Page }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute allowedRoles={roles}>
                    <Page />
                  </ProtectedRoute>
                }
              />
            ))}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
