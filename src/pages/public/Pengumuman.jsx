import { Megaphone, Pin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import Badge from '../../components/ui/Badge'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const EMPTY = []

const fetchAnnouncements = () =>
  unwrap(
    supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
  ).then((rows) => rows ?? [])

export default function Pengumuman() {
  const { data, loading, error, retry } = useAsyncData(fetchAnnouncements, EMPTY)

  return (
    <PageLayout eyebrow="Info Terbaru" title="Pengumuman" description="Jadwal, kegiatan, dan kabar terbaru dari UK3 UTM.">
      {loading && <Loading />}
      {error && <ErrorState message="Pengumuman gagal dimuat." onRetry={retry} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState icon={Megaphone} title="Belum ada pengumuman">Pengumuman baru akan muncul di sini.</EmptyState>
      )}

      <div className="flex flex-col gap-6">
        {data.map((a) => (
          <article
            key={a.id}
            className={`overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-lift ${
              a.pinned ? 'border-gold-400' : 'border-paper-300'
            }`}
          >
            {a.image_url && <img src={a.image_url} alt={a.title} loading="lazy" className="max-h-80 w-full object-cover" />}
            <div className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {a.pinned && (
                  <Badge tone="gold">
                    <Pin size={11} aria-hidden="true" /> Disematkan
                  </Badge>
                )}
                <time dateTime={a.created_at} className="text-xs font-medium text-ink-400">
                  {formatDate(a.created_at)}
                </time>
              </div>
              <h2 className="font-display text-2xl font-bold text-brand-900">{a.title}</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-700">{a.content}</p>
            </div>
          </article>
        ))}
      </div>
    </PageLayout>
  )
}
