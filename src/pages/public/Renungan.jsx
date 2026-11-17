import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
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
      <div className="border-b border-ink-900">
        {data.map((d) => (
          <Link key={d.id} to={`/renungan/${d.id}`} className="group grid gap-4 border-t border-ink-900 py-7 md:grid-cols-12 md:gap-10">
            <time dateTime={d.created_at} className="kicker md:col-span-2">{formatDate(d.created_at)}</time>
            <div className="md:col-span-7">
              {d.verse && <p className="display text-2xl font-normal italic group-hover:text-brand-600 sm:text-4xl">“{d.verse}”</p>}
              <h3 className={`font-bold ${d.verse ? 'mt-4 text-base' : 'display text-3xl font-semibold'}`}>{d.title}</h3>
              <p className="mt-2 line-clamp-3 leading-relaxed text-ink-700">{excerpt(d.content, 180)}</p>
            </div>
            <div className="md:col-span-3">
              <FramedImage src={d.image_url} alt={d.title} ratio="aspect-[4/3]" placeholder={`Foto renungan: ${d.title}`} />
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}
