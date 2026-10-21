import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { groupCommittee } from '../../lib/committee'
import { fetchPhotos } from '../../lib/gallery'
import { detectPlatform } from '../../lib/social'
import { PUBLIC_NAV } from '../../lib/nav'
import { useAsyncData } from '../../hooks/useAsyncData'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { LogoMark } from '../../components/Logo'
import SocialIcon from '../../components/SocialIcon'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'

const DEFAULT_ABOUT =
  'Wadah mahasiswa Kristen Universitas Trunojoyo Madura untuk bertumbuh bersama dalam iman, persekutuan, dan pelayanan.'
const INITIAL = { content: {}, announcements: [], devotionals: [], links: [], photos: [], committee: [] }
const QUICK = PUBLIC_NAV.filter((n) => n.to !== '/kepengurusan')

// Satu query yang gagal tidak boleh merusak seluruh beranda.
async function fetchHome() {
  const results = await Promise.allSettled([
    supabase.from('site_content').select('*'),
    supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
    supabase.from('devotionals').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('links').select('*').order('order_index'),
    fetchPhotos(8),
    supabase.from('committee').select('*').eq('department', 'BPH'),
  ])
  const rows = results.map((r) => {
    if (r.status !== 'fulfilled') return null
    if (Array.isArray(r.value)) return r.value
    return r.value.error ? null : (r.value.data ?? [])
  })
  if (rows.every((r) => r === null)) throw new Error('Semua permintaan data beranda gagal.')
  const [contentRows, announcements, devotionals, links, photos, committee] = rows
  return {
    content: Object.fromEntries((contentRows ?? []).map((row) => [row.key, row.value])),
    announcements: announcements ?? [],
    devotionals: devotionals ?? [],
    links: links ?? [],
    photos: photos ?? [],
    committee: committee ?? [],
  }
}

