import { Link } from 'react-router-dom'
import { ArrowRight, Megaphone, Pin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import Cover from '../../components/Cover'
import Reveal from '../../components/Reveal'
import Badge from '../../components/ui/Badge'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchAnnouncements = () =>
  unwrap(supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })).then((r) => r ?? [])

function Meta({ a }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {a.pinned && <Badge tone="gold" icon={Pin}>Disematkan</Badge>}
      <time dateTime={a.created_at} className="kicker">{formatDate(a.created_at)}</time>
    </div>
  )
}

// Pengumuman terbaru (atau yang disematkan): besar, sampul kiri, teks kanan.
function Featured({ a }) {
  return (
    <Link to={`/pengumuman/${a.id}`} className="group mb-16 grid gap-6 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-7">
        <Cover src={a.image_url} alt={a.title} date={a.created_at} eager />
      </div>
      <div className="flex flex-col justify-end md:col-span-5">
        <Meta a={a} />
        <h2 className="display mt-3 text-4xl group-hover:text-brand-600 sm:text-5xl">{a.title}</h2>
        <p className="mt-4 line-clamp-5 leading-relaxed text-ink-700">{excerpt(a.content, 240)}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">Baca selengkapnya <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" /></span>
      </div>
    </Link>
  )
}

// Kartu seragam: garis tegas di atas, sampul (gambar atau ubin tanggal), tanggal, judul, ringkasan, "Baca".
function Card({ a }) {
  return (
    <Link to={`/pengumuman/${a.id}`} className="group flex h-full flex-col border-t-2 border-ink-900 pt-5">
      <Cover src={a.image_url} alt="" date={a.created_at} />
      <div className="mt-5"><Meta a={a} /></div>
      <h3 className="display mt-2 text-2xl group-hover:text-brand-600 sm:text-[1.75rem]">{a.title}</h3>
      <p className="mt-2 line-clamp-3 leading-relaxed text-ink-700">{excerpt(a.content, 160)}</p>
      <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-brand-600">Baca <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" /></span>
    </Link>
  )
}

export default function Pengumuman() {
  const { data, loading, error, retry } = useAsyncData(fetchAnnouncements, EMPTY, { live: true })
  const [first, ...rest] = data

  return (
    <PageLayout eyebrow="Info Terbaru" title="Pengumuman" description="Jadwal, kegiatan, dan kabar terbaru dari UK3 UTM. Ketuk salah satu untuk membaca selengkapnya.">
      {loading && <Loading />}
      {error && <ErrorState message="Pengumuman gagal dimuat." onRetry={retry} />}
      {!loading && !error && data.length === 0 && <EmptyState icon={Megaphone} title="Belum ada pengumuman">Pengumuman baru akan muncul di sini.</EmptyState>}
      {first && <Featured a={first} />}
      {rest.length > 0 && (
        <section aria-label="Pengumuman lainnya">
          <h2 className="kicker mb-6">Pengumuman lainnya</h2>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a, i) => <Reveal key={a.id} delay={Math.min(i, 5) * 50} className="h-full"><Card a={a} /></Reveal>)}
          </div>
        </section>
      )}
    </PageLayout>
  )
}
