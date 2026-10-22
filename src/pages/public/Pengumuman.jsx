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
    <div className="flex flex-wrap items-center gap-2">
      {a.pinned && <Badge tone="gold" icon={Pin}>Disematkan</Badge>}
      <time dateTime={a.created_at} className="text-xs font-semibold text-gold-700">{formatDate(a.created_at)}</time>
    </div>
  )
}

function Featured({ a }) {
  return (
    <Link to={`/pengumuman/${a.id}`} className="group mb-10 grid overflow-hidden rounded-3xl border border-paper-300 bg-white shadow-soft transition-shadow hover:shadow-lift md:grid-cols-2">
      <FramedImage src={a.image_url} alt={a.title} ratio="aspect-video md:aspect-auto md:min-h-[22rem]" eager />
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <Meta a={a} />
        <h2 className="mt-3 font-display text-3xl leading-tight font-bold text-brand-900 sm:text-4xl">{a.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{excerpt(a.content, 220)}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 group-hover:gap-2.5">Baca selengkapnya <ArrowRight size={16} aria-hidden="true" /></span>
      </div>
    </Link>
  )
}

function Card({ a }) {
  return (
    <Link to={`/pengumuman/${a.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-paper-300 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <FramedImage src={a.image_url} alt={a.title} />
      <div className="flex flex-1 flex-col p-5">
        <Meta a={a} />
        <h3 className="mt-2 line-clamp-2 text-lg leading-snug font-bold text-ink-900">{a.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-500">{excerpt(a.content, 160)}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 group-hover:gap-2.5">Baca selengkapnya <ArrowRight size={15} aria-hidden="true" /></span>
      </div>
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
        <>
          <h2 className="mb-5 text-sm font-bold tracking-widest text-ink-500 uppercase">Pengumuman lainnya</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.map((a) => <Card key={a.id} a={a} />)}</div>
        </>
      )}
    </PageLayout>
  )
}
