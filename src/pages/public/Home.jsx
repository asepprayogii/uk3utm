import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { groupCommittee } from '../../lib/committee'
import { DEFAULT_ABOUT, fetchHomePhotos } from '../../lib/siteContent'
import { fetchPhotos } from '../../lib/gallery'
import { isVideo } from '../../lib/video'
import { shuffled } from '../../lib/random'
import { linkDisplay } from '../../lib/social'
import { PUBLIC_NAV } from '../../lib/nav'
import { useAsyncData } from '../../hooks/useAsyncData'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import FramedImage from '../../components/FramedImage'
import SocialIcon from '../../components/SocialIcon'
import Reveal from '../../components/Reveal'
import VisionMission from '../../components/VisionMission'
import MemberGrid from '../../components/committee/MemberCard'

const INITIAL = { content: {}, announcements: [], devotionals: [], links: [], photos: [], gallery: [], committee: [] }

// Satu query yang gagal tidak boleh merusak seluruh beranda.
async function fetchHome() {
  const results = await Promise.allSettled([
    supabase.from('site_content').select('*'),
    supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
    supabase.from('devotionals').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('links').select('*').order('order_index'),
    supabase.from('committee').select('*'),
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
  const gallery = (await fetchPhotos(80).catch(() => [])).filter((p) => !isVideo(p))
  return {
    content,
    announcements: announcements ?? [],
    devotionals: devotionals ?? [],
    links: links ?? [],
    photos,
    gallery,
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
      <figure>
        <FramedImage ratio="aspect-[3/2]" eager />
      </figure>
    )
  }

  // Tanpa judul foto di halaman depan.
  return (
    <figure
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
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      {count > 1 && (
        <div className="mt-1 flex justify-center gap-1.5">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setIndex(i)} aria-label={`Tampilkan foto ${i + 1}`} aria-current={i === current} className="py-2">
              <span className={`block h-0.5 w-6 transition-colors duration-500 ${i === current ? 'bg-brand-600' : 'bg-paper-300'}`} />
            </button>
          ))}
        </div>
      )}
    </figure>
  )
}

// Kolase dengan pola tetap: bingkai tiap foto berukuran pasti dan gambar dipotong mengisi bingkai,
// jadi foto potret maupun lanskap tidak mengubah tata letak.
const COLLAGE = {
  1: ['md:col-span-4 md:row-span-2'],
  2: ['md:col-span-2 md:row-span-2', 'md:col-span-2 md:row-span-2'],
  3: ['md:col-span-2 md:row-span-2', 'md:col-span-2', 'md:col-span-2'],
  4: ['md:col-span-2 md:row-span-2', 'md:col-span-2', 'md:col-span-1', 'md:col-span-1'],
  5: ['md:col-span-2 md:row-span-2', 'md:col-span-1', 'md:col-span-1', 'md:col-span-1', 'md:col-span-1'],
}
function Collage({ photos }) {
  const n = photos.length
  const spans = COLLAGE[n] ?? COLLAGE[5]
  return (
    <div className={`grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 ${n === 1 ? 'md:aspect-[16/7]' : n === 2 ? 'md:aspect-[16/7]' : 'md:aspect-[2/1]'}`}>
      {photos.map((p, i) => {
        const first = i === 0 && n >= 3
        const orphan = i === n - 1 && n >= 3 && (n - 1) % 2 === 1 // di HP, satu foto kecil yang sendirian dibuat selebar baris
        const mobile = n === 1 ? 'col-span-2 aspect-[16/10]' : first ? 'col-span-2 aspect-[4/3]' : orphan ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
        return (
          <Link key={p.id} to="/galeri" className={`group relative overflow-hidden bg-paper-200 ${mobile} md:aspect-auto ${spans[i]}`}>
            <img src={p.photo_url} alt={p.caption || 'Foto kegiatan'} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[50%_30%] transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
          </Link>
        )
      })}
    </div>
  )
}

function Section({ eyebrow, title, to, children, className = '' }) {
  return (
    <Reveal as="section" className={`mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24 ${className}`}>
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
    </Reveal>
  )
}

