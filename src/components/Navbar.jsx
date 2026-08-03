import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/pengumuman", label: "Pengumuman" },
    { to: "/renungan", label: "Renungan" },
    { to: "/kepengurusan", label: "Kepengurusan" },
    { to: "/album", label: "Album" },
    { to: "/layanan", label: "Layanan" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#080d17]/90 backdrop-blur border-b border-[#C9A84C]/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center border border-[#C9A84C]/40">
            <span className="text-[#C9A84C] text-xs font-bold">UK3</span>
          </div>
          <span className="text-[#F5F0E8] font-semibold text-sm tracking-wide">UK3 UTM</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`transition-colors ${location.pathname === l.to ? "text-[#C9A84C]" : "text-[#F5F0E8]/60 hover:text-[#C9A84C]"}`}>
              {l.label}
            </Link>
          ))}
          <Link to="/admin/login" className="px-4 py-1.5 border border-[#C9A84C]/40 text-[#C9A84C] rounded-full hover:bg-[#C9A84C]/10 transition-all text-xs">
            Admin
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-[#F5F0E8]/60">
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0d1525] border-t border-[#C9A84C]/10 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm text-[#F5F0E8]/60 hover:text-[#C9A84C] transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/admin/login" onClick={() => setOpen(false)} className="text-sm text-[#C9A84C]">
            Admin →
          </Link>
        </div>
      )}
    </nav>
  );
}
