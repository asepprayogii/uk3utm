import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import FramedImage from '../../components/FramedImage'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []
const fetchDevotionals = () => unwrap(supabase.from('devotionals').select('*').order('created_at', { ascending: false })).then((r) => r ?? [])

export default function Renungan() {
  const { data, loading, error, retry } = useAsyncData(fetchDevotionals, EMPTY)
  return (
    <PageLayout eyebrow="Firman Tuhan" title="Renungan" description="Bacaan singkat untuk menguatkan iman. Ketuk salah satu untuk membaca selengkapnya." width="max-w-6xl">
      {loading && <Loading />}
      {error && <ErrorState message="Renungan gagal dimuat." onRetry={retry} />}
      {!loading && !error && data.length === 0 && <EmptyState icon={BookOpen} title="Belum ada renungan">Renungan baru akan muncul di sini.</EmptyState>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d) => (
          <Link key={d.id} to={`/renungan/${d.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-paper-300 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <FramedImage src={d.image_url} alt={d.title} />
            <div className="flex flex-1 flex-col p-5">
              <time dateTime={d.created_at} className="text-xs font-semibold text-gold-700">{formatDate(d.created_at)}</time>
              <h3 className="mt-2 line-clamp-2 text-lg leading-snug font-bold text-ink-900">{d.title}</h3>
              {d.verse && <p className="mt-2 line-clamp-2 font-display text-lg leading-snug text-brand-700 italic">“{d.verse}”</p>}
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-500">{excerpt(d.content, 150)}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 group-hover:gap-2.5">Baca selengkapnya <ArrowRight size={15} aria-hidden="true" /></span>
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}