function Heading({ eyebrow, title, to, center = false }) {
  return (
    <div className={`mb-10 flex items-end justify-between gap-4 ${center ? 'flex-col items-center text-center' : ''}`}>
      <div>
        <div className="mb-2 text-xs font-bold tracking-[0.2em] text-gold-700 uppercase">{eyebrow}</div>
        <h2 className="font-display text-4xl font-bold text-brand-900">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          Lihat semua <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

export default function Home() {
  const { data, loading, error } = useAsyncData(fetchHome, INITIAL)
  const { content, announcements, devotionals, links, photos, committee } = data
  const missionItems = (content.mission ?? '').split('\n').map((m) => m.replace(/^[•-]\s*/, '').trim()).filter(Boolean)
  const bph = groupCommittee(committee).bph

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <Navbar />
      <main>
        {/* HERO */}
        <section className="hero-bg pattern-cross relative overflow-hidden px-6 pt-32 pb-24 text-white">
          <div className="relative mx-auto flex max-w-6xl flex-col-reverse items-center gap-12 lg:flex-row lg:justify-between">
            <div className="max-w-xl text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-gold-400 uppercase">
                ✦ Persekutuan Doa Revive
              </div>
              <h1 className="font-display text-5xl leading-[1.05] font-bold text-balance sm:text-6xl lg:text-7xl">
                Unit Kegiatan <span className="text-gold-400 italic">Kerohanian</span> Kristen
              </h1>
              {loading ? (
                <div className="mt-6 h-16 animate-pulse rounded-lg bg-white/10" aria-hidden="true" />
              ) : (
                <p className="mt-6 text-lg leading-relaxed text-white/75">{content.about ?? DEFAULT_ABOUT}</p>
              )}
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Button to="/pengumuman" variant="gold" size="lg" iconRight={ArrowRight}>Lihat Pengumuman</Button>
                <Button to="/kepengurusan" variant="light" size="lg">Kenali Pengurus</Button>
              </div>
              {error && <p role="alert" className="mt-6 text-xs text-white/50">Sebagian konten belum bisa dimuat. Coba muat ulang halaman.</p>}
            </div>

            <div className="relative shrink-0">
              <div className="absolute inset-0 -m-10 rounded-full bg-gold-400/20 blur-3xl" aria-hidden="true" />
              <LogoMark size={300} className="relative h-56 w-56 animate-float drop-shadow-2xl sm:h-72 sm:w-72 lg:h-80 lg:w-80" />
            </div>
          </div>
        </section>

        {/* AKSES CEPAT */}
        <section className="relative z-10 -mt-10 px-6" aria-label="Akses cepat">
          <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK.map(({ to, label, desc, icon: Icon }) => (
              <Link key={to} to={to} className="group flex items-center gap-4 rounded-2xl border border-paper-300 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-ink-900">{label}</span>
                  <span className="block text-xs text-ink-500">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* PENGUMUMAN */}
        {announcements.length > 0 && (
          <section className="px-6 pt-24">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Terkini" title="Pengumuman" to="/pengumuman" />
              <div className="grid gap-6 md:grid-cols-3">
                {announcements.map((a) => (
                  <Link key={a.id} to="/pengumuman" className="overflow-hidden rounded-2xl border border-paper-300 bg-white transition-shadow hover:shadow-lift">
                    {a.image_url ? (
                      <img src={a.image_url} alt="" loading="lazy" className="h-44 w-full object-cover" />
                    ) : (
                      <div className="hero-bg flex h-44 items-center justify-center"><LogoMark size={64} alt="" className="opacity-80" /></div>
                    )}
                    <div className="p-5">
                      <div className="mb-1 text-xs font-medium text-gold-700">{formatDate(a.created_at)}</div>
                      <h3 className="font-bold text-ink-900">{a.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">{excerpt(a.content, 110)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RENUNGAN */}
        {devotionals.length > 0 && (
          <section className="mt-24 bg-paper-100 px-6 py-24">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Firman" title="Renungan" to="/renungan" />
              <div className="grid gap-6 md:grid-cols-3">
                {devotionals.map((d) => (
                  <Link key={d.id} to="/renungan" className="rounded-2xl border border-paper-300 bg-white p-6 transition-shadow hover:shadow-lift">
                    {d.verse && <div className="mb-3 font-display text-xl leading-snug text-brand-700 italic">“{d.verse}”</div>}
                    <h3 className="font-bold text-ink-900">{d.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{excerpt(d.content, 110)}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* VISI MISI */}
        {(content.vision || missionItems.length > 0) && (
          <section className="hero-bg pattern-cross px-6 py-24 text-white">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <div className="mb-2 text-xs font-bold tracking-[0.2em] text-gold-400 uppercase">Fondasi Kami</div>
                <h2 className="font-display text-4xl font-bold">Visi & Misi</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {content.vision && (
                  <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur">
                    <h3 className="mb-3 text-xs font-bold tracking-widest text-gold-400 uppercase">Visi</h3>
                    <p className="font-display text-2xl leading-snug">{content.vision}</p>
                  </div>
                )}
                {missionItems.length > 0 && (
                  <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur">
                    <h3 className="mb-3 text-xs font-bold tracking-widest text-gold-400 uppercase">Misi</h3>
                    <ul className="flex flex-col gap-3">
                      {missionItems.map((m, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/85">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400 text-[11px] font-bold text-brand-950">{i + 1}</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* BPH */}
        {bph.length > 0 && (
          <section className="px-6 py-24">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Pengurus Harian" title="Kenali BPH" to="/kepengurusan" />
              <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                {bph.map((m) => (
                  <div key={m.id} className="flex w-44 flex-col items-center rounded-2xl border border-paper-300 bg-white p-5 text-center">
                    <Avatar name={m.name} src={m.photo_url} size="xl" />
                    <div className="mt-3 text-sm font-bold">{m.name}</div>
                    <div className="mt-0.5 text-xs font-semibold tracking-wide text-gold-700 uppercase">{m.position}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* GALERI */}
        {photos.length > 0 && (
          <section className="bg-paper-100 px-6 py-24">
            <div className="mx-auto max-w-6xl">
              <Heading eyebrow="Kebersamaan" title="Galeri" to="/galeri" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {photos.map((p) => (
                  <Link key={p.id} to="/galeri" className="group aspect-square overflow-hidden rounded-2xl bg-brand-900">
                    <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SOSMED */}
        {links.length > 0 && (
          <section className="px-6 py-24">
            <div className="mx-auto max-w-xl">
              <Heading center eyebrow="Terhubung" title="Ikuti & Hubungi Kami" />
              <div className="flex flex-col gap-3">
                {links.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-xl border border-paper-300 bg-white px-4 py-3.5 font-semibold transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-soft">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white"><SocialIcon platform={detectPlatform(l.url)} /></span>
                    <span className="flex-1">{l.label}</span>
                    <ExternalLink size={16} className="text-ink-300 group-hover:text-brand-700" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
