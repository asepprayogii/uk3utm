import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { excerpt, formatDate } from '../../lib/format'
import { unwrap, useAsyncData } from '../../hooks/useAsyncData'
import PageLayout from '../../components/PageLayout'
import FramedImage from '../../components/FramedImage'
import Button from '../../components/ui/Button'
import { EmptyState, ErrorState, Loading } from '../../components/States'

const INITIAL = { item: null, others: [] }

export default function RenunganDetail() {
  const { id } = useParams()
  const fetcher = useCallback(async () => {
    const [item, others] = await Promise.all([
      unwrap(supabase.from('devotionals').select('*').eq('id', id).maybeSingle()),
      unwrap(supabase.from('devotionals').select('*').neq('id', id).order('created_at', { ascending: false }).limit(3)),
    ])
    return { item, others: others ?? [] }
  }, [id])
  const { data, loading, error, retry } = useAsyncData(fetcher, INITIAL)
  const { item, others } = data

  return (
    <PageLayout eyebrow={item ? formatDate(item.created_at) : 'Renungan'} title={item?.title ?? 'Renungan'} crumbLabel="Baca" crumbs={[{ to: '/renungan', label: 'Renungan' }]} width="max-w-3xl">
      {loading && <Loading />}
      {error && <ErrorState message="Renungan gagal dimuat." onRetry={retry} />}
      {!loading && !error && !item && (
        <EmptyState icon={BookOpen} title="Renungan tidak ditemukan" action={<Button to="/renungan" variant="secondary">Lihat semua renungan</Button>}>Mungkin sudah dihapus atau linknya keliru.</EmptyState>
      )}
      {item && (
        <article>
          {item.image_url && <img src={item.image_url} alt={item.title} className="mb-8 w-full rounded-2xl border border-paper-300 bg-paper-100 shadow-soft" />}
          {item.verse && (
            <blockquote className="mb-8 border-l-4 border-gold-400 bg-gold-200/30 py-4 pr-4 pl-5 font-display text-2xl leading-snug text-brand-800 italic">“{item.verse}”</blockquote>
          )}
          <div className="text-[17px] leading-[1.85] whitespace-pre-line text-ink-700">{item.content}</div>
          <div className="mt-10 border-t border-paper-300 pt-6"><Button to="/renungan" variant="secondary" icon={ArrowLeft}>Semua renungan</Button></div>
        </article>
      )}
      {others.length > 0 && item && (
        <section className="mt-14">
          <h2 className="mb-5 text-sm font-bold tracking-widest text-ink-500 uppercase">Renungan lainnya</h2>
          <div className="flex flex-col gap-3">
            {others.map((d) => (
              <Link key={d.id} to={`/renungan/${d.id}`} className="group flex items-center gap-4 rounded-2xl border border-paper-300 bg-white p-3 transition-shadow hover:shadow-soft">
                <FramedImage src={d.image_url} alt="" className="w-32 shrink-0 rounded-xl sm:w-40" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gold-700">{formatDate(d.created_at)}</div>
                  <div className="line-clamp-1 font-bold text-ink-900">{d.title}</div>
                  <div className="line-clamp-2 text-sm text-ink-500">{d.verse || excerpt(d.content, 100)}</div>
                </div>
                <ArrowRight size={16} className="hidden shrink-0 text-ink-300 group-hover:text-brand-700 sm:block" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageLayout>
  )
}
