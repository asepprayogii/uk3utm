import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { groupCommittee } from '../../lib/committee'
import { DEFAULT_ABOUT, fetchHomePhotos } from '../../lib/siteContent'
import { detectPlatform } from '../../lib/social'
import { PUBLIC_NAV } from '../../lib/nav'
import { useAsyncData } from '../../hooks/useAsyncData'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import FramedImage from '../../components/FramedImage'
import SocialIcon from '../../components/SocialIcon'
import MemberGrid from '../../components/committee/MemberCard'

const INITIAL = { content: {}, announcements: [], devotionals: [], links: [], photos: [], committee: [] }

// Satu query yang gagal tidak boleh merusak seluruh beranda.
async function fetchHome() {
  const results = await Promise.allSettled([
    supabase.from('site_content').select('*'),
    supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
    supabase.from('devotionals').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('links').select('*').order('order_index'),
    supabase.from('committee').select('*').eq('department', 'BPH'),
  ])
  const rows = results.map((r) => {
    if (r.status !== 'fulfilled') return null
    if (Array.isArray(r.value)) return r.value
    return r.value.error ? null : (r.value.data ?? [])
  })
  if (rows.every((r) => r === null)) throw new Error('Semua permintaan data beranda gagal.')
  const [contentRows, announcements, devotionals, links, committee] = rows
  const content = Object.fromEntries((contentRows ?? []).map((row) => [row.key, row.value]))
  const photos = await fetchHomePhotos(content).catch(() => [])
  return {
    content,
    announcements: announcements ?? [],
    devotionals: devotionals ?? [],
    links: links ?? [],
    photos,
    committee: committee ?? [],
  }
}

