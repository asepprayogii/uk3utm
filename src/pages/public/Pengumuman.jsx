import { Link } from 'react-router-dom'
import { ArrowRight, Megaphone, Pin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import FramedImage from '../../components/FramedImage'
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

function Featured({ a }) {
  return (
    <Link to={`/pengumuman/${a.id}`} className="group mb-14 grid gap-6 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-7">
        <FramedImage src={a.image_url} alt={a.title} ratio="aspect-[4/3]" eager placeholder={`Foto kegiatan: ${a.title}`} />
      </div>
      <div className="flex flex-col justify-end md:col-span-5">
        <Meta a={a} />
        <h2 className="display mt-3 text-4xl group-hover:text-brand-600 sm:text-5xl">{a.title}</h2>
        <p className="mt-4 leading-relaxed text-ink-700">{excerpt(a.content, 240)}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">Baca selengkapnya <ArrowRight size={16} aria-hidden="true" /></span>
      </div>
    </Link>
  )
}

function Row({ a }) {
  return (
    <Link to={`/pengumuman/${a.id}`} className="group grid gap-4 border-t border-ink-900 py-6 sm:grid-cols-[10rem_1fr] md:grid-cols-[12rem_1fr_9rem] md:gap-8">
      <FramedImage src={a.image_url} alt="" ratio="aspect-[4/3]" className="order-last sm:order-first" placeholder={a.title} />
      <div className="min-w-0">
        <Meta a={a} />
        <h3 className="display mt-2 text-2xl group-hover:text-brand-600 sm:text-3xl">{a.title}</h3>
        <p className="mt-2 line-clamp-3 leading-relaxed text-ink-700">{excerpt(a.content, 200)}</p>
      </div>
      <span className="hidden items-start justify-end gap-2 text-sm font-semibold text-brand-600 md:flex">Baca <ArrowRight size={16} aria-hidden="true" /></span>
    </Link>
  )
}

export default function Pengumuman() {
  const { data, loading, error, retry } = useAsyncData(fetchAnnouncements, EMPTY)
  const [first, ...rest] = data

  return (
    <PageLayout eyebrow="Info Terbaru" title="Pengumuman" description="Jadwal, kegiatan, dan kabar terbaru dari UK3 UTM. Ketuk salah satu untuk membaca selengkapnya." width="max-w-6xl">
      {loading && <Loading />}
      {error && <ErrorState message="Pengumuman gagal dimuat." onRetry={retry} />}
      {!loading && !error && data.length === 0 && <EmptyState icon={Megaphone} title="Belum ada pengumuman">Pengumuman baru akan muncul di sini.</EmptyState>}
      {first && <Featured a={first} />}
      {rest.length > 0 && (
        <section aria-label="Pengumuman lainnya">
          <h2 className="kicker mb-4">Pengumuman lainnya</h2>
          <div className="border-b border-ink-900">{rest.map((a) => <Row key={a.id} a={a} />)}</div>
        </section>
      )}
    </PageLayout>
  )
}