export default function Home() {
  const { data, loading, error } = useAsyncData(fetchHome, INITIAL, { live: true })
  const { content, announcements, devotionals, links, photos, gallery, committee } = data
  // Foto di bagian Galeri beranda diacak dari seluruh galeri; berubah tiap halaman dibuka.
  const [seed] = useState(() => Math.random())
  const strip = useMemo(() => shuffled(gallery, seed).slice(0, 5), [gallery, seed])
  const missionItems = (content.mission ?? '').split('\n').map((m) => m.replace(/^[•-]\s*/, '').trim()).filter(Boolean)
  const grouped = groupCommittee(committee)
  const bph = grouped.bph
  const [lead, ...restAnn] = announcements

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <Navbar />
      <main>
        {/* SAMPUL */}
        <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
          <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7">
              <h1 className="display animate-fade-up text-[3rem] sm:text-6xl lg:text-[5.5rem]">
                Unit Kegiatan <em className="font-normal text-brand-600">Kerohanian</em> Kristen
              </h1>
              {loading ? (
                <div className="mt-8 h-16 max-w-lg animate-pulse bg-paper-200" aria-hidden="true" />
              ) : (
                <p style={{ animationDelay: '180ms' }} className="mt-8 max-w-md animate-fade-up text-lg leading-relaxed text-ink-700">{content.about ?? DEFAULT_ABOUT}</p>
              )}
              <div style={{ animationDelay: '260ms' }} className="mt-8 flex animate-fade-up flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold">
                <Link to="/pengumuman" className="inline-flex items-center gap-2 border-b-2 border-brand-600 pb-1 text-brand-600 hover:text-brand-700">
                  Baca pengumuman <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/kepengurusan" className="border-b-2 border-transparent pb-1 hover:border-ink-900">Kenali pengurus</Link>
              </div>
              {error && <p role="alert" className="mt-6 text-xs text-ink-500">Sebagian konten belum bisa dimuat. Coba muat ulang halaman.</p>}
            </div>
            <div style={{ animationDelay: '200ms' }} className="animate-fade-up md:col-span-5"><HeroPhotos photos={photos} /></div>
          </div>
        </section>

        {/* DAFTAR ISI */}
        <section aria-label="Daftar isi" className="mx-auto max-w-6xl px-5 sm:px-6">
          <ol className="border-t border-ink-900">
            {PUBLIC_NAV.map(({ to, label, desc }) => (
              <li key={to} className="border-b border-paper-300">
                <Link to={to} className="group grid grid-cols-[1fr_auto] items-baseline gap-x-3 py-4 sm:grid-cols-[1fr_1.2fr_auto] sm:py-5">
                  <span className="display text-2xl group-hover:text-brand-600 sm:text-4xl">{label}</span>
                  <span className="hidden text-sm text-ink-500 sm:block">{desc}</span>
                  <ArrowRight size={18} className="text-ink-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-600" aria-hidden="true" />
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
                <FramedImage src={lead.image_url} alt={lead.title} ratio="aspect-[4/3]" />
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
                <time dateTime={devotionals[0].created_at} className="kicker">{formatDate(devotionals[0].created_at)}</time>
                <h3 className="display mt-3 text-3xl group-hover:text-brand-600 sm:text-5xl">{devotionals[0].title}</h3>
                {devotionals[0].verse && (
                  <blockquote className="mt-5 max-w-xl border-l-2 border-brand-600 pl-4 text-base leading-relaxed text-ink-500 italic">
                    “{devotionals[0].verse}”
                  </blockquote>
                )}
                <p className="mt-4 max-w-xl leading-relaxed text-ink-700">{excerpt(devotionals[0].content, 220)}</p>
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
            <VisionMission vision={content.vision} mission={missionItems} />
          </Section>
        )}

        {/* BPH */}
        {bph.length > 0 && (
          <Section eyebrow="Pengurus Harian" title="Kenali BPH" to="/kepengurusan">
            <MemberGrid members={bph} linkTo="/kepengurusan" className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4" />
          </Section>
        )}

        {/* GALERI */}
        {strip.length > 0 && (
          <Section eyebrow="Kebersamaan" title="Galeri" to="/galeri">
            <Collage photos={strip} />
          </Section>
        )}

        {/* SOSMED */}
        {links.length > 0 && (
          <Section eyebrow="Terhubung" title="Ikuti & Hubungi Kami">
            <ul className="border-t border-ink-900 md:max-w-2xl">
              {links.map((l) => {
                const d = linkDisplay(l)
                return (
                <li key={l.id} className="border-b border-paper-300">
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-4 font-semibold hover:text-brand-600">
                    <SocialIcon platform={d.platform} />
                    <span className="flex-1">{d.text}<span className="kicker ml-3 !text-ink-400">{d.platformName}</span></span>
                    <ExternalLink size={16} className="text-ink-400 group-hover:text-brand-600" aria-hidden="true" />
                  </a>
                </li>
                )
              })}
            </ul>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  )
}