// Foto sampul landscape (3:2) bergantian dari galeri. Berhenti saat disorot kursor, dan tidak otomatis
// jalan bagi pengguna yang memilih mengurangi animasi. Foto ditampilkan penuh agar tidak terpotong.
function HeroPhotos({ photos }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = photos.length
  const current = count ? index % count : 0

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex((i) => i + 1), 5000)
    return () => clearInterval(id)
  }, [count, paused])

  if (count === 0) {
    return (
      <figure className="md:col-span-5">
        <FramedImage ratio="aspect-[3/2]" eager placeholder="Jemaat UK3 UTM bernyanyi bersama dalam ibadah. Ganti dengan foto asli." />
        <figcaption className="mt-2 border-t border-ink-900 pt-2 text-xs text-ink-500">Ibadah bersama UK3 UTM</figcaption>
      </figure>
    )
  }

  return (
    <figure
      className="md:col-span-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-paper-200">
        {photos.map((p, i) => (
          <img
            key={p.id}
            src={p.photo_url}
            alt={i === current ? p.caption || 'Foto kegiatan UK3 UTM' : ''}
            aria-hidden={i !== current}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <figcaption className="mt-2 flex items-start justify-between gap-4 border-t border-ink-900 pt-2 text-xs text-ink-500">
        <span aria-live="off" className="min-w-0">{photos[current].caption || 'Kegiatan UK3 UTM'}</span>
        {count > 1 && (
          <span className="flex shrink-0 items-center gap-1.5">
            {photos.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setIndex(i)} aria-label={`Tampilkan foto ${i + 1}`} aria-current={i === current} className="py-2">
                <span className={`block h-0.5 w-5 ${i === current ? 'bg-brand-600' : 'bg-paper-300'}`} />
              </button>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

function Section({ eyebrow, title, to, children, className = '' }) {
  return (
    <section className={`mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24 ${className}`}>
      <div className="mb-8 flex items-end justify-between gap-4 border-t border-ink-900 pt-4 sm:mb-12">
        <div>
          <div className="kicker mb-3">{eyebrow}</div>
          <h2 className="display text-4xl sm:text-6xl">{title}</h2>
        </div>
        {to && (
          <Link to={to} className="inline-flex shrink-0 items-center gap-1.5 pb-1 text-sm font-semibold underline underline-offset-4 hover:text-brand-600">
            Lihat semua <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export default function Home() {
  const { data, loading, error } = useAsyncData(fetchHome, INITIAL)
  const { content, announcements, devotionals, links, photos, committee } = data
  const missionItems = (content.mission ?? '').split('\n').map((m) => m.replace(/^[•-]\s*/, '').trim()).filter(Boolean)
  const bph = groupCommittee(committee).bph
  const [lead, ...restAnn] = announcements

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <Navbar />
      <main>
        {/* SAMPUL */}
        <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
          <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7">
              <div className="kicker mb-6 sm:mb-8">Persekutuan Doa Revive · Universitas Trunodjoyo Madura</div>
              <h1 className="display text-[3rem] sm:text-6xl lg:text-[5.5rem]">
                Unit Kegiatan <em className="font-normal text-brand-600">Kerohanian</em> Kristen
              </h1>
              {loading ? (
                <div className="mt-8 h-16 max-w-lg animate-pulse bg-paper-200" aria-hidden="true" />
              ) : (
                <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-700">{content.about ?? DEFAULT_ABOUT}</p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold">
                <Link to="/pengumuman" className="inline-flex items-center gap-2 border-b-2 border-brand-600 pb-1 text-brand-600 hover:text-brand-700">
                  Baca pengumuman <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/kepengurusan" className="border-b-2 border-transparent pb-1 hover:border-ink-900">Kenali pengurus</Link>
              </div>
              {error && <p role="alert" className="mt-6 text-xs text-ink-500">Sebagian konten belum bisa dimuat. Coba muat ulang halaman.</p>}
            </div>
            <HeroPhotos photos={photos} />
          </div>
        </section>

        {/* DAFTAR ISI */}
        <section aria-label="Daftar isi" className="mx-auto max-w-6xl px-5 sm:px-6">
          <ol className="border-t border-ink-900">
            {PUBLIC_NAV.map(({ to, label, desc }, i) => (
              <li key={to} className="border-b border-paper-300">
                <Link to={to} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-3 py-4 sm:grid-cols-[4rem_1fr_1.2fr_auto] sm:py-5">
                  <span className="text-xs font-bold text-ink-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="display text-2xl group-hover:text-brand-600 sm:text-4xl">{label}</span>
                  <span className="hidden text-sm text-ink-500 sm:block">{desc}</span>
                  <ArrowRight size={18} className="text-ink-400 group-hover:text-brand-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* PENGUMUMAN */}
        {lead && (
          <Section eyebrow="Terkini" title="Pengumuman" to="/pengumuman">
            <div className="grid gap-8 md:grid-cols-12 md:gap-12">
              <Link to={`/pengumuman/${lead.id}`} className="group md:col-span-7">
                <FramedImage src={lead.image_url} alt={lead.title} ratio="aspect-[4/3]" placeholder={`Foto kegiatan: ${lead.title}`} />
                <time dateTime={lead.created_at} className="kicker mt-5 block">{formatDate(lead.created_at)}</time>
                <h3 className="display mt-2 text-3xl group-hover:text-brand-600 sm:text-5xl">{lead.title}</h3>
                <p className="mt-3 max-w-xl leading-relaxed text-ink-700">{excerpt(lead.content, 200)}</p>
              </Link>
              <div className="md:col-span-5">
                {restAnn.map((a) => (
                  <Link key={a.id} to={`/pengumuman/${a.id}`} className="group block border-t border-ink-900 py-5 first:border-t-0 first:pt-0 md:first:border-t md:first:pt-5">
                    <time dateTime={a.created_at} className="kicker">{formatDate(a.created_at)}</time>
                    <h3 className="display mt-2 text-2xl group-hover:text-brand-600">{a.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-700">{excerpt(a.content, 120)}</p>
                  </Link>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* RENUNGAN */}
        {devotionals.length > 0 && (
          <Section eyebrow="Firman" title="Renungan" to="/renungan">
            <div className="grid gap-x-12 md:grid-cols-12">
              <Link to={`/renungan/${devotionals[0].id}`} className="group md:col-span-7">
                {devotionals[0].verse && (
                  <blockquote className="display border-l-2 border-brand-600 pl-5 text-3xl font-normal italic group-hover:text-brand-600 sm:text-5xl">
                    “{devotionals[0].verse}”
                  </blockquote>
                )}
                <h3 className="mt-6 text-lg font-bold">{devotionals[0].title}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-ink-700">{excerpt(devotionals[0].content, 220)}</p>
              </Link>
              <div className="mt-10 md:col-span-5 md:mt-0">
                {devotionals.slice(1).map((d) => (
                  <Link key={d.id} to={`/renungan/${d.id}`} className="group block border-t border-ink-900 py-5">
                    <time dateTime={d.created_at} className="kicker">{formatDate(d.created_at)}</time>
                    <h3 className="display mt-2 text-2xl group-hover:text-brand-600">{d.title}</h3>
                    {d.verse && <p className="mt-1 line-clamp-2 text-sm text-ink-500 italic">“{d.verse}”</p>}
                  </Link>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* VISI MISI */}
        {(content.vision || missionItems.length > 0) && (
          <Section eyebrow="Fondasi" title="Visi & Misi">
            <div className="grid gap-10 md:grid-cols-12 md:gap-12">
              {content.vision && (
                <div className="md:col-span-7">
                  <div className="kicker mb-4">Visi</div>
                  <p className="display text-3xl font-normal sm:text-5xl">{content.vision}</p>
                </div>
              )}
              {missionItems.length > 0 && (
                <div className="md:col-span-5">
                  <div className="kicker mb-4">Misi</div>
                  <ol className="border-t border-ink-900">
                    {missionItems.map((m, i) => (
                      <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-paper-300 py-4 text-[15px] leading-relaxed">
                        <span className="display text-xl text-brand-600 tabular-nums">{i + 1}</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* BPH */}
        {bph.length > 0 && (
          <Section eyebrow="Pengurus Harian" title="Kenali BPH" to="/kepengurusan">
            <MemberGrid members={bph} className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4" />
          </Section>
        )}

        {/* GALERI */}
        {photos.length > 0 && (
          <Section eyebrow="Kebersamaan" title="Galeri" to="/galeri">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.slice(0, 5).map((p, i) => (
                <Link key={p.id} to="/galeri" className={`group relative aspect-[4/3] overflow-hidden bg-paper-200 ${i === 0 ? 'col-span-2 md:row-span-2 md:aspect-auto' : ''}`}>
                  <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} loading="lazy" className="h-full w-full object-cover" />
                  {p.caption && <span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-ink-900">{p.caption}</span>}
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* SOSMED */}
        {links.length > 0 && (
          <Section eyebrow="Terhubung" title="Ikuti & Hubungi Kami">
            <ul className="border-t border-ink-900 md:max-w-2xl">
              {links.map((l) => (
                <li key={l.id} className="border-b border-paper-300">
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-4 font-semibold hover:text-brand-600">
                    <SocialIcon platform={detectPlatform(l.url)} />
                    <span className="flex-1">{l.label}</span>
                    <ExternalLink size={16} className="text-ink-400 group-hover:text-brand-600" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  )
}
