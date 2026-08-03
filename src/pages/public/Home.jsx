import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";

export default function Home() {
  const [content, setContent] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [devotionals, setDevotionals] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [contentRes, annRes, devRes, linkRes] = await Promise.all([
        supabase.from("site_content").select("*"),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("devotionals").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("links").select("*").order("order_index"),
      ]);

      const contentMap = {};
      contentRes.data?.forEach((row) => {
        contentMap[row.key] = row.value;
      });
      setContent(contentMap);
      setAnnouncements(annRes.data ?? []);
      setDevotionals(devRes.data ?? []);
      setLinks(linkRes.data ?? []);
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080d17]">
        <div className="text-[#C9A84C] text-sm tracking-widest uppercase animate-pulse">Memuat...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#080d17] text-[#F5F0E8] font-[Outfit,sans-serif]">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#C9A84C]/3 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-xs tracking-widest uppercase mb-8">✦ Persekutuan Doa Revive</div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: "Cinzel,serif" }}>
            Unit Kegiatan
            <br />
            <span className="text-[#C9A84C]">Kerohanian</span>
            <br />
            Kristen
          </h1>
          <p className="text-[#F5F0E8]/60 text-lg max-w-xl mx-auto mb-10 leading-relaxed">{content.about ?? "Organisasi kemahasiswaan Kristen resmi Universitas Trunojoyo Madura."}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pengumuman" className="px-8 py-3 bg-[#C9A84C] text-[#080d17] font-semibold rounded-full hover:bg-[#D4B483] transition-all text-sm">
              Lihat Pengumuman
            </Link>
            <Link to="/kepengurusan" className="px-8 py-3 border border-[#C9A84C]/40 text-[#C9A84C] rounded-full hover:bg-[#C9A84C]/10 transition-all text-sm">
              Kepengurusan
            </Link>
          </div>
        </div>
      </section>

      {/* VISI MISI */}
      {/* VISI MISI */}
      <section className="py-20 px-6 bg-[#0d1525]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Fondasi Kami</div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "Cinzel,serif" }}>
              Visi &amp; Misi
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-7 rounded-2xl border border-[#C9A84C]/20 bg-[#111827]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                  <span className="text-[#C9A84C] text-xs">✦</span>
                </div>
                <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-medium">Visi</span>
              </div>
              <p className="text-[#F5F0E8]/80 leading-relaxed text-sm">{content.vision ?? ""}</p>
            </div>
            <div className="p-7 rounded-2xl border border-[#C9A84C]/20 bg-[#111827]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                  <span className="text-[#C9A84C] text-xs">✦</span>
                </div>
                <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-medium">Misi</span>
              </div>
              <div className="flex flex-col gap-3">
                {(content.mission ?? "")
                  .split("\n")
                  .filter(Boolean)
                  .map((m, i) => (
                    <div key={i} className="flex gap-3 text-sm text-[#F5F0E8]/80 leading-relaxed">
                      <span className="text-[#C9A84C] mt-0.5 flex-shrink-0">•</span>
                      <span>{m.replace(/^[•\-]\s*/, "")}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PENGUMUMAN TERBARU */}
      {announcements.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Terkini</div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "Cinzel,serif" }}>
                  Pengumuman
                </h2>
              </div>
              <Link to="/pengumuman" className="text-[#C9A84C] text-sm hover:underline">
                Lihat semua →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {announcements.map((a) => (
                <div key={a.id} className="p-6 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] hover:border-[#C9A84C]/40 transition-all">
                  {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover rounded-lg mb-4" />}
                  <div className="text-[#C9A84C] text-xs mb-2">{new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                  <h3 className="font-semibold mb-2">{a.title}</h3>
                  <p className="text-[#F5F0E8]/50 text-sm line-clamp-3">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RENUNGAN TERBARU */}
      {devotionals.length > 0 && (
        <section className="py-20 px-6 bg-[#0d1525]">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Firman</div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "Cinzel,serif" }}>
                  Renungan
                </h2>
              </div>
              <Link to="/renungan" className="text-[#C9A84C] text-sm hover:underline">
                Lihat semua →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {devotionals.map((d) => (
                <div key={d.id} className="p-6 rounded-2xl border border-[#C9A84C]/15 bg-[#111827] hover:border-[#C9A84C]/40 transition-all">
                  {d.image_url && <img src={d.image_url} alt={d.title} className="w-full h-40 object-cover rounded-lg mb-4" />}
                  {d.verse && <div className="text-[#C9A84C] text-xs italic mb-2">"{d.verse}"</div>}
                  <h3 className="font-semibold mb-2">{d.title}</h3>
                  <p className="text-[#F5F0E8]/50 text-sm line-clamp-3">{d.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LINKS */}
      {links.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Hubungi Kami</div>
            <h2 className="text-3xl font-bold mb-10" style={{ fontFamily: "Cinzel,serif" }}>
              Link Penting
            </h2>
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 px-6 rounded-2xl border border-[#C9A84C]/20 bg-[#111827] hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/50 transition-all text-sm font-medium"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-[#C9A84C]/10 text-center text-[#F5F0E8]/30 text-xs">© {new Date().getFullYear()} UK3 UTM — Unit Kegiatan Kerohanian Kristen Universitas Trunojoyo Madura</footer>
    </div>
  );
}
