import { Pin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []

const fetchAnnouncements = () =>
  unwrap(
    supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false }),
  ).then((rows) => rows ?? [])

export default function Pengumuman() {
  const { data, loading, error, retry } = useAsyncData(fetchAnnouncements, EMPTY)

  return (
    <PageLayout>
      <PageHeader eyebrow="Info" title="Pengumuman" />

      {loading && <Loading />}
      {error && <ErrorState message="Pengumuman gagal dimuat." onRetry={retry} />}
      {!loading && !error && data.length === 0 && <EmptyState>Belum ada pengumuman.</EmptyState>}

      <div className="flex flex-col gap-5">
        {data.map((a) => (
          <article
            key={a.id}
            className="rounded-2xl border border-gold-500/15 bg-navy-800 p-6 transition-colors hover:border-gold-500/30"
          >
            {a.pinned && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs text-gold-500">
                <Pin size={12} aria-hidden="true" /> Disematkan
              </span>
            )}
            {a.image_url && (
              <img
                src={a.image_url}
                alt={a.title}
                loading="lazy"
                className="mb-4 h-48 w-full rounded-xl object-cover"
              />
            )}
            <time dateTime={a.created_at} className="mb-2 block text-xs text-gold-500">
              {formatDate(a.created_at)}
            </time>
            <h2 className="mb-2 text-lg font-semibold">{a.title}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-cream/60">{a.content}</p>
          </article>
        ))}
      </div>
    </PageLayout>
  )
}
