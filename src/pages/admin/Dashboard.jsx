import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    announcements: 0,
    devotionals: 0,
    committee: 0,
    sessions: 0,
    students: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [a, d, c, s, m] = await Promise.all([
        supabase.from("announcements").select("*", { count: "exact", head: true }),
        supabase.from("devotionals").select("*", { count: "exact", head: true }),
        supabase.from("committee").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }),
      ]);
      setStats((prev) => ({
        ...prev,
        announcements: a.count ?? 0,
        devotionals: d.count ?? 0,
        committee: c.count ?? 0,
        sessions: s.count ?? 0,
        students: m.count ?? 0,
      }));
    }
    fetchStats();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  const roleLabel = {
    bph: "BPH",
    infokom: "Infokom",
    pembinaan: "Pembinaan",
    viewer: "Viewer",
  };

  const menus = [
    {
      label: "Pengumuman",
      desc: "Kelola pengumuman yang tampil di website",
      path: "/admin/pengumuman",
      roles: ["bph", "infokom"],
      stat: stats.announcements,
      statLabel: "pengumuman",
    },
    {
      label: "Renungan",
      desc: "Kelola artikel renungan harian",
      path: "/admin/renungan",
      roles: ["bph", "infokom"],
      stat: stats.devotionals,
      statLabel: "renungan",
    },
    {
      label: "Kepengurusan",
      desc: "Kelola data pengurus dan struktur organisasi",
      path: "/admin/kepengurusan",
      roles: ["bph", "infokom"],
      stat: stats.committee,
      statLabel: "pengurus",
    },
    {
      label: "Layanan",
      desc: "Kelola layanan, CP WhatsApp, dan form untuk anggota",
      path: "/admin/layanan",
      roles: ["bph", "infokom"],
      stat: "",
      statLabel: "layanan",
    },
    {
      label: "Album Kegiatan",
      desc: "Upload dan kelola foto kegiatan UK3",
      path: "/admin/album",
      roles: ["bph", "infokom"],
      stat: "",
      statLabel: "album",
    },
    {
      label: "Sesi PD",
      desc: "Buat sesi Persekutuan Doa dan generate QR absensi",
      path: "/admin/sesi",
      roles: ["bph", "pembinaan"],
      stat: stats.sessions,
      statLabel: "sesi",
    },
    {
      label: "Data Mahasiswa",
      desc: "Upload dan kelola data mahasiswa serta kakak bimbing",
      path: "/admin/mahasiswa",
      roles: ["bph", "pembinaan"],
      stat: "",
      statLabel: "mahasiswa",
    },
    {
      label: "Lokasi PD",
      desc: "Kelola zona lokasi Persekutuan Doa dengan peta interaktif",
      path: "/admin/lokasi",
      roles: ["bph", "pembinaan"],
      stat: "",
      statLabel: "lokasi",
    },
  ];

  const accessibleMenus = menus.filter((m) => m.roles.includes(profile?.role));

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8]">
      {/* TOPBAR */}
      <div className="border-b border-[#C9A84C]/10 bg-[#0d1525]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center border border-[#C9A84C]/40">
              <span className="text-[#C9A84C] text-xs font-bold">UK3</span>
            </div>
            <div>
              <div className="text-sm font-semibold">Admin Panel</div>
              <div className="text-xs text-[#F5F0E8]/40">UK3 UTM</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{profile?.name ?? "Admin"}</div>
              <div className="text-xs text-[#C9A84C]">{roleLabel[profile?.role] ?? "Admin"}</div>
            </div>
            <button onClick={handleLogout} className="px-4 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
              Keluar
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Cinzel,serif" }}>
            Selamat datang, {profile?.name?.split(" ")[0] ?? "Admin"}
          </h1>
          <p className="text-[#F5F0E8]/40 text-sm">Kelola konten website dan absensi UK3 UTM dari sini.</p>
        </div>

        {/* Menu Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {accessibleMenus.map((menu) => (
            <Link key={menu.path} to={menu.path} className="group p-6 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] hover:border-[#C9A84C]/40 hover:bg-[#1a2438] transition-all">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-semibold text-lg group-hover:text-[#C9A84C] transition-colors">{menu.label}</h2>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#C9A84C]">{menu.stat}</div>
                  <div className="text-xs text-[#F5F0E8]/30">{menu.statLabel}</div>
                </div>
              </div>
              <p className="text-[#F5F0E8]/50 text-sm">{menu.desc}</p>
              <div className="mt-4 text-[#C9A84C] text-xs">Kelola →</div>
            </Link>
          ))}
        </div>

        {/* Link ke website publik */}
        <div className="mt-8 p-5 rounded-2xl border border-[#C9A84C]/10 bg-[#111827] flex justify-between items-center">
          <div>
            <div className="text-sm font-medium mb-1">Lihat Website Publik</div>
            <div className="text-xs text-[#F5F0E8]/40">Tampilan yang dilihat pengunjung</div>
          </div>
          <Link to="/" target="_blank" className="px-4 py-2 border border-[#C9A84C]/30 text-[#C9A84C] rounded-full text-xs hover:bg-[#C9A84C]/10 transition-all">
            Buka →
          </Link>
        </div>
      </div>
    </div>
  );
}
