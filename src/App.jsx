import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/public/Home";
import Pengumuman from "./pages/public/Pengumuman";
import Renungan from "./pages/public/Renungan";
import Kepengurusan from "./pages/public/Kepengurusan";
import Layanan from "./pages/public/Layanan";
import Album from "./pages/public/Album";

// Absensi (no login)
import ScanAbsensi from "./pages/public/ScanAbsensi";

// Admin pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ManageAnnouncements from "./pages/admin/ManageAnnouncements";
import ManageDevotionals from "./pages/admin/ManageDevotionals";
import ManageCommittee from "./pages/admin/ManageCommittee";
import ManageSessions from "./pages/admin/ManageSessions";
import ManageAttendance from "./pages/admin/ManageAttendance";
import ManageLocations from "./pages/admin/ManageLocations";
import ManageServices from "./pages/admin/ManageServices";
import ManageAlbum from "./pages/admin/ManageAlbum";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageMentors from "./pages/admin/ManageMentors";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
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
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["bph", "infokom", "pembinaan"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pengumuman"
          element={
            <ProtectedRoute allowedRoles={["bph", "infokom"]}>
              <ManageAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/renungan"
          element={
            <ProtectedRoute allowedRoles={["bph", "infokom"]}>
              <ManageDevotionals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kepengurusan"
          element={
            <ProtectedRoute allowedRoles={["bph", "infokom"]}>
              <ManageCommittee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sesi"
          element={
            <ProtectedRoute allowedRoles={["bph", "pembinaan"]}>
              <ManageSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/absensi/:sessionId"
          element={
            <ProtectedRoute allowedRoles={["bph", "pembinaan"]}>
              <ManageAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mahasiswa"
          element={
            <ProtectedRoute allowedRoles={["bph", "pembinaan"]}>
              <ManageStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kakak-bimbing"
          element={
            <ProtectedRoute allowedRoles={["bph", "pembinaan"]}>
              <ManageMentors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lokasi"
          element={
            <ProtectedRoute allowedRoles={["bph", "pembinaan"]}>
              <ManageLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/layanan"
          element={
            <ProtectedRoute allowedRoles={["bph", "infokom"]}>
              <ManageServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/album"
          element={
            <ProtectedRoute allowedRoles={["bph", "infokom"]}>
              <ManageAlbum />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
