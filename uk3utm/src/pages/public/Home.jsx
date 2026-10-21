import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { useAsyncData } from '../../hooks/useAsyncData'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const DEFAULT_ABOUT = 'Organisasi kemahasiswaan Kristen resmi Universitas Trunojoyo Madura.'
const INITIAL = { content: {}, announcements: [], devotionals: [], links: [] }

// Satu query yang gagal tidak boleh merusak seluruh beranda.
async function fetchHome() {
  const results = await Promise.allSettled([
    supabase.from('site_content').select('*'),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('devotionals').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('links').select('*').order('order_index'),
  ])

  const rows = results.map((r) => (r.status === 'fulfilled' && !r.value.error ? (r.value.data ?? []) : null))
  if (rows.every((r) => r === null)) throw new Error('Semua permintaan data beranda gagal.')

  const [contentRows, announcements, devotionals, links] = rows
  const content = Object.fromEntries((contentRows ?? []).map((row) => [row.key, row.value]))

  return { content, announcements: announcements ?? [], devotionals: devotionals ?? [], links: links ?? [] }
}

function SectionHeading({ eyebrow, title, className = '' }) {
  return (
    <div className={className}>
      <div className="mb-2 text-xs tracking-widest uppercase text-gold-500">{eyebrow}</div>
      <h2 className="font-display text-3xl font-bold">{title}</h2>
    </div>
  )
}

function SeeAll({ to }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm text-gold-500 hover:underline">
      Lihat semua <ArrowRight size={14} aria-hidden="true" />
    </Link>
  )
}

function Card({ to, children }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-gold-500/15 bg-navy-800 p-6 transition-colors hover:border-gold-500/40"
    >
      {children}
    </Link>
  )
}

export default function Home() {
  const { data, loading, error } = useAsyncData(fetchHome, INITIAL)
  const { content, announcements, devotionals, links } = data
  const missionItems = (content.mission ?? '')
    .split('\n')
    .map((m) => m.replace(/^[•-]\s*/, '').trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-navy-950 text-cream">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold-500/5 blur-3xl" />
            <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-gold-500/[0.03] blur-2xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <img
              src="/logo-uk3.png"
              alt="Logo UK3 UTM"
              width="96"
              height="96"
              className="mx-auto mb-6 h-24 w-24 object-contain"
            />
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/5 px-4 py-1.5 text-xs tracking-widest uppercase text-gold-500">
              ✦ Persekutuan Doa Revive
            </div>
            <h1 className="font-display mb-6 text-4xl leading-tight font-bold sm:text-5xl md:text-7xl">
              Unit Kegiatan
              <br />
              <span className="text-gold-500">Kerohanian</span>
              <br />
              Kristen
            </h1>

            {loading ? (
              <div className="mx-auto mb-10 h-14 max-w-xl animate-pulse rounded-lg bg-cream/5" aria-hidden="true" />
            ) : (
              <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-cream/60">
                {content.about ?? DEFAULT_ABOUT}
              </p>
            )}

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/pengumuman"
                className="rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
              >
                Lihat Pengumuman
              </Link>
              <Link
                to="/kepengurusan"
                className="rounded-full border border-gold-500/40 px-8 py-3 text-sm text-gold-500 transition-colors hover:bg-gold-500/10"
              >
                Kepengurusan
              </Link>
            </div>

            {error && (
              <p role="alert" className="mt-8 text-xs text-cream/40">
                Sebagian konten belum bisa dimuat. Coba muat ulang halaman.
              </p>
            )}
          </div>
        </section>

        {/* VISI & MISI */}
        {(content.vision || missionItems.length > 0) && (
          <section className="bg-navy-900 px-6 py-20">
            <div className="mx-auto max-w-4xl">
              <SectionHeading eyebrow="Fondasi Kami" title="Visi & Misi" className="mb-10 text-center" />
              <div className="grid gap-6 md:grid-cols-2">
                {content.vision && (
                  <div className="rounded-2xl border border-gold-500/20 bg-navy-800 p-7">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/20 text-xs text-gold-500">
                        ✦
                      </div>
                      <h3 className="text-xs font-medium tracking-widest uppercase text-gold-500">Visi</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-cream/80">{content.vision}</p>
                  </div>
                )}

                {missionItems.length > 0 && (
                  <div className="rounded-2xl border border-gold-500/20 bg-navy-800 p-7">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/20 text-xs text-gold-500">
                        ✦
                      </div>
                      <h3 className="text-xs font-medium tracking-widest uppercase text-gold-500">Misi</h3>
                    </div>
                    <ul className="flex flex-col gap-3">
                      {missionItems.map((m, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-cream/80">
                          <span className="mt-0.5 shrink-0 text-gold-500" aria-hidden="true">
                            •
                          </span>
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

        {/* PENGUMUMAN TERBARU */}
        {announcements.length > 0 && (
          <section className="px-6 py-20">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 flex items-end justify-between">
                <SectionHeading eyebrow="Terkini" title="Pengumuman" />
                <SeeAll to="/pengumuman" />
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {announcements.map((a) => (
                  <Card key={a.id} to="/pengumuman">
                    {a.image_url && (
                      <img src={a.image_url} alt="" loading="lazy" className="mb-4 h-40 w-full rounded-lg object-cover" />
                    )}
                    <div className="mb-2 text-xs text-gold-500">{formatDate(a.created_at)}</div>
                    <h3 className="mb-2 font-semibold">{a.title}</h3>
                    <p className="line-clamp-3 text-sm text-cream/50">{a.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RENUNGAN TERBARU */}
        {devotionals.length > 0 && (
          <section className="bg-navy-900 px-6 py-20">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 flex items-end justify-between">
                <SectionHeading eyebrow="Firman" title="Renungan" />
                <SeeAll to="/renungan" />
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {devotionals.map((d) => (
                  <Card key={d.id} to="/renungan">
                    {d.image_url && (
                      <img src={d.image_url} alt="" loading="lazy" className="mb-4 h-40 w-full rounded-lg object-cover" />
                    )}
                    {d.verse && <div className="mb-2 text-xs italic text-gold-500">“{d.verse}”</div>}
                    <h3 className="mb-2 font-semibold">{d.title}</h3>
                    <p className="line-clamp-3 text-sm text-cream/50">{d.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* LINK PENTING */}
        {links.length > 0 && (
          <section className="px-6 py-20">
            <div className="mx-auto max-w-lg text-center">
              <SectionHeading eyebrow="Hubungi Kami" title="Link Penting" className="mb-10" />
              <div className="flex flex-col gap-3">
                {links.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-gold-500/20 bg-navy-800 px-6 py-4 text-sm font-medium transition-colors hover:border-gold-500/50 hover:bg-gold-500/10"
                  >
                    <span>{l.label}</span>
                    <ExternalLink size={14} className="text-gold-500" aria-hidden="true" />
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
